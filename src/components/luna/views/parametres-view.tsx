"use client";

/**
 * Paramètres — profil Roblox associé, informations du compte,
 * préférences d'interface, utilisation, déconnexion et suppression du compte.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, LogOut, Settings, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { UserAvatar } from "@/components/luna/user-avatar";
import { DemoBadge } from "@/components/luna/demo-badge";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import { preferencesSchema } from "@/lib/validation";
import type { ScriptFocus, ScriptLevel, ScriptType, UserPreferences, UserStats } from "@/lib/types";

export function ParametresView() {
  const user = useLunaStore((s) => s.user);
  const setUser = useLunaStore((s) => s.setUser);
  const setView = useLunaStore((s) => s.setView);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) setPreferences(user.preferences);
    void (async () => {
      try {
        const response = await fetch("/api/stats");
        if (response.ok) setStats((await response.json()) as UserStats);
      } catch {
        setStats(null);
      }
    })();
  }, [user]);

  const savePreferences = useCallback(
    async (next: UserPreferences) => {
      const parsed = preferencesSchema.safeParse(next);
      if (!parsed.success || !user) return;
      setPreferences(next);
      setSaving(true);
      try {
        const response = await fetch("/api/user/preferences", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        if (!response.ok) {
          toast.error("Impossible d'enregistrer les préférences.");
          return;
        }
        setUser({ ...user, preferences: next });
        setSavedFlash(true);
        setTimeout(() => setSavedFlash(false), 1500);
      } finally {
        setSaving(false);
      }
    },
    [user, setUser]
  );

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.hash = "";
      window.location.reload();
    } catch {
      toast.error("Échec de la déconnexion.");
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/user/account", { method: "DELETE" });
      if (!response.ok) {
        toast.error("La suppression a échoué. Réessaie.");
        return;
      }
      toast.success("Compte et données supprimés. À bientôt !");
      window.location.hash = "";
      window.location.reload();
    } catch {
      toast.error("Erreur réseau pendant la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  if (!user || !preferences) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" aria-label="Chargement" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700/70 bg-zinc-900">
          <Settings className="h-5 w-5 text-zinc-300" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">Paramètres</h1>
          <p className="text-[13px] text-zinc-400">Profil, préférences et gestion du compte.</p>
        </div>
      </div>

      {/* Profil */}
      <section aria-labelledby="profile-heading" className="mt-8 rounded-xl border border-zinc-800 bg-zinc-925 p-5">
        <h2 id="profile-heading" className="flex items-center gap-2 text-[15px] font-semibold text-zinc-100">
          <UserRound className="h-4 w-4 text-violet-400" aria-hidden="true" />
          Profil
        </h2>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size={56} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[15px] font-semibold text-zinc-100">{user.username}</p>
              {user.isDemo ? <DemoBadge compact /> : null}
            </div>
            <p className="mt-0.5 text-[12.5px] text-zinc-500">
              {user.displayName ? `${user.displayName} · ` : ""}
              {user.robloxUserId ? `Roblox ID : ${user.robloxUserId}` : "Compte de démonstration (sans Roblox ID)"}
            </p>
            <p className="text-[12px] text-zinc-500">
              Membre depuis le {new Date(user.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-[12.5px] leading-relaxed text-zinc-400">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
          {user.isDemo
            ? "Ce compte est fictif : aucune authentification Roblox n'a été effectuée. Connecte-toi avec Roblox pour un compte réel."
            : "Ce compte est lié à ton profil Roblox via l'authentification officielle OAuth (PKCE). Aucun mot de passe n'est stocké par Luna AI."}
        </div>
      </section>

      {/* Préférences */}
      <section aria-labelledby="prefs-heading" className="mt-5 rounded-xl border border-zinc-800 bg-zinc-925 p-5">
        <div className="flex items-center justify-between">
          <h2 id="prefs-heading" className="text-[15px] font-semibold text-zinc-100">
            Préférences d&apos;interface
          </h2>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" aria-hidden="true" />
          ) : savedFlash ? (
            <span className="flex items-center gap-1 text-[12px] text-emerald-400">
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Enregistré
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-[13px] text-zinc-300">Type de script par défaut</Label>
            <Select
              value={preferences.defaultScriptType}
              onValueChange={(v) => void savePreferences({ ...preferences, defaultScriptType: v as ScriptType })}
            >
              <SelectTrigger className="mt-2 border-zinc-800 bg-zinc-950/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectItem value="Script">Script (serveur)</SelectItem>
                <SelectItem value="LocalScript">LocalScript (client)</SelectItem>
                <SelectItem value="ModuleScript">ModuleScript (module)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[13px] text-zinc-300">Niveau par défaut</Label>
            <Select
              value={preferences.defaultLevel}
              onValueChange={(v) => void savePreferences({ ...preferences, defaultLevel: v as ScriptLevel })}
            >
              <SelectTrigger className="mt-2 border-zinc-800 bg-zinc-950/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectItem value="debutant">Débutant</SelectItem>
                <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                <SelectItem value="avance">Avancé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[13px] text-zinc-300">Priorité par défaut</Label>
            <Select
              value={preferences.defaultFocus}
              onValueChange={(v) => void savePreferences({ ...preferences, defaultFocus: v as ScriptFocus })}
            >
              <SelectTrigger className="mt-2 border-zinc-800 bg-zinc-950/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectItem value="general">Général</SelectItem>
                <SelectItem value="securite">Sécurité</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="pedagogique">Pédagogique</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-[13px] text-zinc-300">Détail des explications</Label>
            <Select
              value={preferences.detailLevel}
              onValueChange={(v) => void savePreferences({ ...preferences, detailLevel: v as UserPreferences["detailLevel"] })}
            >
              <SelectTrigger className="mt-2 border-zinc-800 bg-zinc-950/70">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900">
                <SelectItem value="concis">Concis</SelectItem>
                <SelectItem value="detaille">Détaillé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/60 px-4 py-3 sm:col-span-2">
            <div>
              <p className="text-[13px] font-medium text-zinc-200">Réduire les animations</p>
              <p className="text-[12px] text-zinc-500">Utile pour l&apos;accessibilité et les machines modestes.</p>
            </div>
            <Switch
              checked={preferences.reduceMotion}
              onCheckedChange={(checked) => void savePreferences({ ...preferences, reduceMotion: checked })}
              aria-label="Réduire les animations"
            />
          </div>
        </div>
      </section>

      {/* Utilisation */}
      <section aria-labelledby="usage-heading" className="mt-5 rounded-xl border border-zinc-800 bg-zinc-925 p-5">
        <h2 id="usage-heading" className="text-[15px] font-semibold text-zinc-100">
          Utilisation de Luna AI
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Générations", value: stats?.generations },
            { label: "Bugs analysés", value: stats?.bugs },
            { label: "Conversations", value: stats?.gameplay },
            { label: "Total", value: stats?.total },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3 text-center">
              <p className="text-2xl font-bold tabular-nums text-zinc-50">{item.value ?? "—"}</p>
              <p className="mt-0.5 text-[11.5px] text-zinc-500">{item.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12px] text-zinc-500">
          Limite actuelle : 12 requêtes IA toutes les 5 minutes, par assistant.
        </p>
      </section>

      <Separator className="my-6" />

      {/* Session / danger zone */}
      <section aria-labelledby="account-heading" className="rounded-xl border border-zinc-800 bg-zinc-925 p-5">
        <h2 id="account-heading" className="text-[15px] font-semibold text-zinc-100">
          Compte et session
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={logout}
            className="gap-2 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300" aria-label="Supprimer le compte">
                <Trash2 className="h-4 w-4" />
                Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-zinc-800 bg-zinc-900">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-zinc-100">Supprimer définitivement ton compte ?</AlertDialogTitle>
                <AlertDialogDescription className="text-[13.5px] leading-relaxed text-zinc-400">
                  Toutes tes données seront effacées : profil, sessions, conversations et messages.
                  Cette action est irréversible. Si ton compte est réellement connecté à Roblox,
                  tu pourras en recréer un en te reconnectant, mais l&apos;historique sera perdu.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
                  Annuler
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault();
                    void deleteAccount();
                  }}
                  className="bg-red-600 text-white hover:bg-red-500"
                >
                  {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Supprimer mon compte
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>

      <div className="mt-6">
        <Button variant="ghost" size="sm" onClick={() => setView("dashboard")} className="text-[13px] text-zinc-400 hover:text-zinc-200">
          Retour à la vue d&apos;ensemble
        </Button>
      </div>
    </div>
  );
}
