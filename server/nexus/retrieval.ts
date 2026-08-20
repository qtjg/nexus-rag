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
};

export type RankedChunk = CandidateChunk & { score: number; matchedTerms: string[] };

const STOP_WORDS = new Set(["a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "how", "i", "in", "is", "it", "of", "on", "or", "that", "the", "to", "what", "when", "where", "which", "with", "you", "your"]);

export const RETRIEVAL_VERSION = "lexical-evidence-v1";
export const EVIDENCE_THRESHOLD = 0.16;

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function terms(value: string) {
  return Array.from(new Set(value.toLowerCase().match(/[a-z0-9_/-]{2,}/g)?.filter((term) => !STOP_WORDS.has(term)) ?? []));
}

function countTokens(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
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
    drafts.push({
      text,
      ordinal: drafts.length,
      sectionPath,
      tokenCount: countTokens(text),
      charOffsetStart: safeStart,
      charOffsetEnd: safeStart + text.length,
      contentHash: hash(text),
    });
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
    const sentences = part.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const sentence of sentences) {
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

  const scored = candidates.map((candidate) => {
    const text = `${candidate.title} ${candidate.sectionPath ?? ""} ${candidate.text}`.toLowerCase();
    const matchedTerms = queryTerms.filter((term) => text.includes(term));
    const coverage = matchedTerms.length / queryTerms.length;
    const phraseBonus = normalizedQuestion.length > 8 && candidate.text.toLowerCase().includes(normalizedQuestion) ? 0.25 : 0;
    const titleBonus = queryTerms.some((term) => candidate.title.toLowerCase().includes(term)) ? 0.08 : 0;
    return { ...candidate, score: Math.min(1, coverage + phraseBonus + titleBonus), matchedTerms };
  }).filter((candidate) => candidate.score > 0).sort((a, b) => b.score - a.score);

  const sourceCounts = new Map<number, number>();
  const selected: RankedChunk[] = [];
  for (const candidate of scored) {
    const currentCount = sourceCounts.get(candidate.sourceId) ?? 0;
    if (currentCount >= 2) continue;
    selected.push(candidate);
    sourceCounts.set(candidate.sourceId, currentCount + 1);
    if (selected.length >= limit) break;
  }
  return selected;
}

export function createPipelineFingerprint() {
  return hash(["parser:text-v1", "chunker:structure-v1", "embedding:lexical-v1", `retrieval:${RETRIEVAL_VERSION}`, "prompt:grounded-v1", "policy:org-scope-v1"].join("|"));
}

export function buildGroundedPrompt(question: string, evidence: RankedChunk[]) {
  const blocks = evidence.map((chunk, index) => {
    const marker = `[${index + 1}]`;
    return `${marker} SOURCE: ${chunk.sourceName}\nSECTION: ${chunk.sectionPath ?? "Unsectioned"}\nBEGIN_UNTRUSTED_EVIDENCE\n${chunk.text}\nEND_UNTRUSTED_EVIDENCE`;
  }).join("\n\n");
  return `QUESTION\n${question}\n\nAPPROVED EVIDENCE\n${blocks}`;
}

export function citationMarkersResolve(answer: string, citationCount: number) {
  const mentioned = Array.from(answer.matchAll(/\[(\d+)]/g)).map((match) => Number(match[1]));
  return mentioned.length > 0 && mentioned.every((marker) => marker >= 1 && marker <= citationCount);
}
