"use client";

/**
 * Boîte de dialogue de connexion — exclusivement Roblox.
 * - OAuth officiel si configuré (redirection vers Roblox).
 * - Mode démo clairement identifié sinon (jamais présenté comme réel).
 */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LunaLogo } from "@/components/luna/logo";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import type { AppPublicConfig } from "@/lib/types";

export function AuthDialog() {
  const authDialogOpen = useLunaStore((s) => s.authDialogOpen);
  const setAuthDialogOpen = useLunaStore((s) => s.setAuthDialogOpen);
  const config = useLunaStore((s) => s.config);
  const setConfig = useLunaStore((s) => s.setConfig);
  const [demoLoading, setDemoLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  /** Re-vérifie la configuration OAuth (utile si l'admin vient de la renseigner). */
  const checkRoblox = async () => {
    setChecking(true);
    try {
      const response = await fetch("/api/config");
      if (response.ok) {
        const next = (await response.json()) as AppPublicConfig;
        setConfig(next);
        if (next.robloxOAuthConfigured) {
          toast.success("OAuth Roblox détecté : connecte-toi maintenant !");
        } else {
          toast.info("OAuth Roblox toujours non configuré sur ce serveur.");
        }
      }
    } catch {
      toast.error("Erreur réseau pendant la vérification.");
    } finally {
      setChecking(false);
    }
  };

  const startDemo = async () => {
    setDemoLoading(true);
    try {
      const response = await fetch("/api/auth/demo", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Impossible de démarrer le mode démo.");
        return;
      }
      setAuthDialogOpen(false);
      // Recharge le profil puis passe au dashboard.
      window.location.hash = "#/dashboard";
      window.location.reload();
    } catch {
      toast.error("Erreur réseau. Réessaie.");
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
      <DialogContent className="max-w-md border-zinc-800 bg-zinc-900 p-0 text-zinc-100 sm:rounded-xl">
        <DialogHeader className="px-6 pt-6">
          <div className="mb-1 flex justify-center">
            <LunaLogo className="text-lg" />
          </div>
          <DialogTitle className="text-center text-lg">Connexion à Luna AI</DialogTitle>
          <DialogDescription className="text-center text-sm text-zinc-400">
            Connecte-toi avec ton compte Roblox pour retrouver ton historique et tes générations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 pb-6">
          {config?.robloxOAuthConfigured ? (
            <a href="/api/auth/roblox" className="block" data-testid="roblox-login">
              <Button
                className="h-11 w-full gap-2 bg-zinc-100 font-medium text-zinc-900 hover:bg-zinc-300"
                aria-label="Se connecter avec Roblox"
              >
                <RobloxIcon />
                Se connecter avec Roblox
              </Button>
            </a>
          ) : (
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
              <p className="text-sm font-medium text-zinc-200">Authentification Roblox officielle</p>
              <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
                L&apos;OAuth Roblox n&apos;est pas encore configuré sur ce serveur
                (variables <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">ROBLOX_CLIENT_ID</code> /{" "}
                <code className="rounded bg-zinc-800 px-1 font-mono text-[11px]">ROBLOX_CLIENT_SECRET</code>).
                Luna AI attend ses identifiants avant toute connexion réelle — aucun pseudonyme
                saisi à la main n&apos;est accepté pour l&apos;authentification.
              </p>
              <Button
                variant="outline"
                onClick={() => void checkRoblox()}
                disabled={checking}
                className="mt-3 w-full gap-2 border-zinc-700 hover:bg-zinc-800"
                aria-label="Vérifier si l'authentification Roblox est désormais disponible"
              >
                {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <RobloxIcon />}
                Vérifier la disponibilité Roblox
              </Button>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-500">ou</span>
            <Separator className="flex-1" />
          </div>

          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-amber-400">Mode démonstration</p>
            <p className="mt-1 text-[13px] leading-relaxed text-zinc-400">
              Crée un compte fictif clairement identifié pour explorer l&apos;interface et les
              assistants avec des données d&apos;exemple. Ce n&apos;est <strong className="text-amber-400/90">pas</strong> une
              authentification Roblox réelle.
            </p>
            <Button
              variant="outline"
              onClick={startDemo}
              disabled={demoLoading}
              className="mt-3 w-full border-amber-500/40 bg-transparent text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
              aria-label="Continuer en mode démo"
            >
              {demoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Continuer en mode démo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RobloxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M5.16 5.98 18.3 1.73a.6.6 0 0 1 .75.4l3.93 12.42a.6.6 0 0 1-.4.75L9.44 19.55a.6.6 0 0 1-.75-.4L4.76 6.73a.6.6 0 0 1 .4-.75Zm7.11 4.62-1.68 4.16 4.16-1.33 1.34-4.16-3.82 1.33Z" />
    </svg>
  );
}
