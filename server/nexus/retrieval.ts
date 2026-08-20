import { createHash } from "node:crypto";

export type ChunkDraft = {
  text: string;
  ordinal: number;
  sectionPath: string | null;
  tokenCount: number;
  charOffsetStart: number;
  charOffsetEnd: number;
  contentHash: string;
};

export type CandidateChunk = {
  id: number;
  sourceId: number;
  sourceName: string;
  collectionId: number;
  text: string;
  title: string;
  sectionPath: string | null;
  embeddingJson: string | null;
};

export type RankedChunk = CandidateChunk & { score: number; matchedTerms: string[] };

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i", "in", "is", "it", "of", "on", "or", "that", "the", "to", "what", "when", "where", "which", "with", "you", "your"]);

export const RETRIEVAL_VERSION = "hybrid-hash-vector-sparse-rrf-v1";
export const EVIDENCE_THRESHOLD = 0.16;
export const EMBEDDING_DIMENSIONS = 96;

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function terms(value: string) {
  return Array.from(new Set(value.toLowerCase().match(/[a-z0-9_/-]{2,}/g)?.filter((term) => !STOP_WORDS.has(term)) ?? []));
}

function countTokens(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function stableTokenIndex(token: string) {
  let value = 2166136261;
  for (let index = 0; index < token.length; index += 1) {
    value ^= token.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return (value >>> 0) % EMBEDDING_DIMENSIONS;
}

function normalizeVector(vector: number[]) {
  const norm = Math.sqrt(vector.reduce((sum, entry) => sum + entry * entry, 0));
  return norm ? vector.map((entry) => entry / norm) : vector;
}

export function createLocalEmbedding(value: string) {
  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  const tokenList = terms(value);
  tokenList.forEach((token, index) => {
    vector[stableTokenIndex(token)] += 1;
    if (index < tokenList.length - 1) vector[stableTokenIndex(`${token}_${tokenList[index + 1]}`)] += 0.65;
  });
  return normalizeVector(vector);
}

function cosineSimilarity(first: number[], second: number[]) {
  if (first.length !== second.length) return 0;
  return first.reduce((sum, value, index) => sum + value * second[index], 0);
}

function parseEmbedding(value: string | null, fallback: string) {
  if (value) {
    try {
      const parsed = JSON.parse(value) as number[];
      if (Array.isArray(parsed) && parsed.length === EMBEDDING_DIMENSIONS && parsed.every((entry) => typeof entry === "number")) return parsed;
    } catch {
      // Existing rows are re-embedded in memory until the next source replay.
    }
  }
  return createLocalEmbedding(fallback);
}

export function chunkText(rawText: string, maxTokens = 380): ChunkDraft[] {
  const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];
  const parts = normalized.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const drafts: ChunkDraft[] = [];
  let sectionPath: string | null = null;
  let buffer = "";
  let offset = 0;
  const flush = () => {
    const text = buffer.trim();
    if (!text) return;
    const start = normalized.indexOf(text, Math.max(0, offset - text.length - 16));
    const safeStart = start >= 0 ? start : offset;
    drafts.push({ text, ordinal: drafts.length, sectionPath, tokenCount: countTokens(text), charOffsetStart: safeStart, charOffsetEnd: safeStart + text.length, contentHash: hash(text) });
    offset = safeStart + text.length;
    buffer = "";
  };
  for (const part of parts) {
    const heading = part.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      flush();
      sectionPath = heading[2].trim();
      continue;
    }
    const proposed = buffer ? `${buffer}\n\n${part}` : part;
    if (countTokens(proposed) <= maxTokens) {
      buffer = proposed;
      continue;
    }
    flush();
    for (const sentence of part.split(/(?<=[.!?])\s+/).filter(Boolean)) {
      const joined = buffer ? `${buffer} ${sentence}` : sentence;
      if (countTokens(joined) > maxTokens && buffer) flush();
      buffer = buffer ? `${buffer} ${sentence}` : sentence;
    }
  }
  flush();
  return drafts;
}

export function rankCandidateChunks(question: string, candidates: CandidateChunk[], limit = 6): RankedChunk[] {
  const queryTerms = terms(question);
  const normalizedQuestion = question.trim().toLowerCase();
  if (!queryTerms.length) return [];
  const queryEmbedding = createLocalEmbedding(question);
  const scored = candidates.map((candidate) => {
    const fullText = `${candidate.title} ${candidate.sectionPath ?? ""} ${candidate.text}`.toLowerCase();
    const matchedTerms = queryTerms.filter((term) => fullText.includes(term));
    const coverage = matchedTerms.length / queryTerms.length;
    const phraseBonus = normalizedQuestion.length > 8 && candidate.text.toLowerCase().includes(normalizedQuestion) ? 0.25 : 0;
    const titleBonus = queryTerms.some((term) => candidate.title.toLowerCase().includes(term)) ? 0.08 : 0;
    const sparseScore = Math.min(1, coverage + phraseBonus + titleBonus);
    const denseScore = Math.max(0, cosineSimilarity(queryEmbedding, parseEmbedding(candidate.embeddingJson, fullText)));
    return { candidate, matchedTerms, sparseScore, denseScore, titleBonus };
  }).filter((entry) => entry.sparseScore > 0 || entry.denseScore >= 0.18);

  const sparseRanks = new Map(scored.slice().sort((a, b) => b.sparseScore - a.sparseScore).map((entry, index) => [entry.candidate.id, index + 1]));
  const denseRanks = new Map(scored.slice().sort((a, b) => b.denseScore - a.denseScore).map((entry, index) => [entry.candidate.id, index + 1]));
  const fused = scored.map((entry) => {
    const sparseRank = sparseRanks.get(entry.candidate.id) ?? 999;
    const denseRank = denseRanks.get(entry.candidate.id) ?? 999;
    const reciprocalRankFusion = 1 / (50 + sparseRank) + 1 / (50 + denseRank);
    const score = Math.min(1, reciprocalRankFusion * 22 + entry.sparseScore * 0.58 + entry.denseScore * 0.28 + entry.titleBonus);
    return { ...entry.candidate, score, matchedTerms: entry.matchedTerms };
  }).sort((a, b) => b.score - a.score);

  const sourceCounts = new Map<number, number>();
  const selected: RankedChunk[] = [];
  for (const candidate of fused) {
    const currentCount = sourceCounts.get(candidate.sourceId) ?? 0;
    if (currentCount >= 2) continue;
    selected.push(candidate);
    sourceCounts.set(candidate.sourceId, currentCount + 1);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function createPipelineFingerprint() {
  return hash(["parser:binary-v1", "chunker:structure-v1", "embedding:hash-vector-v1", `retrieval:${RETRIEVAL_VERSION}`, "prompt:grounded-v1", "policy:org-scope-v1"].join("|"));
}

export function buildGroundedPrompt(question: string, evidence: RankedChunk[]) {
  const blocks = evidence.map((chunk, index) => `[${index + 1}] SOURCE: ${chunk.sourceName}\nSECTION: ${chunk.sectionPath ?? "Unsectioned"}\nBEGIN_UNTRUSTED_EVIDENCE\n${chunk.text}\nEND_UNTRUSTED_EVIDENCE`).join("\n\n");
  return `QUESTION\n${question}\n\nAPPROVED EVIDENCE\n${blocks}`;
}

export function citationMarkersResolve(answer: string, citationCount: number) {
  const mentioned = Array.from(answer.matchAll(/\[(\d+)]/g)).map((match) => Number(match[1]));
  return mentioned.length > 0 && mentioned.every((marker) => marker >= 1 && marker <= citationCount);
}
