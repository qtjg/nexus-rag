import { NexusPageHeader } from "@/components/NexusPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Activity, CircleCheckBig, Gauge, ShieldAlert, Sparkles, TimerReset, type LucideIcon } from "lucide-react";

const gates: { title: string; detail: string; icon: LucideIcon }[] = [
  { title: "Tenant isolation", detail: "No cross-tenant evidence", icon: ShieldAlert },
  { title: "Citation integrity", detail: "Every factual claim resolves", icon: CircleCheckBig },
  { title: "Abstention safety", detail: "No forced answer without evidence", icon: Sparkles },
  { title: "Retrieval quality", detail: "Precision and recall against a golden set", icon: Gauge },
];

export default function Evaluation() {
  return (
    <div className="mx-auto max-w-[1440px]">
      <NexusPageHeader eyebrow="Quality and observability" title="Evaluation lab" description="Release quality is measured against retrieval, evidence, abstention, and security gates — not a single convincing answer." actions={<Button onClick={() => toast.message("Create a golden evaluation set after sources are indexed.")} variant="outline" className="h-10 border-cyan-300/20 bg-cyan-300/[0.035] text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50"><Activity className="mr-2 size-4" /> Create evaluation set</Button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[["Queries evaluated", "—", "Index a source to begin"], ["Evidence coverage", "—", "Awaiting claims"], ["Abstention accuracy", "—", "Awaiting golden cases"], ["p95 response latency", "—", "Awaiting traced queries"]].map(([label, value, detail]) => <div key={label} className="nexus-panel rounded-2xl p-5"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-5 text-3xl font-semibold tracking-tight text-white">{value}</p><p className="mt-2 text-[11px] text-slate-600">{detail}</p></div>)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="nexus-glow-panel rounded-3xl p-6"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-white">Release gates</p><p className="mt-1 text-xs text-slate-500">Critical gates fail closed until there is measured evidence.</p></div><Badge className="border border-amber-300/15 bg-amber-300/[0.07] text-[10px] text-amber-100 hover:bg-amber-300/[0.07]">Awaiting baseline</Badge></div><div className="mt-6 space-y-3">{gates.map(({ title, detail, icon: Icon }) => <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[0.02] p-4"><div className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.035]"><Icon className="size-4 text-slate-400" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{title}</p><p className="mt-0.5 text-xs text-slate-500">{detail}</p></div><span className="rounded-full bg-slate-700/60 px-2 py-1 text-[10px] text-slate-400">Pending</span></div>)}</div></section>
        <section className="nexus-panel rounded-3xl p-6"><TimerReset className="size-5 text-cyan-300" /><p className="mt-4 text-sm font-semibold text-white">Trace every answer</p><p className="mt-2 text-sm leading-6 text-slate-500">Queries will retain a request trace, authorization scope, candidate counts, evidence decision, latency breakdown, and pipeline fingerprint without logging raw document content.</p><div className="mt-6 rounded-2xl border border-white/7 bg-[#07101f] p-4 font-mono text-[11px] leading-6 text-slate-500"><span className="text-cyan-300/80">trace</span> / auth / policy / retrieval<br /><span className="text-cyan-300/80">evidence</span> / citation / response</div></section>
      </div>
    </div>
  );
}
