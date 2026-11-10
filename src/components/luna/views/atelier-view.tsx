"use client";

/**
 * Atelier Luau — génération de scripts avec aperçu édité, copie,
 * téléchargement, régénération et explication pédagogique.
 */
import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Download, Hammer, Info, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LuauEditor } from "@/components/luna/luau-highlighter";
import { MarkdownContent } from "@/components/luna/markdown-content";
import { DemoBadge } from "@/components/luna/demo-badge";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import { generateSchema } from "@/lib/validation";
import type { GenerationResult, ScriptFocus, ScriptLevel, ScriptType } from "@/lib/types";

const EXAMPLES: Array<{ label: string; description: string; scriptType: ScriptType }> = [
  {
    label: "Récompense quotidienne serveur",
    description:
      "Un Script serveur qui donne une récompense quotidienne à chaque joueur, avec streak consécutif et sauvegarde DataStore.",
    scriptType: "Script",
  },
  {
    label: "Sprint client",
    description:
      "Un LocalScript qui fait sprinter le personnage quand on maintient la touche Maj, avec retour visuel de la barre d'endurance.",
    scriptType: "LocalScript",
  },
  {
    label: "Module d'inventaire",
    description:
      "Un ModuleScript d'inventaire réutilisable : ajout, retrait et lecture d'objets avec types Luau et validation des quantités.",
    scriptType: "ModuleScript",
  },
];

