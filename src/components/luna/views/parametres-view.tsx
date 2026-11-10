"use client";

/**
 * Paramètres — profil Roblox associé, informations du compte,
 * préférences d'interface, utilisation, déconnexion et suppression du compte.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, Cpu, Eye, EyeOff, ExternalLink, KeyRound, Loader2, LogOut, Settings, ShieldCheck, Trash2, TriangleAlert, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ModelPickerDialog } from "@/components/luna/model-picker-dialog";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import { preferencesSchema } from "@/lib/validation";
import type { ScriptFocus, ScriptLevel, ScriptType, UserOpenRouterStatus, UserPreferences, UserStats } from "@/lib/types";

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

  /* --- Clé OpenRouter personnelle (BYOK) --- */
  const [keyInput, setKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyInfo, setKeyInfo] = useState<{
    isFreeTier: boolean;
    usage: number | null;
    limit: number | null;
  } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [removingKey, setRemovingKey] = useState(false);

  const orStatus = user?.openrouter;

  const saveKey = async () => {
    if (!user) return;
    const apiKey = keyInput.trim();
    if (!apiKey) return;
    setSavingKey(true);
    setKeyError(null);
    try {
      const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        status?: UserOpenRouterStatus;
        keyInfo?: { isFreeTier: boolean; usage: number | null; limit: number | null };
        error?: string;
      };
      if (!response.ok || !data.status) {
        setKeyError(data.error ?? "La clé n'a pas pu être vérifiée par OpenRouter.");
        return;
      }
      setUser({ ...user, openrouter: data.status });
      if (data.keyInfo) setKeyInfo(data.keyInfo);
      setKeyInput("");
      setShowKey(false);
      toast.success(
        data.status.defaultModel
          ? `Clé enregistrée ! Modèle par défaut : ${data.status.defaultModel}`
          : "Clé OpenRouter enregistrée et vérifiée !"
      );
    } catch {
      setKeyError("Erreur réseau pendant la vérification de la clé.");
    } finally {
      setSavingKey(false);
    }
  };

  const removeKey = async () => {
    if (!user) return;
    setRemovingKey(true);
    try {
      const response = await fetch("/api/openrouter", { method: "DELETE" });
      const data = (await response.json()) as { ok?: boolean; status?: UserOpenRouterStatus; error?: string };
      if (!response.ok || !data.status) {
        toast.error(data.error ?? "Le retrait de la clé a échoué.");
        return;
      }
      setUser({ ...user, openrouter: data.status });
      setKeyInfo(null);
      toast.success("Clé retirée. Luna réutilise son modèle intégré.");
    } catch {
      toast.error("Erreur réseau pendant le retrait de la clé.");
    } finally {
      setRemovingKey(false);
    }
  };

  const pickModel = async (modelId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const response = await fetch("/api/openrouter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId }),
      });
      const data = (await response.json()) as { ok?: boolean; status?: UserOpenRouterStatus; error?: string };
      if (!response.ok || !data.status) {
        toast.error(data.error ?? "La sélection du modèle a échoué.");
        return false;
      }
      setUser({ ...user, openrouter: data.status });
      toast.success(`Modèle sélectionné : ${modelId}`);
      return true;
    } catch {
      toast.error("Erreur réseau pendant la sélection du modèle.");
      return false;
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

      {/* Intelligence artificielle — clé OpenRouter personnelle (BYOK) */}
      <section aria-labelledby="ai-heading" className="mt-5 rounded-xl border border-zinc-800 bg-zinc-925 p-5">
        <h2 id="ai-heading" className="flex items-center gap-2 text-[15px] font-semibold text-zinc-100">
          <KeyRound className="h-4 w-4 text-violet-400" aria-hidden="true" />
          Modèle IA — ta clé OpenRouter
        </h2>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-400">
          Ajoute ta propre clé OpenRouter (gratuite) pour débloquer{" "}
          <span className="font-medium text-zinc-200">tous les modèles IA</span> et choisir celui
          qu&apos;utilisent les trois assistants. Les modèles estampillés « Gratuit » ne consomment
          rien sur ton compte.
        </p>
        <a
          href="https://openrouter.ai/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-violet-400 transition-colors hover:text-violet-300"
        >
          <ExternalLink className="h-3 w-3" aria-hidden="true" />
          Créer une clé gratuite sur openrouter.ai
        </a>

        {orStatus?.configured ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3.5">
              <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-zinc-100">
                  Clé connectée · <span className="font-mono text-[12.5px] text-zinc-400">{orStatus.keyHint}</span>
                </p>
                <p className="mt-0.5 text-[11.5px] text-zinc-500">
                  {keyInfo ? (
                    <>
                      {keyInfo.isFreeTier ? "Offre gratuite · " : ""}
                      {keyInfo.usage != null
                        ? `${keyInfo.usage >= 1 ? keyInfo.usage.toFixed(2) : keyInfo.usage.toFixed(4)} $ utilisés`
                        : ""}
                      {keyInfo.limit != null
                        ? ` sur ${keyInfo.limit === 0 ? "illimité" : `${keyInfo.limit} $`}`
                        : ""}
                      {" · "}
                    </>
                  ) : null}
                  {orStatus.verifiedAt
                    ? `vérifiée le ${new Date(orStatus.verifiedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : null}
                </p>
              </div>
              <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-400">Actif</Badge>
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10">
                <Cpu className="h-4 w-4 text-violet-400" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500">Modèle actif des 3 assistants</p>
                <p className="truncate font-mono text-[12.5px] text-zinc-100">
                  {orStatus.defaultModel ?? "Automatique (premier modèle gratuit disponible)"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPickerOpen(true)}
                className="shrink-0 gap-1.5 border-zinc-700 text-zinc-200 hover:bg-zinc-800"
              >
                Changer de modèle
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    aria-label="Retirer la clé OpenRouter"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Retirer la clé
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-zinc-800 bg-zinc-900">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-zinc-100">Retirer ta clé OpenRouter ?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[13.5px] leading-relaxed text-zinc-400">
                      La clé chiffrée est immédiatement supprimée de ton compte et Luna retrouve
                      son modèle intégré. Tu pourras en ajouter une nouvelle à tout moment.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
                      Annuler
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        void removeKey();
                      }}
                      className="bg-red-600 text-white hover:bg-red-500"
                    >
                      {removingKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Retirer la clé
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        ) : (
          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              void saveKey();
            }}
          >
            <Label htmlFor="openrouter-key" className="text-[13px] text-zinc-300">
              Clé API OpenRouter
            </Label>
            <div className="mt-2 flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="openrouter-key"
                  type={showKey ? "text" : "password"}
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="sk-or-v1-…"
                  autoComplete="off"
                  spellCheck={false}
                  className="border-zinc-800 bg-zinc-950/70 pr-10 font-mono text-[12.5px] placeholder:text-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Masquer la clé" : "Afficher la clé"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-500 transition-colors hover:text-zinc-300"
                >
                  {showKey ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
              <Button
                type="submit"
                disabled={savingKey || keyInput.trim().length < 30}
                className="shrink-0 gap-1.5 bg-violet-600 text-white hover:bg-violet-500"
              >
                {savingKey ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                {savingKey ? "Vérification…" : "Enregistrer"}
              </Button>
            </div>
            {keyError ? (
              <Alert variant="destructive" className="mt-3 border-red-500/40 bg-red-500/10 text-red-300">
                <TriangleAlert className="h-4 w-4" />
                <AlertDescription className="text-[12.5px]">{keyError}</AlertDescription>
              </Alert>
            ) : null}
            <p className="mt-2.5 text-[11.5px] leading-relaxed text-zinc-500">
              La clé est vérifiée en direct auprès d&apos;OpenRouter, puis chiffrée (AES-256-GCM) et
              stockée uniquement sur ton compte : jamais affichée en clair, jamais partagée, jamais
              utilisée pour d&apos;autres requêtes que les tiennes.
            </p>
          </form>
        )}

        <ModelPickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          currentModel={orStatus?.configured ? orStatus.defaultModel : null}
          hasKey={Boolean(orStatus?.configured)}
          onPick={pickModel}
        />
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
