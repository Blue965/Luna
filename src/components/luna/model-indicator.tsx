"use client";

/**
 * Indicateur compact du modèle IA actif, affiché dans l'en-tête des trois
 * assistants. Clic → sélecteur de modèles OpenRouter. La sélection est
 * enregistrée sur le compte (PATCH /api/openrouter) et utilisée par les
 * trois assistants.
 */
import { useState } from "react";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ModelPickerDialog } from "@/components/luna/model-picker-dialog";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import type { UserOpenRouterStatus } from "@/lib/types";

/** Dernier segment d'un identifiant de modèle, plus lisible dans un badge. */
function shortModelName(modelId: string | null): string {
  if (!modelId) return "Modèle intégré";
  const tail = modelId.split("/").pop() ?? modelId;
  return tail.length > 30 ? `${tail.slice(0, 30)}…` : tail;
}

export function ModelIndicator() {
  const user = useLunaStore((s) => s.user);
  const setUser = useLunaStore((s) => s.setUser);
  const setView = useLunaStore((s) => s.setView);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const status = user.openrouter;
  const hasKey = status.configured;

  const pickModel = async (modelId: string): Promise<boolean> => {
    setSaving(true);
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
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              disabled={saving}
              className="ml-auto h-8 max-w-[240px] gap-1.5 border-zinc-700 bg-zinc-900/60 px-2.5 font-mono text-[11px] text-zinc-300 hover:border-violet-500/40 hover:bg-zinc-800 hover:text-violet-200"
              aria-label="Choisir le modèle IA"
            >
              <Cpu className="h-3.5 w-3.5 shrink-0 text-violet-400" aria-hidden="true" />
              <span className="truncate">{shortModelName(hasKey ? status.defaultModel : null)}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[280px]">
            {hasKey
              ? `Modèle IA actif : ${status.defaultModel ?? "automatique"} — cliquer pour changer`
              : "Modèle IA intégré du serveur — ajoute ta clé OpenRouter pour débloquer tous les modèles"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ModelPickerDialog
        open={open}
        onOpenChange={setOpen}
        currentModel={hasKey ? status.defaultModel : null}
        hasKey={hasKey}
        onPick={pickModel}
        onGoToSettings={() => setView("parametres")}
      />
    </>
  );
}