export function AtelierView() {
  const user = useLunaStore((s) => s.user);
  const [description, setDescription] = useState("");
  const [scriptType, setScriptType] = useState<ScriptType>("Script");
  const [level, setLevel] = useState<ScriptLevel>("intermediaire");
  const [focus, setFocus] = useState<ScriptFocus>("general");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Préférences utilisateur appliquées aux sélecteurs.
  useEffect(() => {
    if (user) {
      setScriptType(user.preferences.defaultScriptType);
      setLevel(user.preferences.defaultLevel);
      setFocus(user.preferences.defaultFocus);
    }
  }, [user]);

  const generate = useCallback(async () => {
    const parsed = generateSchema.safeParse({ description, scriptType, level, focus });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Données invalides.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as GenerationResult & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "La génération a échoué. Réessaie.");
        return;
      }
      setResult(data);
      toast.success("Script généré ! Vérifie-le avant de le coller dans Studio.");
    } catch {
      setError("Erreur réseau pendant la génération. Réessaie.");
    } finally {
      setLoading(false);
    }
  }, [description, scriptType, level, focus]);

  const copyCode = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Impossible de copier : ton navigateur a refusé l'accès au presse-papiers.");
    }
  };

  const download = () => {
    if (!result) return;
    const blob = new Blob([result.script], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scriptType.toLowerCase()}_luna_${Date.now()}.luau`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canSubmit = description.trim().length >= 10 && !loading;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/30 bg-violet-500/10">
          <Hammer className="h-5 w-5 text-violet-400" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">Atelier Luau</h1>
          <p className="text-[13px] text-zinc-400">Génération de scripts propres, commentés et optimisés.</p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Panneau gauche : configuration */}
        <section aria-label="Configuration de génération" className="space-y-5 rounded-xl border border-zinc-800 bg-zinc-925 p-5">
          <div>
            <Label htmlFor="description" className="text-[13px] text-zinc-300">
              Décris ton besoin
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex : un Script serveur qui ouvre une porte quand deux joueurs appuient sur deux boutons dans les 5 secondes…"
              className="mt-2 min-h-36 resize-y border-zinc-800 bg-zinc-950/70 text-[13.5px] placeholder:text-zinc-600 focus-visible:ring-violet-500/50"
              maxLength={4000}
              aria-describedby="description-hint"
            />
            <p id="description-hint" className="mt-1.5 text-right text-[11px] text-zinc-600">
              {description.length}/4000
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  type="button"
                  onClick={() => {
                    setDescription(example.description);
                    setScriptType(example.scriptType);
                  }}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[11px] text-zinc-400 transition-colors hover:border-violet-500/40 hover:text-violet-300"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="script-type" className="text-[13px] text-zinc-300">
                Type de script
              </Label>
              <Select value={scriptType} onValueChange={(v) => setScriptType(v as ScriptType)}>
                <SelectTrigger id="script-type" className="mt-2 border-zinc-800 bg-zinc-950/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900">
                  <SelectItem value="Script">Script (serveur)</SelectItem>
                  <SelectItem value="LocalScript">LocalScript (client)</SelectItem>
                  <SelectItem value="ModuleScript">ModuleScript (module partagé)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="level" className="text-[13px] text-zinc-300">
                Niveau
              </Label>
              <Select value={level} onValueChange={(v) => setLevel(v as ScriptLevel)}>
                <SelectTrigger id="level" className="mt-2 border-zinc-800 bg-zinc-950/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900">
                  <SelectItem value="debutant">Débutant — simple et très commenté</SelectItem>
                  <SelectItem value="intermediaire">Intermédiaire — structuré</SelectItem>
                  <SelectItem value="avance">Avancé — typé et optimisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="focus" className="text-[13px] text-zinc-300">
                Priorité
              </Label>
              <Select value={focus} onValueChange={(v) => setFocus(v as ScriptFocus)}>
                <SelectTrigger id="focus" className="mt-2 border-zinc-800 bg-zinc-950/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-zinc-800 bg-zinc-900">
                  <SelectItem value="general">Général</SelectItem>
                  <SelectItem value="securite">Sécurité (anti-exploit)</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="pedagogique">Pédagogique (apprendre)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generate}
            disabled={!canSubmit}
            className="w-full bg-violet-600 font-medium text-white hover:bg-violet-500"
            aria-label="Générer le script"
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Génération en cours…" : "Générer le script"}
          </Button>

          {error ? (
            <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-300">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle className="text-sm">Échec</AlertTitle>
              <AlertDescription className="text-[13px]">{error}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        {/* Panneau droit : résultat */}
        <section aria-label="Script généré" className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-925">
          {!result && !loading ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Hammer className="h-5 w-5 text-zinc-600" aria-hidden="true" />
              </span>
              <p className="text-[15px] font-medium text-zinc-300">Ton script apparaîtra ici</p>
              <p className="max-w-sm text-[13px] leading-relaxed text-zinc-500">
                Décris ton besoin, choisis le type et le niveau, puis lance la génération.
                Luna choisira une architecture adaptée et expliquera où placer le script dans Studio.
              </p>
            </div>
          ) : loading ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-8">
              <Loader2 className="h-7 w-7 animate-spin text-violet-400" aria-hidden="true" />
              <p className="text-[14px] text-zinc-300">Luna rédige ton script…</p>
              <p className="text-[12.5px] text-zinc-500">Analyse de la demande, choix d&apos;architecture, génération.</p>
            </div>
          ) : result ? (
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 font-mono text-[11px] text-zinc-300">
                  {scriptType}.luau
                </span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                  Prêt à coller
                </span>
                {result.demo ? <DemoBadge /> : null}
                <div className="ml-auto flex items-center gap-1.5">
                  <Button variant="outline" size="sm" onClick={copyCode} className="h-8 gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800" aria-label="Copier le code">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copié" : "Copier"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={download} className="h-8 gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800" aria-label="Télécharger le script">
                    <Download className="h-3.5 w-3.5" />
                    Télécharger
                  </Button>
                  <Button variant="outline" size="sm" onClick={generate} disabled={loading} className="h-8 gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800" aria-label="Régénérer le script">
                    <RefreshCw className="h-3.5 w-3.5" />
                    Régénérer
                  </Button>
                </div>
              </div>

              <LuauEditor code={result.script} maxHeightClass="max-h-[460px]" />

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-sky-300">
                    <Info className="h-3.5 w-3.5" aria-hidden="true" />
                    Emplacement dans Studio
                  </p>
                  <p className="mt-1.5 font-mono text-[12.5px] leading-relaxed text-zinc-300">{result.emplacement}</p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3.5">
                  <p className="text-[12px] font-semibold text-violet-300">Remarques</p>
                  {result.remarques.length > 0 ? (
                    <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[12.5px] leading-relaxed text-zinc-400">
                      {result.remarques.map((note, i) => (
                        <li key={i}>{note}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1.5 text-[12.5px] text-zinc-500">Aucune remarque particulière.</p>
                  )}
                </div>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500">Comment ça fonctionne</p>
                <MarkdownContent content={result.explication} className="mt-2" />
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
