"use client";

/**
 * Hero de la landing page avec prévisualisation réaliste de l'application
 * (sidebar, éditeur Luau coloré, panneau d'explication).
 */
import { ArrowRight, Circle, FileCode2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuauCode } from "@/components/luna/luau-highlighter";
import { useLunaStore } from "@/hooks/use-luna-store";

const PREVIEW_CODE = `-- Luna AI · Générateur de récompenses quotidiennes
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local rewardStore = DataStoreService:GetDataStore("DailyRewards_v1")
local STREAK_BONUS = 1.25

local function computeReward(streak: number): number
	-- Base 250 + bonus de streak plafonné à 7 jours
	local capped = math.min(streak, 7)
	return math.floor(250 * STREAK_BONUS ^ (capped - 1))
end

local function onClaim(player: Player, claimed: boolean)
	if typeof(claimed) ~= "boolean" then return end
	local success, result = pcall(function()
		return rewardStore:UpdateAsync(player.UserId .. "_streak", function(old)
			return (old or 0) + 1
		end)
	end)
	if success then
		player:SetAttribute("RewardReady", false)
	end
end`;

export function Hero() {
  const setView = useLunaStore((s) => s.setView);
  const setAuthDialogOpen = useLunaStore((s) => s.setAuthDialogOpen);

  return (
    <section className="relative overflow-hidden pt-36 pb-20 sm:pt-44">
      {/* Fond : grille technique + halo violet discret */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-60" />
        <div className="absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-violet-600/14 blur-[120px]" />
        <div className="absolute right-1/4 top-40 h-64 w-64 rounded-full bg-sky-500/8 blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-up mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[12px] font-medium text-violet-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-400" />
            </span>
            L&apos;assistant IA spécialisé Roblox Studio &amp; Luau
          </div>

          <h1 className="animate-fade-up text-4xl font-bold leading-[1.08] tracking-tight text-zinc-50 sm:text-6xl">
            Code plus vite.
            <br />
            <span className="text-gradient">Crée sans limites.</span>
          </h1>

          <p className="animate-fade-up mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-zinc-400 sm:text-base">
            L&apos;assistant IA conçu pour Roblox Studio. Génère du Luau sécurisé,
            corrige tes bugs et construis des mécaniques de gameplay plus intelligentes.
          </p>

          <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              onClick={() => setAuthDialogOpen(true)}
              className="h-11 gap-2 bg-violet-600 px-6 font-medium text-white hover:bg-violet-500 glow-violet"
            >
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              Commencer avec Roblox
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const el = document.getElementById("fonctionnalites");
                el?.scrollIntoView({ behavior: "smooth" });
              }}
              className="h-11 gap-2 border-zinc-700 bg-transparent px-6 text-zinc-200 hover:bg-zinc-800/70"
            >
              Découvrir les fonctionnalités
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* Prévisualisation de l'application */}
        <div className="animate-fade-up relative mx-auto mt-16 max-w-4xl">
          <div className="absolute -inset-x-8 -top-8 h-40 bg-gradient-to-b from-violet-600/12 to-transparent blur-2xl" aria-hidden="true" />
          <div className="relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-925 shadow-2xl shadow-black/60 ring-1 ring-violet-500/10">
            {/* Barre de fenêtre */}
            <div className="flex h-10 items-center gap-2 border-b border-zinc-800/80 bg-zinc-900/80 px-4">
              <div className="flex gap-1.5">
                <Circle className="h-3 w-3 fill-zinc-700 text-zinc-700" aria-hidden="true" />
                <Circle className="h-3 w-3 fill-zinc-700 text-zinc-700" aria-hidden="true" />
                <Circle className="h-3 w-3 fill-zinc-700 text-zinc-700" aria-hidden="true" />
              </div>
              <div className="ml-3 flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-[11px] text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-violet-500" aria-hidden="true" />
                luna.ai / atelier-luau
              </div>
            </div>

            <div className="flex">
              {/* Mini sidebar */}
              <div className="hidden w-44 shrink-0 border-r border-zinc-800/70 bg-zinc-950/60 p-3 sm:block">
                {[
                  "Vue d'ensemble",
                  "Atelier Luau",
                  "Clinique du Code",
                  "Économie & Gameplay",
                  "Historique",
                  "Paramètres",
                ].map((label, i) => (
                  <div
                    key={label}
                    className={`mb-1 flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] ${
                      i === 1 ? "bg-violet-500/15 font-medium text-violet-300" : "text-zinc-500"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${i === 1 ? "bg-violet-400" : "bg-zinc-700"}`} aria-hidden="true" />
                    {label}
                  </div>
                ))}
              </div>

              {/* Éditeur */}
              <div className="min-w-0 flex-1 border-r border-zinc-800/60">
                <div className="flex items-center justify-between border-b border-zinc-800/60 px-3 py-2">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-400">
                    <FileCode2 className="h-3.5 w-3.5 text-violet-400" aria-hidden="true" />
                    DailyRewards.luau
                  </span>
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
                    Généré
                  </span>
                </div>
                <div className="max-h-64 overflow-hidden p-4 sm:max-h-72">
                  <LuauCode code={PREVIEW_CODE} />
                </div>
              </div>

              {/* Panneau explication (desktop uniquement) */}
              <div className="hidden w-64 shrink-0 flex-col p-4 lg:flex">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Explication</p>
                <div className="mt-3 space-y-3 text-[12px] leading-relaxed text-zinc-400">
                  <p>
                    <span className="font-medium text-zinc-200">Rate limiting</span> intégré : le
                    serveur ignore les demandes trop fréquentes.
                  </p>
                  <p>
                    <span className="font-medium text-zinc-200">DataStore</span> protégé par{" "}
                    <span className="font-mono text-sky-300">pcall</span> — aucune perte de données
                    en cas d&apos;erreur réseau.
                  </p>
                  <div className="rounded-md border border-zinc-800 bg-zinc-900/60 p-2.5">
                    <p className="text-[11px] text-zinc-500">Emplacement</p>
                    <p className="mt-0.5 text-[12px] text-zinc-300">ServerScriptService</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
