import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import {
  BarChart3,
  BookOpenText,
  ChevronDown,
  Database,
  FileSearch,
  LogOut,
  MessageSquareText,
  PanelLeft,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { Button } from "./ui/button";

const menuItems = [
  { icon: MessageSquareText, label: "Ask NEXUS", path: "/" },
  { icon: FileSearch, label: "Source library", path: "/sources" },
  { icon: Database, label: "Collections", path: "/collections" },
  { icon: BarChart3, label: "Evaluation", path: "/evaluation" },
  { icon: Settings2, label: "Control plane", path: "/settings" },
];

const SIDEBAR_WIDTH_KEY = "nexus-sidebar-width";
const DEFAULT_WIDTH = 262;
const MIN_WIDTH = 220;
const MAX_WIDTH = 360;

function NexusMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="relative grid size-8 shrink-0 place-items-center rounded-[11px] border border-cyan-300/25 bg-gradient-to-br from-cyan-300 to-blue-500 shadow-[0_0_30px_-8px_rgba(34,211,238,0.8)]">
        <Sparkles className="size-4 text-slate-950" strokeWidth={2.5} />
      </div>
      {!compact ? (
        <div className="min-w-0">
          <p className="text-sm font-bold leading-none tracking-[0.12em] text-white">NEXUS</p>
          <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.14em] text-cyan-200/55">
            Knowledge intelligence
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? Number.parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) return <DashboardLayoutSkeleton />;

  if (!user) {
    return (
      <div className="nexus-shell flex min-h-screen items-center justify-center px-5">
        <div className="nexus-glow-panel w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto mb-7 w-fit"><NexusMark /></div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Enter your knowledge space</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-400">
            NEXUS makes answers traceable to the evidence your workspace allows.
          </p>
          <Button onClick={() => startLogin()} className="mt-8 h-11 w-full bg-cyan-300 font-semibold text-slate-950 hover:bg-cyan-200">
            Continue securely
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent>
    </SidebarProvider>
  );
}

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isCollapsed = state === "collapsed";
  const isMobile = useIsMobile();
  const activeItem = menuItems.find((item) => item.path === location);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const nextWidth = event.clientX - sidebarLeft;
      if (nextWidth >= MIN_WIDTH && nextWidth <= MAX_WIDTH) setSidebarWidth(nextWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div className="nexus-shell flex min-h-screen w-full">
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r border-white/7 bg-[#07101f]/90 backdrop-blur-xl" disableTransition={isResizing}>
          <SidebarHeader className="h-[76px] justify-center border-b border-white/7 px-3">
            <div className="flex w-full items-center justify-between gap-2">
              <button onClick={toggleSidebar} className="rounded-xl p-1.5 transition-colors hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300" aria-label="Toggle navigation">
                <PanelLeft className="size-4 text-slate-400" />
              </button>
              <div className="group-data-[collapsible=icon]:hidden"><NexusMark /></div>
              <div className="hidden group-data-[collapsible=icon]:block"><NexusMark compact /></div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3 py-5">
            <div className="mb-3 flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
              <div className="size-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace secure</span>
            </div>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className="h-10 rounded-xl px-2.5 text-slate-400 transition-colors hover:bg-white/6 hover:text-slate-100 data-[active=true]:bg-cyan-300/10 data-[active=true]:font-medium data-[active=true]:text-cyan-200"
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>

            <div className="mx-1 mt-8 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] p-3 group-data-[collapsible=icon]:hidden">
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-100">
                <ShieldCheck className="size-3.5 text-cyan-300" />
                Evidence-first mode
              </div>
              <p className="mt-2 text-[11px] leading-5 text-slate-500">Answers are held to your workspace evidence.</p>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-white/7 p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 group-data-[collapsible=icon]:justify-center">
                  <Avatar className="size-8 border border-white/10">
                    <AvatarFallback className="bg-slate-800 text-xs font-semibold text-cyan-100">{user?.name?.charAt(0).toUpperCase() || "N"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                    <p className="truncate text-xs font-medium text-slate-200">{user?.name || "NEXUS user"}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">{user?.email || "Authenticated workspace"}</p>
                  </div>
                  <ChevronDown className="size-3.5 text-slate-500 group-data-[collapsible=icon]:hidden" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-white/10 bg-[#0d182b] text-slate-200">
                <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-300 focus:bg-rose-400/10 focus:text-rose-200">
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div className={`absolute right-0 top-0 z-50 h-full w-px cursor-col-resize bg-transparent hover:bg-cyan-300/40 ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => setIsResizing(true)} />
      </div>

      <SidebarInset className="min-w-0 bg-transparent">
        {isMobile ? (
          <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/7 bg-[#07101f]/90 px-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="rounded-xl text-slate-300 hover:bg-white/7 hover:text-white" />
              <span className="text-sm font-medium text-white">{activeItem?.label || "NEXUS"}</span>
            </div>
            <BookOpenText className="size-4 text-cyan-300" />
          </div>
        ) : null}
        <main className="min-h-screen px-4 py-6 sm:px-7 lg:px-10 lg:py-8">{children}</main>
      </SidebarInset>
    </div>
  );
}
