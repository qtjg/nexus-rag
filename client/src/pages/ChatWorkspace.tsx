import { NexusPageHeader } from "@/components/NexusPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, ChevronRight, CircleHelp, FileSearch, Layers3, Loader2, Send, ShieldCheck, Sparkles } from "lucide-react";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type Citation = { marker: string; sourceName: string; excerpt: string; sectionPath: string | null };
type ChatMessage = { role: "user" | "assistant"; content: string; citations?: Citation[]; sufficientContext?: boolean };

const suggestions = [
  "What decisions are documented in this collection?",
  "Compare the current policies across my sources.",
  "Which source explains the review process?",
];

export default function ChatWorkspace() {
  const [, setLocation] = useLocation();
  const workspace = trpc.nexus.workspace.useQuery();
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [latestTrace, setLatestTrace] = useState<{ candidates: number; evidence: number; sufficient: boolean } | null>(null);
  const ask = trpc.nexus.ask.useMutation({
    onSuccess: (result) => {
      setMessages((current) => [...current, { role: "assistant", content: result.answer, citations: result.citations, sufficientContext: result.sufficientContext }]);
      setLatestTrace({ candidates: result.candidateCount, evidence: result.evidenceCount, sufficient: result.sufficientContext });
    },
    onError: (error) => {
      setMessages((current) => [...current, { role: "assistant", content: "NEXUS could not complete this request safely. Please retry after confirming your workspace access and source status." }]);
      toast.error("Question not completed", { description: error.message });
    },
  });

  const submitQuestion = (event?: FormEvent, prompted?: string) => {
    event?.preventDefault();
    const question = (prompted ?? draft).trim();
    const orgId = workspace.data?.organization.id;
    if (!question || ask.isPending) return;
    if (!orgId) {
      toast.message("Preparing your secure workspace…");
      return;
    }
    setMessages((current) => [...current, { role: "user", content: question }]);
    setDraft("");
    ask.mutate({ orgId, question });
  };

  const citations = messages.filter((message) => message.role === "assistant").at(-1)?.citations ?? [];
  const sourceCount = workspace.data?.sources.filter((source) => source.status === "indexed").length ?? 0;

  return (
    <div className="mx-auto max-w-[1500px]">
      <NexusPageHeader
        eyebrow="Grounded answer workspace"
        title="Ask with evidence, not assumption."
        description="Every question is independently scoped, retrieved, and checked against the evidence you are allowed to access."
        actions={<Button onClick={() => setLocation("/sources")} className="h-10 bg-cyan-300 px-4 font-semibold text-slate-950 hover:bg-cyan-200"><FileSearch className="mr-2 size-4" /> Add source</Button>}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="nexus-glow-panel min-h-[650px] overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between border-b border-white/7 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3"><div className="grid size-8 place-items-center rounded-xl border border-cyan-300/15 bg-cyan-300/8"><Sparkles className="size-4 text-cyan-300" /></div><div><p className="text-sm font-semibold text-white">Evidence-aware chat</p><p className="mt-0.5 text-[11px] text-slate-500">No source memory • every turn retrieves again</p></div></div>
            <Badge className="border border-emerald-300/15 bg-emerald-300/8 px-2 py-1 text-[10px] font-medium text-emerald-200 hover:bg-emerald-300/8"><span className="mr-1.5 size-1.5 rounded-full bg-emerald-300" /> {workspace.isLoading ? "Initializing" : "Scoped"}</Badge>
          </div>
          <div className="flex min-h-[530px] flex-col">
            <div className="flex-1 space-y-5 px-5 py-7 sm:px-7">
              {workspace.isLoading ? <div className="flex h-full items-center justify-center gap-3 text-sm text-slate-500"><Loader2 className="size-4 animate-spin text-cyan-300" /> Preparing access scope</div> : messages.length === 0 ? (
                <div className="mx-auto flex max-w-2xl flex-col items-center py-14 text-center"><div className="relative mb-7 grid size-16 place-items-center rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/15 to-blue-500/10"><div className="absolute inset-0 rounded-3xl shadow-[0_0_60px_-14px_rgba(34,211,238,0.6)]" /><FileSearch className="relative size-7 text-cyan-200" /></div><h2 className="text-xl font-semibold tracking-tight text-white">{sourceCount ? "Start from what you can verify" : "Your first source unlocks grounded answers"}</h2><p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{sourceCount ? "Ask about indexed knowledge. NEXUS exposes the source excerpts used in every response." : "Add a text, Markdown, URL excerpt, CSV, or code source. NEXUS will index it before it can influence an answer."}</p><div className="mt-8 grid w-full gap-2 text-left sm:grid-cols-3">{suggestions.map((suggestion) => <button key={suggestion} onClick={() => submitQuestion(undefined, suggestion)} className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 text-left text-xs leading-5 text-slate-400 transition-colors hover:border-cyan-300/20 hover:bg-cyan-300/[0.04] hover:text-slate-200">{suggestion}<ChevronRight className="mt-2 size-3.5 text-cyan-300/70" /></button>)}</div></div>
              ) : messages.map((message, index) => <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>{message.role === "assistant" ? <div className="mt-1 grid size-7 shrink-0 place-items-center rounded-lg bg-cyan-300/10"><Sparkles className="size-3.5 text-cyan-300" /></div> : null}<div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-cyan-300 text-slate-950" : "border border-white/7 bg-white/[0.035] text-slate-300"}`}><p>{message.content}</p>{message.role === "assistant" && message.citations?.length ? <div className="mt-4 grid gap-2 border-t border-white/8 pt-3">{message.citations.map((citation) => <div key={citation.marker} className="rounded-xl bg-slate-950/35 p-3"><p className="text-xs font-medium text-cyan-100">{citation.marker} {citation.sourceName}</p><p className="mt-1 text-[11px] leading-5 text-slate-400">{citation.excerpt}</p>{citation.sectionPath ? <p className="mt-1.5 text-[10px] text-slate-600">{citation.sectionPath}</p> : null}</div>)}</div> : null}</div></div>)}
              {ask.isPending ? <div className="flex items-center gap-3"><div className="grid size-7 place-items-center rounded-lg bg-cyan-300/10"><Sparkles className="size-3.5 text-cyan-300" /></div><div className="flex items-center gap-2 rounded-2xl border border-white/7 bg-white/[0.035] px-4 py-3 text-xs text-slate-500"><Loader2 className="size-3.5 animate-spin text-cyan-300" /> Retrieving scoped evidence…</div></div> : null}
            </div>
            <form onSubmit={submitQuestion} className="border-t border-white/7 bg-slate-950/25 p-4 sm:p-5"><div className="rounded-2xl border border-white/10 bg-[#0a1527] p-2 transition-colors focus-within:border-cyan-300/35 focus-within:shadow-[0_0_0_3px_rgba(34,211,238,.06)]"><Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a question about your approved knowledge..." className="min-h-[60px] resize-none border-0 bg-transparent px-3 pt-2 text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-0" /><div className="flex items-center justify-between px-2 pb-1"><span className="hidden text-[10px] text-slate-600 sm:inline">Enter to ask · Shift + Enter for a new line</span><span className="text-[10px] font-medium text-slate-500">{sourceCount ? `${sourceCount} indexed source${sourceCount === 1 ? "" : "s"}` : "No indexed sources"}</span><Button type="submit" size="sm" disabled={!draft.trim() || ask.isPending} className="h-8 rounded-lg bg-cyan-300 px-3 text-xs font-semibold text-slate-950 hover:bg-cyan-200">Ask <Send className="ml-1.5 size-3.5" /></Button></div></div></form>
          </div>
        </section>
        <aside className="space-y-5"><section className="nexus-panel rounded-3xl p-5"><div className="flex items-center gap-2 text-sm font-semibold text-white"><ShieldCheck className="size-4 text-cyan-300" /> Evidence trace</div><p className="mt-2 text-xs leading-5 text-slate-500">NEXUS exposes evidence metadata instead of private model reasoning.</p><div className="mt-5 space-y-3">{[["Access scope", workspace.data?.collections.length ? `${workspace.data.collections.length} collection${workspace.data.collections.length === 1 ? "" : "s"}` : "No collections", true], ["Candidates", latestTrace ? String(latestTrace.candidates) : "Awaiting query", Boolean(latestTrace)], ["Evidence gate", latestTrace ? (latestTrace.sufficient ? "Passed" : "Abstained") : "Not evaluated", latestTrace?.sufficient ?? false], ["Citation check", citations.length ? `${citations.length} resolved` : "Not run", citations.length > 0]].map(([label, value, ready]) => <div key={label as string} className="flex items-center justify-between gap-2 border-b border-white/5 pb-3 last:border-0 last:pb-0"><span className="text-xs text-slate-500">{label}</span><span className={`flex items-center gap-1.5 text-xs ${ready ? "text-emerald-200" : "text-slate-500"}`}>{ready ? <CheckCircle2 className="size-3" /> : <span className="size-1.5 rounded-full bg-slate-600" />}{value}</span></div>)}</div></section><section className="rounded-3xl border border-violet-300/10 bg-gradient-to-br from-violet-300/[0.07] to-cyan-300/[0.025] p-5"><Layers3 className="size-5 text-violet-200" /><p className="mt-4 text-sm font-semibold text-white">No evidence? No invention.</p><p className="mt-2 text-xs leading-5 text-slate-400">The evidence gate returns an abstention when nothing clears its relevance threshold.</p></section><button onClick={() => toast.message("NEXUS restricts each query to your organization and collection scope before retrieval.")} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 py-3 text-xs font-medium text-slate-400 transition-colors hover:bg-white/[0.03] hover:text-slate-200"><CircleHelp className="size-3.5" /> How NEXUS verifies answers</button></aside>
      </div>
    </div>
  );
}
