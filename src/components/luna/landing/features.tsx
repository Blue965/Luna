"use client";

/** Section Fonctionnalités — Bento Grid des trois assistants Luna AI. */
import { ArrowUpRight, Gamepad2, Hammer, ShieldCheck, Stethoscope, Wand2, Activity, LineChart } from "lucide-react";
import { useLunaStore } from "@/hooks/use-luna-store";
import type { ViewId } from "@/lib/types";

function BentoCard({
  number,
  title,
  description,
  children,
  onOpen,
  className,
}: {
  number: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  onOpen: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-925 p-6 text-left transition-colors hover:border-violet-500/40 focus-visible:outline-2 focus-visible:outline-violet-500 ${className ?? ""}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-600/10 blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[12px] font-medium text-violet-400">{number}</span>
        <ArrowUpRight className="h-4 w-4 text-zinc-600 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-violet-400" aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-lg font-semibold tracking-tight text-zinc-100">{title}</h3>
      <p className="mt-1.5 max-w-md text-[13.5px] leading-relaxed text-zinc-400">{description}</p>
      {children}
    </button>
  );
}

export function Features() {
  const setView = useLunaStore((s) => s.setView);
  const open = (view: ViewId) => () => {
    // La landing n'est pas connectée : les cartes ouvrent la boîte de connexion.
    setView("landing");
    useLunaStore.getState().setAuthDialogOpen(true);
  };

  return (
    <section id="fonctionnalites" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-violet-400">Fonctionnalités</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            Trois assistants, un seul objectif :{" "}
            <span className="text-zinc-400">te faire avancer plus vite</span>
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <BentoCard
            number="01"
            title="L'Atelier Luau"
            description="Génération de scripts propres, commentés et optimisés — Script, LocalScript ou ModuleScript, avec explication et emplacement dans Studio."
            onOpen={open("atelier")}
            className="md:col-span-2 lg:col-span-1 lg:row-span-2"
          >
            <div className="mt-6 space-y-3">
              <div className="rounded-lg border border-zinc-800/80 bg-zinc-950/70 p-3 font-mono text-[11.5px] text-zinc-400">
                <span className="text-violet-400">local</span>{" "}
                <span className="text-sky-300">player</span> = Players.<span className="text-yellow-100">LocalPlayer</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5 text-[12px] text-zinc-400">
                <Wand2 className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                Commentaires et conventions Luau inclus
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5 text-[12px] text-zinc-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                Validations serveur et RemoteEvents protégés
              </div>
            </div>
          </BentoCard>

          <BentoCard
            number="02"
            title="La Clinique du Code"
            description="Colle ton code et l'erreur de l'Output : diagnostic, cause probable, correction minimale et conseils pour que ça ne revienne plus."
            onOpen={open("clinique")}
          >
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-red-500/25 bg-red-500/8 px-3 py-2 font-mono text-[11px] text-red-300/90">
              <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              attempt to index nil with &apos;Character&apos;
            </div>
          </BentoCard>

          <BentoCard
            number="03"
            title="Architecte Gameplay"
            description="Conception et équilibrage : économies de Tycoon, XP, niveaux, récompenses quotidiennes, prestige — avec formules et exemples Luau."
            onOpen={open("economie")}
          >
            <div className="mt-5 flex items-center gap-4 rounded-lg border border-zinc-800/80 bg-zinc-950/70 px-3 py-2.5">
              <Gamepad2 className="h-4 w-4 text-sky-400" aria-hidden="true" />
              <span className="font-mono text-[11.5px] text-zinc-300">XP(n) = 100 × 1,35^(n−1)</span>
              <LineChart className="ml-auto h-4 w-4 text-zinc-600" aria-hidden="true" />
            </div>
          </BentoCard>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-925/60 px-5 py-4">
          <Activity className="h-4 w-4 shrink-0 text-violet-400" aria-hidden="true" />
          <p className="text-[13px] text-zinc-400">
            Chaque demande passe par des <span className="text-zinc-200">instructions système spécialisées</span>,
            une validation stricte et une limite d&apos;utilisation — côté serveur, jamais modifiables depuis le frontend.
          </p>
        </div>
      </div>
    </section>
  );
}
