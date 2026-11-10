"use client";

/**
 * Vue d'ensemble : message de bienvenue personnalisé, pseudonyme et avatar
 * Roblox, statistiques réelles, activité récente, accès rapides.
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Bug, Gamepad2, Hammer, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/luna/user-avatar";
import { DemoBadge } from "@/components/luna/demo-badge";
import { useLunaStore } from "@/hooks/use-luna-store";
import type { AssistantType, UserStats, ViewId } from "@/lib/types";

const QUICK_ACCESS: Array<{ view: ViewId; icon: React.ComponentType<{ className?: string }>; title: string; text: string }> = [
  { view: "atelier", icon: Hammer, title: "Atelier Luau", text: "Générer un script propre et sécurisé" },
  { view: "clinique", icon: Bug, title: "Clinique du Code", text: "Réparer une erreur de l'Output" },
  { view: "economie", icon: Gamepad2, title: "Économie & Gameplay", text: "Équilibrer XP, prix et récompenses" },
];

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number | null; icon: React.ComponentType<{ className?: string }>; accent: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-925 p-5">
      <div className="flex items-center justify-between">
        <span className="text-[12.5px] text-zinc-400">{label}</span>
        <span className={`rounded-md border p-1.5 ${accent}`}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
      {value === null ? (
        <Skeleton className="mt-3 h-8 w-16 bg-zinc-800" />
      ) : (
        <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight text-zinc-50">{value}</p>
      )}
    </div>
  );
}

export function DashboardView() {
  const user = useLunaStore((s) => s.user);
  const setView = useLunaStore((s) => s.setView);
  const [stats, setStats] = useState<UserStats | null>(null);

  // Chargement des statistiques via callbacks (aucun setState synchrone dans l'effet).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error("stats"))))
      .then((json) => {
        if (!cancelled) setStats(json as UserStats);
      })
      .catch(() => {
        // Le dashboard reste utilisable sans stats (valeurs à 0).
        if (!cancelled) {
          setStats({ generations: 0, bugs: 0, gameplay: 0, total: 0, recent: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!user) return null;

  const hour = new Date().getHours();
  const greeting = hour < 6 ? "Bonne nuit" : hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const ASSISTANT_LABEL: Record<AssistantType, string> = {
    atelier: "Atelier Luau",
    clinique: "Clinique du Code",
    gameplay: "Économie & Gameplay",
  };

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      {/* Bienvenue */}
      <div className="flex flex-wrap items-center gap-4">
        <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size={56} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-50 sm:text-2xl">
              {greeting}, <span className="text-violet-300">{user.username}</span>
            </h1>
            {user.isDemo ? <DemoBadge /> : null}
          </div>
          <p className="mt-1 text-[13.5px] text-zinc-400">
            {user.isDemo
              ? "Compte de démonstration — explore librement les trois assistants."
              : "Prêt à construire quelque chose de solide aujourd'hui ?"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setView("parametres")}
          className="ml-auto border-zinc-700 text-zinc-300 hover:bg-zinc-800"
        >
          <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Paramètres
        </Button>
      </div>

      {/* Statistiques */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Scripts générés" value={stats?.generations ?? null} icon={Hammer} accent="border-violet-500/30 bg-violet-500/10 text-violet-400" />
        <StatCard label="Bugs analysés" value={stats?.bugs ?? null} icon={Bug} accent="border-sky-500/30 bg-sky-500/10 text-sky-400" />
        <StatCard label="Conversations gameplay" value={stats?.gameplay ?? null} icon={Gamepad2} accent="border-emerald-500/30 bg-emerald-500/10 text-emerald-400" />
      </div>

      {/* Accès rapides */}
      <h2 className="mt-10 text-[15px] font-semibold text-zinc-100">Accès rapides</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {QUICK_ACCESS.map((item) => (
          <button
            key={item.view}
            type="button"
            onClick={() => setView(item.view)}
            className="group rounded-xl border border-zinc-800 bg-zinc-925 p-4 text-left transition-colors hover:border-violet-500/40 hover:bg-zinc-900 focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-700/70 bg-zinc-900">
              <item.icon className="h-4 w-4 text-violet-400" aria-hidden="true" />
            </span>
            <p className="mt-3 text-[14px] font-semibold text-zinc-100">{item.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-400">{item.text}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-violet-400 opacity-0 transition-opacity group-hover:opacity-100">
              Ouvrir <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </span>
          </button>
        ))}
      </div>

      {/* Activité récente */}
      <h2 className="mt-10 text-[15px] font-semibold text-zinc-100">Activité récente</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-925">
        {stats === null ? (
          <div className="space-y-2 p-4">
            <Skeleton className="h-10 w-full bg-zinc-800/70" />
            <Skeleton className="h-10 w-full bg-zinc-800/70" />
            <Skeleton className="h-10 w-full bg-zinc-800/70" />
          </div>
        ) : stats.recent.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-5 py-10 text-center">
            <p className="text-[14px] font-medium text-zinc-300">Aucune activité pour le moment</p>
            <p className="max-w-sm text-[13px] text-zinc-500">
              Lance ta première génération dans l&apos;Atelier Luau : elle apparaîtra ici automatiquement.
            </p>
            <Button onClick={() => setView("atelier")} className="mt-2 bg-violet-600 text-white hover:bg-violet-500">
              Ouvrir l&apos;Atelier Luau
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-800/70">
            {stats.recent.map((conversation) => (
              <li key={conversation.id}>
                <button
                  type="button"
                  onClick={() => setView("historique")}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-900/70 focus-visible:outline-2 focus-visible:outline-violet-500"
                >
                  <span className="rounded-md border border-zinc-700/60 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                    {ASSISTANT_LABEL[conversation.assistantType]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] text-zinc-200">{conversation.title}</span>
                  <span className="shrink-0 text-[12px] tabular-nums text-zinc-500">
                    {new Date(conversation.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
