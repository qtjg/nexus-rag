import { NexusPageHeader } from "@/components/NexusPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Activity, CircleCheckBig, Gauge, ShieldAlert, Sparkles, TimerReset, type LucideIcon } from "lucide-react";

const gates: { title: string; detail: string; icon: LucideIcon }[] = [
  { title: "Tenant isolation", detail: "Every candidate query begins from the organization and collection scope.", icon: ShieldAlert },
  { title: "Citation integrity", detail: "Unsupported marker output is withheld from the generated answer.", icon: CircleCheckBig },
  { title: "Abstention safety", detail: "The evidence threshold returns a no-answer response when context is weak.", icon: Sparkles },
  { title: "Hybrid retrieval", detail: "Sparse relevance and local-vector ranks are fused before source-diversity selection.", icon: Gauge },
];

export default function Evaluation() {
  const workspace = trpc.nexus.workspace.useQuery();
  const utils = trpc.useUtils();
  const metrics = workspace.data?.metrics;
  const releaseGates = workspace.data?.releaseGates ?? [];
  const formatPercent = (value: number | null | undefined) => value === null || value === undefined ? "—" : `${value}%`;
  const formatLatency = (value: number | null | undefined) => value === null || value === undefined ? "—" : `${value} ms`;
  const cards = [
    ["Queries evaluated", String(metrics?.queryCount ?? "—"), metrics?.queryCount ? "Recent traced requests" : "Ask a question to begin"],
    ["Evidence coverage", formatPercent(metrics?.evidenceRate), "Answers that cleared the evidence gate"],
    ["Abstention rate", formatPercent(metrics?.abstentionRate), "Insufficient-evidence responses"],
    ["Average response latency", formatLatency(metrics?.averageLatencyMs), "Recent end-to-end response time"],
  ];
  const decideApproval = trpc.nexus.decideReleaseApproval.useMutation({
    onSuccess: (result) => {
      toast[result.approved ? "success" : "error"](result.approved ? "Release approval recorded" : "Release approval blocked", { description: result.approved ? "All currently defined gates are passing." : "Resolve every blocked or baseline-required gate before approval." });
      utils.nexus.workspace.invalidate();
    },
    onError: (error) => toast.error("Release decision could not be evaluated", { description: error.message }),
  });

  return (
    <div className="mx-auto max-w-[1440px]">
      <NexusPageHeader
        eyebrow="Quality and observability"
        title="Evaluation lab"
        description="Release quality is measured against retrieval, evidence, abstention, and security gates — not a single convincing answer."
        actions={<div className="flex gap-2"><Button onClick={() => toast.message("Create a representative golden set after indexing the knowledge that matters.")} variant="outline" className="h-10 border-cyan-300/20 bg-cyan-300/[0.035] text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50"><Activity className="mr-2 size-4" /> Create evaluation set</Button><Button onClick={() => decideApproval.mutate({ orgId: workspace.data!.organization.id })} disabled={decideApproval.isPending || !workspace.data?.organization.id} className="h-10 bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{decideApproval.isPending ? "Checking…" : "Record release decision"}</Button></div>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, detail]) => <div key={label} className="nexus-panel rounded-2xl p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-5 text-3xl font-semibold tracking-tight text-white">{value}</p><p className="mt-2 text-[11px] text-slate-600">{detail}</p></div>)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="nexus-glow-panel rounded-3xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Release gates</p><p className="mt-1 text-xs text-slate-500">Critical gates are calculated from this workspace’s actual telemetry.</p></div><Badge className={`border text-[10px] hover:bg-transparent ${releaseGates.some((gate) => gate.status === "block") ? "border-rose-300/15 bg-rose-300/[0.07] text-rose-100" : releaseGates.some((gate) => gate.status === "baseline_required") ? "border-amber-300/15 bg-amber-300/[0.07] text-amber-100" : "border-emerald-300/15 bg-emerald-300/[0.07] text-emerald-100"}`}>{releaseGates.some((gate) => gate.status === "block") ? "Blocked" : releaseGates.some((gate) => gate.status === "baseline_required") ? "Baseline required" : "Ready"}</Badge></div><div className="mt-6 space-y-3">{releaseGates.map((gate) => <div key={gate.id} className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.02] p-4"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.035]"><ShieldAlert className="size-4 text-slate-400" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{gate.label}</p><p className="mt-0.5 text-xs text-slate-500">{gate.threshold}</p></div><span className={`rounded-full px-2 py-1 text-[10px] ${gate.status === "pass" ? "bg-emerald-300/10 text-emerald-100" : gate.status === "block" ? "bg-rose-300/10 text-rose-100" : "bg-amber-300/10 text-amber-100"}`}>{gate.status.replace(/_/g, " ")}</span></div>)}{gates.map(({ title, detail, icon: Icon }) => <div key={title} className="hidden"><Icon /><span>{detail}</span></div>)}</div></section>
        <section className="nexus-panel rounded-3xl p-6"><TimerReset className="size-5 text-cyan-300" /><p className="mt-4 text-sm font-semibold text-white">Trace every answer</p><p className="mt-2 text-sm leading-6 text-slate-500">Queries retain a request trace, authorization scope, candidate counts, evidence decision, latency breakdown, and pipeline fingerprint without storing raw source content in general logs.</p><div className="mt-6 rounded-2xl border border-white/7 bg-[#07101f] p-4 font-mono text-[11px] leading-6 text-slate-500"><span className="text-cyan-300/80">trace</span> / auth / policy / hybrid retrieval<br /><span className="text-cyan-300/80">evidence</span> / citation / response<br /><span className="text-cyan-300/80">feedback</span> / {formatPercent(metrics?.feedbackRate)} positive</div></section>
      </div>
    </div>
  );
}
