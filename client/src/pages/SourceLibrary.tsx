import { NexusPageHeader } from "@/components/NexusPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  CheckCircle2,
  FilePlus2,
  FileText,
  Link2,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const sourceTypes = [
  { title: "File", detail: "PDF, DOCX, text, Markdown, CSV, and code", icon: UploadCloud },
  { title: "Web page", detail: "URL metadata with approved page content", icon: Link2 },
  { title: "Paste text", detail: "A note, transcript, or approved excerpt", icon: FileText },
] as const;

type SourceType = (typeof sourceTypes)[number]["title"];

export default function SourceLibrary() {
  const workspace = trpc.nexus.workspace.useQuery();
  const utils = trpc.useUtils();
  const [sourceType, setSourceType] = useState<SourceType>("Paste text");
  const [open, setOpen] = useState(false);
  const [sourceName, setSourceName] = useState("");
  const [content, setContent] = useState("");
  const [filePayload, setFilePayload] = useState<{ base64: string; mimeType: string } | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [collectionId, setCollectionId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const organizationId = workspace.data?.organization.id;
  const collections = workspace.data?.collections ?? [];
  const sources = workspace.data?.sources ?? [];
  const jobs = workspace.data?.jobs ?? [];

  const resetIntake = () => {
    setOpen(false);
    setSourceName("");
    setContent("");
    setFilePayload(null);
    setSourceUrl("");
  };

  const ingestText = trpc.nexus.ingestText.useMutation({
    onSuccess: () => {
      toast.success("Source indexed", { description: "It is now eligible for scoped retrieval." });
      utils.nexus.workspace.invalidate();
      resetIntake();
    },
    onError: (error) => toast.error("Source could not be indexed", { description: error.message }),
  });

  const ingestFile = trpc.nexus.ingestFile.useMutation({
    onSuccess: () => {
      toast.success("File indexed", { description: "NEXUS stored the file and recorded its ingestion trace." });
      utils.nexus.workspace.invalidate();
      resetIntake();
    },
    onError: (error) => toast.error("File could not be indexed", { description: error.message }),
  });

  const remove = trpc.nexus.deleteSource.useMutation({
    onSuccess: () => {
      toast.success("Source removed from retrieval");
      utils.nexus.workspace.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
  const replay = trpc.nexus.replayIngestion.useMutation({
    onSuccess: () => {
      toast.success("Ingestion replay started");
      utils.nexus.workspace.invalidate();
    },
    onError: (error) => toast.error("Replay could not start", { description: error.message }),
  });

  useEffect(() => {
    if (!collectionId && collections[0]) setCollectionId(collections[0].id);
  }, [collectionId, collections]);

  const visibleSources = useMemo(
    () => sources.filter((source) => source.name.toLowerCase().includes(search.toLowerCase())),
    [search, sources],
  );
  const indexedCount = sources.filter((source) => source.status === "indexed").length;
  const processingCount = sources.filter((source) => ["queued", "parsing", "chunking", "embedding"].includes(source.status)).length;
  const attentionCount = sources.filter((source) => source.status === "failed").length;

  const submitSource = () => {
    if (!organizationId || !collectionId) {
      toast.error("Create or select a collection first.");
      return;
    }
    if (!sourceName.trim()) {
      toast.error("A source name is required.");
      return;
    }
    if (sourceType === "File") {
      if (!filePayload) {
        toast.error("Choose a file before indexing.");
        return;
      }
      ingestFile.mutate({
        orgId: organizationId,
        collectionId,
        name: sourceName.trim(),
        mimeType: filePayload.mimeType,
        base64: filePayload.base64,
      });
      return;
    }
    if (!content.trim()) {
      toast.error("Extractable content is required.");
      return;
    }
    ingestText.mutate({
      orgId: organizationId,
      collectionId,
      name: sourceName.trim(),
      content,
      sourceUrl: sourceType === "Web page" && sourceUrl ? sourceUrl : undefined,
      type: sourceType === "Web page" ? "url" : "text",
    });
  };

  const readSourceFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Files must be 25MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setSourceName(file.name);
      setFilePayload({
        base64: result.split(",")[1] || "",
        mimeType: file.type || "application/octet-stream",
      });
    };
    reader.onerror = () => toast.error("This file could not be read in the browser.");
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <NexusPageHeader
        eyebrow="Knowledge inventory"
        title="Source library"
        description="Add, inspect, and govern the evidence that NEXUS may use in an answer."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-10 bg-cyan-300 px-4 font-semibold text-slate-950 hover:bg-cyan-200">
                <FilePlus2 className="mr-2 size-4" /> Add source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-white/10 bg-[#0b172a] text-slate-100">
              <DialogHeader>
                <DialogTitle className="text-xl">Add approved knowledge</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Sources are chunked into traceable evidence before becoming available to a query.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {sourceTypes.map((type) => (
                  <button
                    key={type.title}
                    onClick={() => {
                      setSourceType(type.title);
                      setFilePayload(null);
                    }}
                    className={`rounded-2xl border p-3 text-left transition-colors ${sourceType === type.title ? "border-cyan-300/40 bg-cyan-300/10" : "border-white/8 bg-white/[0.02] hover:bg-white/[0.04]"}`}
                  >
                    <type.icon className={`size-4 ${sourceType === type.title ? "text-cyan-200" : "text-slate-500"}`} />
                    <p className="mt-3 text-sm font-medium text-slate-100">{type.title}</p>
                    <p className="mt-1 text-[11px] leading-4 text-slate-500">{type.detail}</p>
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
                <Input value={sourceName} onChange={(event) => setSourceName(event.target.value)} placeholder="Source name" className="border-white/10 bg-white/[0.03] text-slate-100 placeholder:text-slate-600" />
                <select value={collectionId ?? ""} onChange={(event) => setCollectionId(Number(event.target.value))} className="h-10 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-slate-200 outline-none">
                  <option value="" disabled>Select collection</option>
                  {collections.map((collection) => <option key={collection.id} value={collection.id} className="bg-slate-900">{collection.name}</option>)}
                </select>
              </div>
              {sourceType === "Web page" ? <Input value={sourceUrl} onChange={(event) => setSourceUrl(event.target.value)} placeholder="https://example.com/knowledge" className="mt-3 border-white/10 bg-white/[0.03] text-slate-100 placeholder:text-slate-600" /> : null}
              {sourceType === "File" ? (
                <label className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-4 py-3 text-xs text-slate-500 hover:bg-white/[0.04]">
                  <span>{filePayload ? "File is ready for secure storage and processing" : "Choose PDF, DOCX, text, Markdown, CSV, or source code up to 25MB"}</span>
                  <span className="text-cyan-200">Choose file</span>
                  <input type="file" accept=".pdf,.docx,.txt,.md,.markdown,.csv,.js,.jsx,.ts,.tsx,.py,.java,.go,.rs,.json" className="hidden" onChange={(event) => readSourceFile(event.target.files?.[0])} />
                </label>
              ) : (
                <Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder={sourceType === "Web page" ? "Paste the approved page content to index…" : "Paste the content that should become searchable evidence…"} className="mt-3 min-h-36 border-white/10 bg-white/[0.03] text-slate-100 placeholder:text-slate-600" />
              )}
              <div className="mt-4 flex items-center justify-between border-t border-white/7 pt-4">
                <span className="max-w-sm text-[11px] leading-4 text-slate-500">File sources are stored outside the database and processed through a durable job with retry state and replay support.</span>
                <Button onClick={submitSource} disabled={ingestText.isPending || ingestFile.isPending} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">
                  {ingestText.isPending || ingestFile.isPending ? <Loader2 className="size-4 animate-spin" /> : "Index source"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[["Indexed", String(indexedCount), indexedCount ? "Ready to retrieve" : "Awaiting approved content", "text-emerald-200"], ["Processing", String(processingCount), "No active jobs", "text-cyan-200"], ["Needs attention", String(attentionCount), attentionCount ? "Review failed sources" : "No failed sources", "text-amber-200"]].map(([label, value, detail, color]) => (
          <div key={label} className="nexus-panel rounded-2xl p-5"><p className="text-xs font-medium text-slate-500">{label}</p><div className="mt-3 flex items-end justify-between"><p className="text-3xl font-semibold tracking-tight text-white">{value}</p><span className={`text-[11px] ${color}`}>{detail}</span></div></div>
        ))}
      </div>

      <section className="nexus-glow-panel mt-5 overflow-hidden rounded-3xl">
        <div className="flex flex-col gap-4 border-b border-white/7 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-semibold text-white">All sources</p><p className="mt-1 text-xs text-slate-500">Status follows each source from intake through retrievable evidence.</p></div>
          <div className="flex h-9 items-center gap-2 rounded-xl border border-white/9 bg-white/[0.025] px-3 sm:w-64"><Search className="size-3.5 text-slate-500" /><input value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search sources" placeholder="Search sources" className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600" /></div>
        </div>
        {workspace.isLoading ? <div className="flex min-h-[330px] items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin text-cyan-300" /> Loading secure inventory</div> : visibleSources.length ? (
          <div className="divide-y divide-white/6">
            {visibleSources.map((source) => (
              <article key={source.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
                <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-cyan-300/8"><FileText className="size-4 text-cyan-300" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-100">{source.name}</p><p className="mt-1 text-xs text-slate-500">{collections.find((collection) => collection.id === source.collectionId)?.name ?? "Scoped collection"} · v{source.version} · {source.chunkingVersion}{source.errorMessage ? ` · ${source.errorMessage}` : ""}</p></div>
                <Badge className={`w-fit border text-[10px] ${source.status === "indexed" ? "border-emerald-300/15 bg-emerald-300/[0.08] text-emerald-100" : source.status === "failed" ? "border-rose-300/15 bg-rose-300/[0.08] text-rose-100" : "border-cyan-300/15 bg-cyan-300/[0.08] text-cyan-100"}`}>{source.status.replace(/_/g, " ")}</Badge>
                {source.status === "failed" && jobs.find((job) => job.sourceId === source.id) ? <Button onClick={() => replay.mutate({ orgId: organizationId!, jobId: jobs.find((job) => job.sourceId === source.id)!.id })} variant="ghost" size="icon" disabled={replay.isPending} className="size-8 text-cyan-200 hover:bg-cyan-300/10 hover:text-cyan-100"><RotateCcw className="size-3.5" /></Button> : null}
                <Button onClick={() => { if (confirm(`Remove ${source.name} from future answers?`)) remove.mutate({ orgId: organizationId!, sourceId: source.id }); }} variant="ghost" size="icon" disabled={remove.isPending} className="size-8 text-slate-500 hover:bg-rose-400/10 hover:text-rose-200"><Trash2 className="size-3.5" /></Button>
              </article>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[390px] flex-col items-center justify-center px-5 text-center"><div className="grid size-14 place-items-center rounded-2xl border border-white/8 bg-white/[0.03]"><FileText className="size-6 text-cyan-300" /></div><h2 className="mt-5 text-lg font-semibold text-white">Your library is ready for its first source</h2><p className="mt-2 max-w-md text-sm leading-6 text-slate-500">When a source is indexed, its exact excerpts and version data become available to grounded answers.</p><Button onClick={() => setOpen(true)} variant="outline" className="mt-6 border-cyan-300/20 bg-cyan-300/[0.035] text-cyan-100 hover:bg-cyan-300/10 hover:text-cyan-50"><UploadCloud className="mr-2 size-4" /> Add first source</Button><div className="mt-6 flex items-center gap-2 text-[11px] text-slate-600"><CheckCircle2 className="size-3.5 text-emerald-300/70" /> Sources are collection-scoped by default</div></div>
        )}
      </section>
    </div>
  );
}
