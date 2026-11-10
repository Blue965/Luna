"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LunaLogo } from "@/components/luna/logo";
import { useLunaStore } from "@/hooks/use-luna-store";

export function LandingNav() {
  const setView = useLunaStore((s) => s.setView);
  const setAuthDialogOpen = useLunaStore((s) => s.setAuthDialogOpen);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onScroll = useCallback(() => setScrolled(window.scrollY > 12), []);
  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  const goToFeatures = () => {
    const el = document.getElementById("fonctionnalites");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else setView("landing");
  };

  const goToHow = () => {
    const el = document.getElementById("comment-ca-marche");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else setView("landing");
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        scrolled ? "border-b border-zinc-800/70 bg-zinc-950/85 backdrop-blur" : "bg-transparent"
      }`}
    >
      <nav aria-label="Navigation principale" className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-5">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-violet-500"
          aria-label="Retour en haut"
        >
          <LunaLogo />
        </button>

        <div className="hidden items-center gap-1 md:flex">
          <button
            type="button"
            onClick={goToFeatures}
            className="rounded-md px-3 py-1.5 text-[13.5px] text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            Fonctionnalités
          </button>
          <button
            type="button"
            onClick={goToHow}
            className="rounded-md px-3 py-1.5 text-[13.5px] text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline-2 focus-visible:outline-violet-500"
          >
            Comment ça marche
          </button>
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          <Button
            variant="ghost"
            onClick={() => setAuthDialogOpen(true)}
            className="text-zinc-300 hover:text-zinc-100"
          >
            Connexion
          </Button>
          <Button
            onClick={() => setAuthDialogOpen(true)}
            className="gap-1.5 bg-violet-600 font-medium text-white hover:bg-violet-500"
          >
            Commencer gratuitement
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="ml-auto md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen((v) => !v)} aria-label="Ouvrir le menu" aria-expanded={mobileOpen}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-zinc-800/70 bg-zinc-950/95 px-5 py-4 backdrop-blur md:hidden">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                goToFeatures();
              }}
              className="rounded-md px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/60"
            >
              Fonctionnalités
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                goToHow();
              }}
              className="rounded-md px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/60"
            >
              Comment ça marche
            </button>
            <Button
              variant="outline"
              onClick={() => {
                setMobileOpen(false);
                setAuthDialogOpen(true);
              }}
              className="border-zinc-700"
            >
              Connexion
            </Button>
            <Button
              onClick={() => {
                setMobileOpen(false);
                setAuthDialogOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-500"
            >
              Commencer gratuitement
            </Button>
          </div>
        </div>
      ) : null}
    </header>
  );
}
