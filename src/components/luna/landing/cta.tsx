"use client";

/** Sections « Comment ça marche » et CTA finale + footer. */
import Link from "next/link";
import { ArrowRight, Blocks, PlayCircle, Rocket, UserRoundCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LunaLogo } from "@/components/luna/logo";
import { useLunaStore } from "@/hooks/use-luna-store";

const STEPS = [
  {
    icon: UserRoundCheck,
    title: "Connecte-toi avec Roblox",
    text: "Authentification officielle OAuth avec PKCE. Ton profil Roblox est associé à ton compte Luna AI, sans jamais saisir de mot de passe ici.",
  },
  {
    icon: Blocks,
    title: "Décris ton besoin",
    text: "Type de script, niveau, priorité. Luna sélectionne les instructions système adaptées et génère du Luau conforme aux bonnes pratiques.",
  },
  {
    icon: Rocket,
    title: "Récupère ton système",
    text: "Code prêt à coller dans Studio, emplacement recommandé, explication pédagogique. Tout est conservé dans ton historique.",
  },
];

export function HowItWorks() {
  return (
    <section id="comment-ca-marche" className="scroll-mt-24 border-t border-zinc-800/60 py-20">
      <div className="mx-auto max-w-6xl px-5">
        <div className="max-w-2xl">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-sky-400">Comment ça marche</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">
            De l&apos;idée au script, en trois étapes
          </h2>
        </div>

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative rounded-xl border border-zinc-800 bg-zinc-925 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-md border border-violet-500/30 bg-violet-500/10">
                  <step.icon className="h-4.5 w-4.5 text-violet-400" aria-hidden="true" />
                </span>
                <span className="font-mono text-[12px] text-zinc-500">Étape {index + 1}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-400">{step.text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex items-center gap-3 text-[13px] text-zinc-500">
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          Luna ne prétend jamais avoir testé un script dans Studio : elle explique ses hypothèses, tu valides.
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const setAuthDialogOpen = useLunaStore((s) => s.setAuthDialogOpen);

  return (
    <section className="relative overflow-hidden py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-40" />
        <div className="absolute bottom-0 left-1/2 h-72 w-[640px] -translate-x-1/2 rounded-full bg-violet-600/12 blur-[110px]" />
      </div>
      <div className="relative mx-auto max-w-3xl px-5 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Ton prochain système commence ici.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-zinc-400">
          Rejoins Luna AI et construis des jeux Roblox plus solides : code sécurisé,
          bugs réparés, gameplay équilibré.
        </p>
        <div className="mt-8">
          <Button
            size="lg"
            onClick={() => setAuthDialogOpen(true)}
            className="h-11 gap-2 bg-violet-600 px-7 font-medium text-white hover:bg-violet-500 glow-violet"
          >
            Rejoindre Luna AI
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export function LandingFooter() {
  return (
    <footer className="border-t border-zinc-800/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <LunaLogo />
        <div className="flex flex-col items-center gap-1.5 sm:items-end">
          <p className="text-[12.5px] text-zinc-500">
            Copilote technique pour développeurs Roblox — Luna AI n&apos;est pas affiliée à Roblox Corporation.
          </p>
          <nav className="flex items-center gap-3 text-[12px] text-zinc-500" aria-label="Liens légaux">
            <Link href="/privacy" className="transition-colors hover:text-zinc-300">
              Politique de confidentialité
            </Link>
            <span aria-hidden="true" className="text-zinc-700">
              ·
            </span>
            <Link href="/terms" className="transition-colors hover:text-zinc-300">
              Conditions d&apos;utilisation
            </Link>
          </nav>
        </div>
        <p className="font-mono text-[12px] text-zinc-600">« Code plus vite. Crée sans limites. »</p>
      </div>
    </footer>
  );
}
