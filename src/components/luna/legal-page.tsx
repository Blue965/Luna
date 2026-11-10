import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LunaLogo } from "@/components/luna/logo";

/**
 * Gabarit commun des pages légales publiques (/privacy, /terms).
 * Pages statiques accessibles sans authentification — requises par
 * la review des applications OAuth 2.0 de Roblox.
 */
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-800/60 bg-zinc-950/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5">
          <Link href="/" aria-label="Retour à l'accueil Luna AI">
            <LunaLogo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-400 transition-colors hover:text-zinc-100"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-5 py-14">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 sm:text-4xl">{title}</h1>
          <p className="mt-3 font-mono text-[12.5px] text-zinc-500">En vigueur : {updated}</p>
          <div className="legal-body mt-10 space-y-8">{children}</div>
        </article>
      </main>

      <footer className="border-t border-zinc-800/60">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-5 py-8 sm:flex-row">
          <p className="text-[12.5px] text-zinc-500">
            Luna AI n&apos;est pas affiliée à Roblox Corporation.
          </p>
          <nav className="flex items-center gap-4 text-[12.5px] text-zinc-500">
            <Link href="/privacy" className="transition-colors hover:text-zinc-300">
              Confidentialité
            </Link>
            <span aria-hidden="true" className="text-zinc-700">
              ·
            </span>
            <Link href="/terms" className="transition-colors hover:text-zinc-300">
              Conditions d&apos;utilisation
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/** Section numérotée d'une page légale. */
export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="flex items-baseline gap-3 text-[17px] font-semibold text-zinc-100">
        <span className="font-mono text-[13px] font-medium text-violet-400">{number}</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-[14px] leading-relaxed text-zinc-400">{children}</div>
    </section>
  );
}

/** Puce de mise en évidence (encadré discret). */
export function LegalNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-violet-500/25 bg-violet-500/[0.06] px-4 py-3 text-[13.5px] leading-relaxed text-zinc-300">
      {children}
    </div>
  );
}
