"use client";

/**
 * Luna AI — Point d'entrée unique de l'application.
 * SPA : landing publique + application (dashboard, assistants, historique,
 * paramètres) naviguées côté client sur la route unique « / ».
 */
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { LandingPage } from "@/components/luna/landing/landing-page";
import { AppShell } from "@/components/luna/app-shell";
import { AuthDialog } from "@/components/luna/auth-dialog";
import { useLunaStore } from "@/hooks/use-luna-store";
import type { AppPublicConfig, UserProfile } from "@/lib/types";

export default function Home() {
  const view = useLunaStore((s) => s.view);
  const authChecked = useLunaStore((s) => s.authChecked);
  const setAuthChecked = useLunaStore((s) => s.setAuthChecked);
  const setUser = useLunaStore((s) => s.setUser);
  const setConfig = useLunaStore((s) => s.setConfig);
  const setAuthDialogOpen = useLunaStore((s) => s.setAuthDialogOpen);
  const hydrateFromHash = useLunaStore((s) => s.hydrateFromHash);

  useEffect(() => {
    hydrateFromHash();

    let cancelled = false;

    const boot = async () => {
      // 1. Configuration publique (OAuth configuré ? fournisseur IA ?).
      try {
        const response = await fetch("/api/config");
        if (response.ok && !cancelled) {
          setConfig((await response.json()) as AppPublicConfig);
        }
      } catch {
        // La config est optionnelle : l'interface fonctionne quand même.
      }

      // 2. Session existante ?
      try {
        const response = await fetch("/api/user/profile");
        if (response.ok && !cancelled) {
          setUser((await response.json()) as UserProfile);
        } else if (!cancelled) {
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthChecked(true);
      }

      // 3. Erreur d'authentification remontée par le callback OAuth.
      const params = new URLSearchParams(window.location.search);
      const authError = params.get("auth_error");
      if (authError && !cancelled) {
        const messages: Record<string, string> = {
          AUTH_REFUSED: "Connexion Roblox annulée.",
          STATE_MISMATCH: "Session de connexion expirée (protection CSRF). Réessaie.",
          SESSION_EXPIRED: "Session de connexion expirée. Réessaie.",
          MISSING_PARAMS: "Réponse Roblox incomplète. Réessaie.",
          OAUTH_NOT_CONFIGURED: "L'authentification Roblox n'est pas configurée sur ce serveur.",
          OAUTH_FAILED: "La connexion Roblox a échoué. Réessaie dans un instant.",
        };
        import("sonner").then(({ toast }) => {
          toast.error(messages[authError] ?? "Échec de la connexion Roblox.");
        });
        history.replaceState(null, "", window.location.pathname);
        setAuthDialogOpen(true);
      }
    };

    void boot();
    return () => {
      cancelled = true;
    };
  }, [hydrateFromHash, setAuthChecked, setAuthDialogOpen, setConfig, setUser]);

  const isAppView = view !== "landing";

  if (!authChecked && isAppView) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-950">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" aria-label="Chargement de Luna AI" />
      </div>
    );
  }

  return (
    <>
      {isAppView ? <AppShell /> : <LandingPage />}
      <AuthDialog />
    </>
  );
}
