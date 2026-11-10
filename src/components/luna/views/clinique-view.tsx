"use client";

/**
 * Clinique du Code — diagnostic et correction à partir de l'Output
 * de Roblox Studio. États gérés : attente, analyse, résultat, erreur.
 */
import { useCallback, useState } from "react";
import { Check, Copy, Loader2, SearchCode, Stethoscope, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LuauEditor } from "@/components/luna/luau-highlighter";
import { MarkdownContent } from "@/components/luna/markdown-content";
import { DemoBadge } from "@/components/luna/demo-badge";
import { ModelIndicator } from "@/components/luna/model-indicator";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import { debugSchema } from "@/lib/validation";
import type { DiagnosisResult } from "@/lib/types";

type Status = "idle" | "loading" | "result" | "error";

export function CliniqueView() {
  const setView = useLunaStore((s) => s.setView);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [context, setContext] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const analyze = useCallback(async () => {
    const parsed = debugSchema.safeParse({ code, errorMessage, context });
    if (!parsed.success) {
      setStatus("error");
      setError(parsed.error.issues[0]?.message ?? "Données invalides.");
      return;
    }

    setStatus("loading");
    setError(null);
    try {
      const response = await fetch("/api/ai/debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as DiagnosisResult & { error?: string };
      if (!response.ok) {
        setStatus("error");
        setError(data.error ?? "L'analyse a échoué. Réessaie.");
        return;
      }
      setResult(data);
      setStatus("result");
    } catch {
      setStatus("error");
      setError("Erreur réseau pendant l'analyse. Réessaie.");
    }
  }, [code, errorMessage, context]);

  const copyFixed = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.codeCorrige);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Impossible de copier le code corrigé.");
    }
  };

  const canSubmit = code.trim().length > 0 && errorMessage.trim().length >= 3 && status !== "loading";

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10">
          <Stethoscope className="h-5 w-5 text-sky-400" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">Clinique du Code</h1>
          <p className="text-[13px] text-zinc-400">Colle ton code et l&apos;erreur de l&apos;Output : Luna pose le diagnostic.</p>
        </div>
        <ModelIndicator />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[420px_1fr]">
        {/* Formulaire */}
        <section aria-label="Symptômes du bug" className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-925 p-5">
          <div>
            <Label htmlFor="code" className="text-[13px] text-zinc-300">
              Code source à analyser
            </Label>
            <Textarea
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="-- Colle ici ton script Luau…"
              className="mt-2 min-h-48 resize-y border-zinc-800 bg-zinc-950/70 font-mono text-[12.5px] leading-relaxed placeholder:text-zinc-600 focus-visible:ring-sky-500/50"
              maxLength={20000}
            />
            <p className="mt-1 text-right text-[11px] text-zinc-600">{code.length}/20000</p>
          </div>

          <div>
            <Label htmlFor="error-message" className="text-[13px] text-zinc-300">
              Message d&apos;erreur (Output de Roblox Studio)
            </Label>
            <Textarea
              id="error-message"
              value={errorMessage}
              onChange={(e) => setErrorMessage(e.target.value)}
              placeholder="Ex : ServerScriptService.Door:12: attempt to index nil with 'Parent'"
              className="mt-2 min-h-20 resize-y border-red-500/25 bg-red-500/5 font-mono text-[12.5px] text-red-200 placeholder:text-red-300/40 focus-visible:ring-sky-500/50"
              maxLength={3000}
            />
          </div>

          <div>
            <Label htmlFor="context" className="text-[13px] text-zinc-300">
              Contexte <span className="font-normal text-zinc-500">(facultatif)</span>
            </Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Ex : le script est dans ServerScriptService, l'erreur apparaît quand un joueur meurt…"
              className="mt-2 min-h-20 resize-y border-zinc-800 bg-zinc-950/70 text-[13px] placeholder:text-zinc-600 focus-visible:ring-sky-500/50"
              maxLength={3000}
            />
          </div>

          <Button
            onClick={analyze}
            disabled={!canSubmit}
            className="w-full bg-sky-600 font-medium text-white hover:bg-sky-500"
            aria-label="Analyser et réparer"
          >
            {status === "loading" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SearchCode className="mr-2 h-4 w-4" />}
            {status === "loading" ? "Analyse en cours…" : "Analyser et réparer"}
          </Button>

          {status === "error" && error ? (
            <Alert variant="destructive" className="border-red-500/40 bg-red-500/10 text-red-300">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle className="text-sm">Erreur de traitement</AlertTitle>
              <AlertDescription className="text-[13px]">{error}</AlertDescription>
            </Alert>
          ) : null}
        </section>

        {/* Résultat */}
        <section aria-label="Diagnostic" className="min-w-0 rounded-xl border border-zinc-800 bg-zinc-925">
          {status === "idle" ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900">
                <Stethoscope className="h-5 w-5 text-zinc-600" aria-hidden="true" />
              </span>
              <p className="text-[15px] font-medium text-zinc-300">En attente d&apos;un patient</p>
              <p className="max-w-sm text-[13px] leading-relaxed text-zinc-500">
                Copie le message d&apos;erreur depuis la fenêtre Output de Roblox Studio,
                ajoute ton script, puis lance l&apos;analyse. Luna ne modifiera que le nécessaire.
              </p>
            </div>
          ) : status === "loading" ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center gap-3 p-8">
              <Loader2 className="h-7 w-7 animate-spin text-sky-400" aria-hidden="true" />
              <p className="text-[14px] text-zinc-300">Luna examine ton code…</p>
              <p className="text-[12.5px] text-zinc-500">Lecture de l&apos;erreur, identification de la cause racine, correction minimale.</p>
            </div>
          ) : status === "result" && result ? (
            <div className="space-y-4 p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                  Diagnostic disponible
                </span>
                {result.demo ? <DemoBadge /> : null}
                <span className="ml-auto" />
                <Button variant="outline" size="sm" onClick={copyFixed} className="h-8 gap-1.5 border-zinc-700 text-zinc-300 hover:bg-zinc-800" aria-label="Copier le code corrigé">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copié" : "Copier le code corrigé"}
                </Button>
              </div>

              <div className="rounded-lg border border-sky-500/25 bg-sky-500/8 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-sky-300">1 · Diagnostic</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-200">{result.diagnostic}</p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">2 · Cause probable</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-zinc-300">{result.causeProbable}</p>
              </div>

              <div>
                <p className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-zinc-400">3 · Code corrigé</p>
                <LuauEditor code={result.codeCorrige} maxHeightClass="max-h-[380px]" />
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">4 · Explication</p>
                <MarkdownContent content={result.explication || "Aucune explication fournie."} className="mt-2" />
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-violet-300">5 · Emplacement recommandé</p>
                <p className="mt-1.5 font-mono text-[12.5px] text-zinc-300">{result.emplacement}</p>
              </div>

              <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 p-4">
                <p className="text-[12px] font-semibold uppercase tracking-wider text-emerald-300">6 · Pour éviter que ça revienne</p>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[13px] leading-relaxed text-zinc-300">
                  {result.conseils.length > 0 ? (
                    result.conseils.map((tip, i) => <li key={i}>{tip}</li>)
                  ) : (
                    <li>Reteste progressivement après chaque modification.</li>
                  )}
                </ul>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center p-8">
              <p className="text-[13.5px] text-zinc-500">Corrige le formulaire puis relance l&apos;analyse.</p>
            </div>
          )}
        </section>
      </div>

      <p className="mt-6 text-[12.5px] text-zinc-500">
        Besoin d&apos;un nouveau script plutôt qu&apos;une réparation ?{" "}
        <button type="button" onClick={() => setView("atelier")} className="font-medium text-violet-400 hover:text-violet-300">
          Ouvre l&apos;Atelier Luau
        </button>
        .
      </p>
    </div>
  );
}
