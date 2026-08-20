import { NexusPageHeader } from "@/components/NexusPageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Ban, Building2, FileKey2, Gauge, Globe2, Loader2, ShieldCheck, Trash2, UserPlus, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const controls = [
  { icon: Globe2, title: "URL ingestion policy", detail: "Allow only explicitly approved domains for web sources.", active: false },
  { icon: FileKey2, title: "Source retention", detail: "Keep source metadata and derived evidence under a defined policy.", active: false },
  { icon: Gauge, title: "Usage guardrails", detail: "Set per-organization query and ingestion limits before costs rise.", active: false },
  { icon: Ban, title: "Safety restrictions", detail: "Hold suspicious or prompt-injection-pattern content outside generation.", active: true },
];

export default function Settings() {
  const workspace = trpc.nexus.workspace.useQuery();
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member" | "viewer">("member");
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const organization = workspace.data?.organization;
  const members = workspace.data?.members ?? [];
  const invitations = workspace.data?.invitations ?? [];
  const collections = workspace.data?.collections ?? [];
  const memberGrants = workspace.data?.memberGrants ?? [];

  useEffect(() => {
    if (!selectedCollections.length && collections.length) setSelectedCollections(collections.map((collection) => collection.id));
  }, [collections, selectedCollections.length]);

  const invite = trpc.nexus.inviteMember.useMutation({
    onSuccess: () => {
      toast.success("Invitation recorded", { description: "It will grant the selected scope when the invited email signs in." });
      utils.nexus.workspace.invalidate();
      setOpen(false);
      setEmail("");
    },
    onError: (error) => toast.error("Invitation not created", { description: error.message }),
  });
  const updateMember = trpc.nexus.updateMember.useMutation({
    onSuccess: () => { toast.success("Member access updated"); utils.nexus.workspace.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const revokeMember = trpc.nexus.revokeMember.useMutation({
    onSuccess: () => { toast.success("Member access revoked"); utils.nexus.workspace.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const revokeInvitation = trpc.nexus.revokeInvitation.useMutation({
    onSuccess: () => { toast.success("Invitation revoked"); utils.nexus.workspace.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const configureRetry = trpc.nexus.configureIngestionRetry.useMutation({
    onSuccess: (result) => {
      toast.success(result.created ? "Automated retry enabled" : "Automated retry already enabled", { description: `Heartbeat task ${result.taskUid} owns due-ingestion recovery.` });
      utils.nexus.workspace.invalidate();
    },
    onError: (error) => toast.error("Automated retry could not be enabled", { description: error.message }),
  });

  const toggleCollection = (collectionId: number) => {
    setSelectedCollections((current) => current.includes(collectionId) ? current.filter((id) => id !== collectionId) : [...current, collectionId]);
  };
  const submitInvite = () => {
    if (!organization?.id || !email.trim()) return;
    invite.mutate({ orgId: organization.id, email, role, collectionIds: role === "admin" ? collections.map((collection) => collection.id) : selectedCollections });
  };

  return (
    <div className="mx-auto max-w-[1440px]">
      <NexusPageHeader
        eyebrow="Organization administration"
        title="Control plane"
        description="Manage the policy boundary around members, sources, retrieval, and operational risk."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button className="h-10 bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200"><UserPlus className="mr-2 size-4" /> Invite member</Button></DialogTrigger>
            <DialogContent className="border-white/10 bg-[#0b172a] text-slate-100">
              <DialogHeader><DialogTitle>Invite a member</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" type="email" className="border-white/10 bg-white/[0.03] text-white placeholder:text-slate-600" />
                <div className="grid grid-cols-3 gap-2">{(["admin", "member", "viewer"] as const).map((item) => <button key={item} onClick={() => setRole(item)} className={`rounded-xl border px-3 py-2 text-xs capitalize ${role === item ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100" : "border-white/8 text-slate-500"}`}>{item}</button>)}</div>
                <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-3"><p className="text-xs font-medium text-slate-300">Collection scope</p><p className="mt-1 text-[11px] leading-4 text-slate-500">Admins receive all current collections. Members and viewers need explicit grants.</p><div className="mt-3 space-y-2">{collections.map((collection) => <label key={collection.id} className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={role === "admin" || selectedCollections.includes(collection.id)} disabled={role === "admin"} onChange={() => toggleCollection(collection.id)} className="accent-cyan-300" />{collection.name}</label>)}</div></div>
                <div className="flex justify-end"><Button onClick={submitInvite} disabled={invite.isPending || !email.trim()} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{invite.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create invitation"}</Button></div>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {workspace.isLoading ? <div className="flex min-h-72 items-center justify-center gap-2 text-sm text-slate-500"><Loader2 className="size-4 animate-spin text-cyan-300" /> Loading policy scope</div> : (
        <div className="space-y-5">
          <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
            <section className="nexus-glow-panel rounded-3xl p-6"><div className="flex items-start justify-between gap-3"><div className="grid size-10 place-items-center rounded-xl bg-cyan-300/10"><Building2 className="size-5 text-cyan-300" /></div><Badge className="border border-emerald-300/15 bg-emerald-300/[0.08] text-[10px] text-emerald-100 hover:bg-emerald-300/[0.08]">Policy scoped</Badge></div><h2 className="mt-5 text-lg font-semibold text-white">{organization?.name || "Workspace governance"}</h2><p className="mt-2 text-sm leading-6 text-slate-500">Roles, memberships, and collection grants are evaluated before any retrieval candidate is returned.</p><div className="mt-6 divide-y divide-white/6 border-y border-white/6"><div className="flex items-center justify-between py-3"><span className="text-xs text-slate-500">Members</span><span className="text-sm font-medium text-white">{members.length || 1}</span></div><div className="flex items-center justify-between py-3"><span className="text-xs text-slate-500">Pending invitations</span><span className="text-sm font-medium text-white">{invitations.length}</span></div><div className="flex items-center justify-between py-3"><span className="text-xs text-slate-500">Collections</span><span className="text-sm font-medium text-white">{collections.length}</span></div></div></section>
            <section className="nexus-panel rounded-3xl p-6"><div className="flex items-center gap-2"><ShieldCheck className="size-5 text-cyan-300" /><div><p className="text-sm font-semibold text-white">Safety controls</p><p className="mt-1 text-xs text-slate-500">Critical controls are server-enforced; interface changes alone do not grant access.</p></div></div><div className="mt-5 divide-y divide-white/6">{controls.map((control) => <div key={control.title} className="flex gap-3 py-4"><div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.035]"><control.icon className="size-4 text-slate-400" /></div><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-200">{control.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{control.detail}</p></div><Switch checked={control.active} onCheckedChange={() => toast.message("Policy settings persist through the server policy service.")} aria-label={control.title} /></div>)}</div></section>
          </div>
          <section className="nexus-panel rounded-3xl p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-white">Ingestion recovery worker</p><p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">After this site is published, enable the platform-managed Heartbeat worker to process scheduled retry jobs every five minutes. It is idempotent and only runs work due in the durable queue.</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2 py-1 text-[10px] ${organization?.ingestionRetryTaskUid ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>{organization?.ingestionRetryTaskUid ? "Enabled" : "Publish required"}</span><Button onClick={() => configureRetry.mutate({ orgId: organization!.id })} disabled={configureRetry.isPending || Boolean(organization?.ingestionRetryTaskUid)} className="bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">{configureRetry.isPending ? <Loader2 className="size-4 animate-spin" /> : "Enable retry"}</Button></div></div></section>
          <section className="nexus-glow-panel overflow-hidden rounded-3xl"><div className="flex items-center justify-between border-b border-white/7 px-5 py-4"><div><p className="text-sm font-semibold text-white">Members and grants</p><p className="mt-1 text-xs text-slate-500">Role and collection-scope updates take effect before the next retrieval request.</p></div><UsersRound className="size-4 text-cyan-300" /></div><div className="divide-y divide-white/6">{members.map((member) => { const grantIds = memberGrants.filter((grant) => grant.userId === member.userId).map((grant) => grant.collectionId); return <div key={member.id} className="px-5 py-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-100">{member.name || member.email || `User ${member.userId}`}</p><p className="mt-1 text-xs text-slate-500">{member.email || "Authenticated workspace member"}</p></div><span className="rounded-full border border-white/8 px-2 py-1 text-[10px] capitalize text-slate-400">{member.role}</span>{member.role === "owner" ? <span className="text-xs text-slate-600">Owner scope</span> : <><select value={member.role} onChange={(event) => updateMember.mutate({ orgId: organization!.id, memberUserId: member.userId, role: event.target.value as "admin" | "member" | "viewer", collectionIds: grantIds.length ? grantIds : collections.map((collection) => collection.id) })} className="h-8 rounded-lg border border-white/10 bg-white/[0.03] px-2 text-xs text-slate-300"><option value="admin">Admin</option><option value="member">Member</option><option value="viewer">Viewer</option></select><Button onClick={() => { if (confirm(`Revoke ${member.email || "this member"}?`)) revokeMember.mutate({ orgId: organization!.id, memberUserId: member.userId }); }} variant="ghost" size="icon" className="size-8 text-slate-500 hover:bg-rose-400/10 hover:text-rose-200"><Trash2 className="size-3.5" /></Button></>}</div>{member.role !== "owner" ? <div className="mt-3 flex flex-wrap gap-2">{collections.map((collection) => <button key={collection.id} onClick={() => { const next = grantIds.includes(collection.id) ? grantIds.filter((id) => id !== collection.id) : [...grantIds, collection.id]; if (member.role !== "admin" && !next.length) return toast.error("A member or viewer needs at least one collection grant."); updateMember.mutate({ orgId: organization!.id, memberUserId: member.userId, role: member.role as "admin" | "member" | "viewer", collectionIds: next }); }} disabled={member.role === "admin" || updateMember.isPending} className={`rounded-lg border px-2.5 py-1 text-[10px] ${member.role === "admin" || grantIds.includes(collection.id) ? "border-cyan-300/25 bg-cyan-300/[0.08] text-cyan-100" : "border-white/8 text-slate-500"}`}>{collection.name}</button>)}</div> : null}</div>; })}</div>{invitations.length ? <div className="border-t border-white/7 bg-white/[0.015] px-5 py-4"><p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">Pending invitations</p><div className="mt-3 flex flex-wrap gap-2">{invitations.map((invitation) => <span key={invitation.id} className="flex items-center gap-2 rounded-xl border border-cyan-300/12 bg-cyan-300/[0.04] px-3 py-2 text-xs text-cyan-100">{invitation.email} · {invitation.role}<button onClick={() => revokeInvitation.mutate({ orgId: organization!.id, invitationId: invitation.id })} className="text-slate-400 hover:text-rose-200">Revoke</button></span>)}</div></div> : null}</section>
        </div>
      )}
    </div>
  );
}
