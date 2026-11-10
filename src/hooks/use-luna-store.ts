"use client";

/**
 * État global Luna AI : vue courante (SPA), utilisateur, configuration publique.
 * La vue est synchronisée avec le hash d'URL pour permettre le lien direct
 * (ex : #/atelier) tout en restant sur la route unique /.
 */
import { create } from "zustand";
import type { AppPublicConfig, UserProfile, ViewId } from "@/lib/types";

const VALID_HASH_VIEWS: ViewId[] = [
  "landing",
  "dashboard",
  "atelier",
  "clinique",
  "economie",
  "historique",
  "parametres",
];

function viewFromHash(): ViewId | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#\/?/, "");
  return (VALID_HASH_VIEWS as string[]).includes(hash) ? (hash as ViewId) : null;
}

function syncHash(view: ViewId) {
  if (typeof window === "undefined") return;
  const target = view === "landing" ? "" : `#/${view}`;
  const current = window.location.hash.replace(/^#/, "");
  if (current !== target.replace(/^#/, "")) {
    history.replaceState(null, "", `${window.location.pathname}${target}`);
  }
}

interface LunaStore {
  view: ViewId;
  setView: (view: ViewId) => void;
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  config: AppPublicConfig | null;
  setConfig: (config: AppPublicConfig | null) => void;
  authChecked: boolean;
  setAuthChecked: (checked: boolean) => void;
  authDialogOpen: boolean;
  setAuthDialogOpen: (open: boolean) => void;
  /** Ouvre un assistant après génération (pour l'historique "continuer"). */
  gameplayConversationId: string | null;
  setGameplayConversationId: (id: string | null) => void;
  hydrateFromHash: () => void;
}

export const useLunaStore = create<LunaStore>((set, get) => ({
  view: "landing",
  setView: (view) => {
    set({ view });
    syncHash(view);
    // Ramène en haut à chaque changement de vue.
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  },
  user: null,
  setUser: (user) => {
    set({ user });
    // Déconnexion → retour à la landing.
    if (!user && get().view !== "landing") {
      set({ view: "landing" });
      syncHash("landing");
    }
  },
  config: null,
  setConfig: (config) => set({ config }),
  authChecked: false,
  setAuthChecked: (authChecked) => set({ authChecked }),
  authDialogOpen: false,
  setAuthDialogOpen: (authDialogOpen) => set({ authDialogOpen }),
  gameplayConversationId: null,
  setGameplayConversationId: (gameplayConversationId) => set({ gameplayConversationId }),
  hydrateFromHash: () => {
    const view = viewFromHash();
    if (view && view !== "landing") {
      // Les vues applicatives nécessitent une session : on les garde,
      // le shell gérera l'éventuelle redirection vers la landing.
      set({ view });
    }
  },
}));
