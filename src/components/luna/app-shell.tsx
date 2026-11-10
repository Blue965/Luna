"use client";

/**
 * Coque applicative Luna AI : sidebar latérale (desktop), drawer mobile,
 * zone de travail principale. Toute la navigation est réellement fonctionnelle.
 */
import { useEffect, useState } from "react";
import { Gamepad2, Hammer, History, LayoutDashboard, LogOut, Menu, Settings, Stethoscope, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LunaLogo } from "@/components/luna/logo";
import { UserAvatar } from "@/components/luna/user-avatar";
import { DemoBadge } from "@/components/luna/demo-badge";
import { DashboardView } from "@/components/luna/views/dashboard-view";
import { AtelierView } from "@/components/luna/views/atelier-view";
import { CliniqueView } from "@/components/luna/views/clinique-view";
import { GameplayView } from "@/components/luna/views/gameplay-view";
import { HistoriqueView } from "@/components/luna/views/historique-view";
import { ParametresView } from "@/components/luna/views/parametres-view";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/lib/types";

const NAV_ITEMS: Array<{ id: ViewId; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { id: "atelier", label: "Atelier Luau", icon: Hammer },
  { id: "clinique", label: "Clinique du Code", icon: Stethoscope },
  { id: "economie", label: "Économie & Gameplay", icon: Gamepad2 },
  { id: "historique", label: "Historique", icon: History },
  { id: "parametres", label: "Paramètres", icon: Settings },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const view = useLunaStore((s) => s.view);
  const setView = useLunaStore((s) => s.setView);

  return (
    <nav aria-label="Navigation principale" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setView(item.id);
              onNavigate?.();
            }}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-violet-500",
              active
                ? "bg-violet-500/15 text-violet-300"
                : "text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors",
                active ? "text-violet-400" : "text-zinc-500 group-hover:text-zinc-300"
              )}
            />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const user = useLunaStore((s) => s.user);
  const setView = useLunaStore((s) => s.setView);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Déconnexion réussie. À bientôt !");
      // setUser(null) → retour landing (géré par le store).
      window.location.hash = "";
      window.location.reload();
    } catch {
      toast.error("Échec de la déconnexion. Réessaie.");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <button
          type="button"
          onClick={() => {
            setView("dashboard");
            onNavigate?.();
          }}
          className="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-violet-500"
          aria-label="Aller à la vue d'ensemble"
        >
          <LunaLogo />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        <NavList onNavigate={onNavigate} />

        <div className="mt-6 rounded-lg border border-violet-500/25 bg-gradient-to-br from-violet-600/12 to-sky-600/8 p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            Limite d&apos;utilisation
          </p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-400">
            12 requêtes IA toutes les 5 minutes, par assistant.
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-800/70 p-3">
        {user ? (
          <div className="flex items-center gap-2.5">
            <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size={34} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-200">{user.username}</p>
              {user.isDemo ? (
                <DemoBadge compact className="mt-0.5" />
              ) : (
                <p className="truncate text-[11px] text-zinc-500">Roblox · {user.robloxUserId?.slice(0, 10)}…</p>
              )}
            </div>
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="h-8 w-8 text-zinc-500 hover:text-zinc-200"
                    aria-label="Se déconnecter"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Se déconnecter</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function AppShell() {
  const view = useLunaStore((s) => s.view);
  const setView = useLunaStore((s) => s.setView);
  const user = useLunaStore((s) => s.user);
  const setUser = useLunaStore((s) => s.setUser);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Garde : aucune vue applicative sans session.
  useEffect(() => {
    if (!user && view !== "landing") {
      setUser(null);
      setView("landing");
    }
  }, [user, view, setView, setUser]);

  const renderView = () => {
    switch (view) {
      case "dashboard":
        return <DashboardView />;
      case "atelier":
        return <AtelierView />;
      case "clinique":
        return <CliniqueView />;
      case "economie":
        return <GameplayView />;
      case "historique":
        return <HistoriqueView />;
      case "parametres":
        return <ParametresView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex min-h-dvh bg-zinc-950">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-zinc-800/70 bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Zone principale */}
      <div className="flex min-h-dvh w-full flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-800/70 bg-zinc-950/85 px-4 backdrop-blur lg:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Ouvrir la navigation">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 border-zinc-800 bg-sidebar p-0 [&>button]:text-zinc-400">
              <SheetTitle className="sr-only">Navigation Luna AI</SheetTitle>
              <SidebarContent onNavigate={() => setMobileNavOpen(false)} />
            </SheetContent>
          </Sheet>
          <LunaLogo />
        </header>

        <main className="flex-1">{renderView()}</main>
      </div>
    </div>
  );
}
