import { NexusPageHeader } from "@/components/NexusPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Ban, Building2, FileKey2, Gauge, Globe2, Loader2, ShieldCheck, UserPlus, UsersRound } from "lucide-react";

const controls = [
  { icon: Globe2, title: "URL ingestion policy", detail: "Allow only explicitly approved domains for web sources.", active: false },
  { icon: FileKey2, title: "Source retention", detail: "Keep source metadata and derived evidence under a defined policy.", active: false },
  { icon: Gauge, title: "Usage guardrails", detail: "Set per-organization query and ingestion limits before costs rise.", active: false },
  { icon: Ban, title: "Safety restrictions", detail: "Hold suspicious or prompt-injection-pattern content outside generation.", active: true },
];

export default function Settings() {
  const workspace = trpc.nexus.workspace.useQuery();
  const organization = workspace.data?.organization;
  const members = workspace.data?.members ?? [];
  const collections = workspace.data?.collections ?? [];
  return (
    <div className="mx-auto max-w-[1440px]"><NexusPageHeader eyebrow="Organization administration" title="Control plane" description="Manage the policy boundary around members, sources, retrieval, and operational risk." actions={<Button onClick={() => toast.message("Membership invitations are the next organization-control expansion.")} className="h-10 bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><UserPlus className="mr-2 size-4" /> Invite member</Button>} />
      {workspace.isLoading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin text-cyan-300" /> Loading policy scope</div> : <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="nexus-glow-panel rounded-3xl p-6"><div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-xl bg-cyan-300/10"><Building2 className="size-5 text-cyan-300" /></div><Badge className="border border-emerald-300/15 bg-emerald-300/[0.08] text-[10px] text-emerald-100 hover:bg-emerald-300/[0.08]">Policy scoped</Badge></div><h2 className="mt-5 text-lg font-semibold text-white">{organization?.name || "Workspace governance"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Roles, memberships, and collection grants are evaluated before any retrieval candidate is returned.</p><div className="mt-6 divide-y divide-white/6 border-y border-white/6"><div className="flex items-center justify-between py-3"><span className="text-xs text-slate-500">Members</span><span className="text-sm font-medium text-white">{members.length || 1}</span></div><div className="flex items-center justify-between py-3"><span className="text-xs text-slate-500">Collections</span><span className="text-sm font-medium text-white">{collections.length}</span></div><div className="flex items-center justify-between py-3"><span className="text-xs text-slate-500">Active policy version</span><span className="text-sm font-medium text-cyan-200">v0.1</span></div></div><button onClick={() => toast.message("Owner, Admin, Member, and Viewer roles are represented in the policy data model.")} className="mt-5 flex items-center gap-2 text-xs font-medium text-cyan-200 hover:text-cyan-100"><UsersRound className="size-4" /> View membership model</button></section><section className="nexus-panel rounded-3xl p-6"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-cyan-300" /><div><p className="text-sm font-semibold text-white">Safety controls</p><p className="mt-1 text-xs text-slate-500">Critical controls are server-enforced; interface changes alone do not grant access.</p></div></div><div className="mt-5 divide-y divide-white/6">{controls.map((control) => <div key={control.title} className="flex gap-3 py-4"><div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.035]"><control.icon className="size-4 text-slate-400" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{control.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{control.detail}</p></div><Switch checked={control.active} onCheckedChange={() => toast.message("Policy persistence is available only through the server policy service.")} aria-label={control.title} /></div>)}</div></section></div>}
    </div>
  );
}
