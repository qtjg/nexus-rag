import { NexusPageHeader } from "@/components/NexusPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Bot, FileCode2, GitBranch, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const severityStyle: Record<string, string> = {
  critical: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  high: "border-orange-300/25 bg-orange-300/10 text-orange-100",
  medium: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  low: "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  info: "border-slate-300/15 bg-slate-300/10 text-slate-200",
};

export default function GitIntelligence() {
  const workspace = trpc.nexus.workspace.useQuery();
  const utils = trpc.useUtils();
  const orgId = workspace.data?.organization.id;
  const collections = workspace.data?.collections ?? [];
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [repositoryLabel, setRepositoryLabel] = useState("");
  const [repositoryReference, setRepositoryReference] = useState("");
  const [revision, setRevision] = useState("");
  const [baseRevision, setBaseRevision] = useState("");
  const [kind, setKind] = useState<"snapshot" | "diff">("diff");
  const [content, setContent] = useState("");
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<number | null>(null);
  const snapshots = trpc.nexus.gitSnapshots.useQuery({ orgId: orgId ?? 0 }, { enabled: Boolean(orgId) });
  const history = trpc.nexus.gitReviewHistory.useQuery({ orgId: orgId ?? 0, snapshotId: selectedSnapshotId ?? 0 }, { enabled: Boolean(orgId && selectedSnapshotId) });

  useEffect(() => {
    if (!collectionId && collections[0]) setCollectionId(collections[0].id);
  }, [collectionId, collections]);
  useEffect(() => {
    if (!selectedSnapshotId && snapshots.data?.[0]) setSelectedSnapshotId(snapshots.data[0].id);
  }, [selectedSnapshotId, snapshots.data]);

  const register = trpc.nexus.registerGitSnapshot.useMutation({
    onSuccess: (snapshot) => {
      toast.success("Git evidence registered", { description: "The submitted content was stored as scoped source evidence; it was not executed." });
      setContent("");
      setSelectedSnapshotId(snapshot.id);
      utils.nexus.gitSnapshots.invalidate();
      utils.nexus.workspace.invalidate();
    },
    onError: (error) => toast.error("Git evidence could not be registered", { description: error.message }),
  });
  const review = trpc.nexus.reviewGitSnapshot.useMutation({
    onSuccess: (result) => {
      toast.success(result.status === "completed" ? "Cited review completed" : "Review completed with deterministic fallback", { description: result.summary });
      utils.nexus.gitReviewHistory.invalidate();
    },
    onError: (error) => toast.error("Diff review could not be completed", { description: error.message }),
  });

  const submit = () => {
    if (!orgId || !collectionId) return toast.error("Select an approved collection first.");
    if (!repositoryLabel.trim() || !revision.trim() || !content.trim()) return toast.error("Repository label, revision, and submitted Git content are required.");
    register.mutate({ orgId, collectionId, repositoryLabel: repositoryLabel.trim(), repositoryReference: repositoryReference.trim() || undefined, revision: revision.trim(), baseRevision: baseRevision.trim() || undefined, kind, content });
  };
  const currentSnapshot = snapshots.data?.find((snapshot) => snapshot.id === selectedSnapshotId);
  const latestRun = history.data?.runs[0];

  return (
    <div className="mx-auto max-w-[1440px]">
      <NexusPageHeader
        eyebrow="Governed engineering evidence"
        title="Git intelligence"
        description="Register repository snapshots or diffs as collection-scoped evidence, then review submitted changes without cloning repositories, storing credentials, or executing code."
        actions={<Badge className="h-8 border border-cyan-300/20 bg-cyan-300/[0.06] px-3 text-[10px] text-cyan-100 hover:bg-cyan-300/[0.06]"><ShieldCheck className="mr-1.5 size-3.5" /> Non-executing boundary</Badge>}
      />
      <div className="grid gap-5 xl:grid-cols-[.98fr_1.02fr]">
        <section className="nexus-glow-panel rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-white">Register Git evidence</p><p className="mt-1 text-xs leading-5 text-slate-500">Paste an approved snapshot or diff. NEXUS stores bounded source evidence only; repository URLs never contain credentials.</p></div><GitBranch className="size-5 text-cyan-300" /></div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs text-slate-400"><span>Collection scope</span><select value={collectionId ?? ""} onChange={(event) => setCollectionId(Number(event.target.value))} className="h-10 w-full rounded-xl border border-white/10 bg-[#07101f] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300/50">{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></label>
            <label className="space-y-1.5 text-xs text-slate-400"><span>Evidence type</span><select value={kind} onChange={(event) => setKind(event.target.value as "snapshot" | "diff")} className="h-10 w-full rounded-xl border border-white/10 bg-[#07101f] px-3 text-sm text-slate-200 outline-none focus:border-cyan-300/50"><option value="diff">Git diff — reviewable</option><option value="snapshot">Repository snapshot</option></select></label>
            <label className="space-y-1.5 text-xs text-slate-400"><span>Repository label</span><Input value={repositoryLabel} onChange={(event) => setRepositoryLabel(event.target.value)} placeholder="nexus-api" className="border-white/10 bg-[#07101f] text-slate-100" /></label>
            <label className="space-y-1.5 text-xs text-slate-400"><span>Repository reference <span className="text-slate-600">optional, no credentials</span></span><Input value={repositoryReference} onChange={(event) => setRepositoryReference(event.target.value)} placeholder="github.com/org/repository" className="border-white/10 bg-[#07101f] text-slate-100" /></label>
            <label className="space-y-1.5 text-xs text-slate-400"><span>Revision</span><Input value={revision} onChange={(event) => setRevision(event.target.value)} placeholder="a1b2c3d" className="border-white/10 bg-[#07101f] text-slate-100" /></label>
            <label className="space-y-1.5 text-xs text-slate-400"><span>Base revision <span className="text-slate-600">optional</span></span><Input value={baseRevision} onChange={(event) => setBaseRevision(event.target.value)} placeholder="previous commit" className="border-white/10 bg-[#07101f] text-slate-100" /></label>
          </div>
          <label className="mt-4 block space-y-1.5 text-xs text-slate-400"><span>Submitted Git content</span><Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={kind === "diff" ? "diff --git a/src/... b/src/..." : "Approved repository snapshot or selected source files"} className="min-h-[220px] border-white/10 bg-[#07101f] font-mono text-xs leading-6 text-slate-200" /><span className="text-[10px] text-slate-600">{content.length.toLocaleString()} / 120,000 characters retained. Submitted content is untrusted data, never executable instructions.</span></label>
          <Button onClick={submit} disabled={register.isPending || !collections.length} className="mt-5 h-10 bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{register.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <FileCode2 className="mr-2 size-4" />}{register.isPending ? "Registering…" : "Register evidence"}</Button>
        </section>

        <section className="nexus-panel rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-white">Cited diff review</p><p className="mt-1 text-xs leading-5 text-slate-500">Findings preserve exact diff evidence and a diff-line reference. AI assistance is bounded and falls back safely.</p></div><Bot className="size-5 text-cyan-300" /></div>
          <div className="mt-5 max-h-[250px] space-y-2 overflow-auto pr-1">
            {snapshots.isLoading ? <p className="text-sm text-slate-500">Loading Git evidence…</p> : snapshots.data?.length ? snapshots.data.map((snapshot) => <button key={snapshot.id} onClick={() => setSelectedSnapshotId(snapshot.id)} className={`w-full rounded-2xl border p-3 text-left transition-colors ${selectedSnapshotId === snapshot.id ? "border-cyan-300/30 bg-cyan-300/[0.08]" : "border-white/7 bg-white/[0.02] hover:bg-white/[0.045]"}`}><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-200">{snapshot.repositoryLabel}</p><Badge className="border-white/10 bg-white/[0.04] text-[10px] text-slate-400 hover:bg-white/[0.04]">{snapshot.kind}</Badge></div><p className="mt-1 truncate font-mono text-[10px] text-slate-500">{snapshot.revision}{snapshot.baseRevision ? ` ← ${snapshot.baseRevision}` : ""}</p></button>) : <div className="rounded-2xl border border-dashed border-white/10 p-5 text-center text-xs leading-5 text-slate-500">Register a scoped Git diff to begin an evidence-based review.</div>}
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2"><Button onClick={() => selectedSnapshotId && review.mutate({ orgId: orgId!, snapshotId: selectedSnapshotId, mode: "deterministic" })} disabled={!selectedSnapshotId || currentSnapshot?.kind !== "diff" || review.isPending} variant="outline" className="border-cyan-300/20 bg-cyan-300/[0.04] text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50"><Sparkles className="mr-2 size-4" /> Deterministic review</Button><Button onClick={() => selectedSnapshotId && review.mutate({ orgId: orgId!, snapshotId: selectedSnapshotId, mode: "ai_assisted" })} disabled={!selectedSnapshotId || currentSnapshot?.kind !== "diff" || review.isPending} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{review.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Bot className="mr-2 size-4" />} AI-assisted review</Button>{currentSnapshot?.inputTruncated ? <Badge className="border-amber-300/20 bg-amber-300/10 text-[10px] text-amber-100"><AlertTriangle className="mr-1 size-3" /> Input truncated</Badge> : null}</div>
          <div className="mt-6 border-t border-white/7 pt-5"><div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Latest evidence trace</p>{latestRun ? <Badge className="border-white/10 bg-white/[0.04] text-[10px] text-slate-400 hover:bg-white/[0.04]">{latestRun.mode.replace("_", " ")} · {latestRun.status}</Badge> : null}</div>{latestRun ? <><p className="mt-3 text-sm text-slate-300">{latestRun.summary}</p><div className="mt-4 space-y-3">{latestRun.findings.map((finding) => <article key={finding.id} className="rounded-2xl border border-white/7 bg-[#07101f] p-4"><div className="flex flex-wrap items-center gap-2"><Badge className={`border text-[10px] hover:bg-transparent ${severityStyle[finding.severity]}`}>{finding.severity}</Badge><span className="text-xs font-medium text-slate-200">{finding.title}</span><span className="ml-auto font-mono text-[10px] text-slate-600">{finding.path ?? "diff"}:{finding.diffLine ?? "—"}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">{finding.recommendation}</p><pre className="mt-3 overflow-auto rounded-xl border border-white/7 bg-black/20 p-3 text-[11px] leading-5 text-cyan-100/80">{finding.evidence}</pre></article>)}</div></> : <p className="mt-3 text-xs leading-5 text-slate-500">Select a submitted diff, then run a review. Only findings tied to submitted evidence are retained.</p>}</div>
        </section>
      </div>
    </div>
  );
}
