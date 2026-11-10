"use client";

/**
 * Sélecteur de modèles OpenRouter — liste complète récupérée en direct
 * depuis /api/openrouter/models (cache mémoire 15 min côté serveur,
 * cache local côté client), recherche instantanée, modèles gratuits
 * mis en avant en tête de liste.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Cpu, ExternalLink, KeyRound, Loader2, RefreshCw, Search, TriangleAlert } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { OpenRouterModelView } from "@/lib/types";

interface ModelsPayload {
  models: OpenRouterModelView[];
  total: number;
  freeCount: number;
}

// Cache local (module) aligné sur le cache serveur de 15 minutes.
let cache: { payload: ModelsPayload; at: number } | null = null;
const CACHE_MS = 15 * 60 * 1000;

export interface ModelPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Modèle actuellement sélectionné (ou null = fournisseur intégré). */
  currentModel: string | null;
  /** false → l'utilisateur n'a pas encore de clé : on l'oriente vers Paramètres. */
  hasKey: boolean;
  /** Sélection d'un modèle. Renvoie true si la sélection a été enregistrée. */
  onPick: (modelId: string) => Promise<boolean>;
  onGoToSettings?: () => void;
}

function formatContext(length: number | null): string {
  if (!length) return "";
  if (length >= 1_000_000) return `${Math.round(length / 100_000) / 10}M tokens`;
  if (length >= 1000) return `${Math.round(length / 1000)}K tokens`;
  return `${length} tokens`;
}

export function ModelPickerDialog({
  open,
  onOpenChange,
  currentModel,
  hasKey,
  onPick,
  onGoToSettings,
}: ModelPickerDialogProps) {
  const [data, setData] = useState<ModelsPayload | null>(cache?.payload ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickingId, setPickingId] = useState<string | null>(null);
  const mounted = useRef(false);

  const load = useCallback(async (force = false) => {
    if (!force && cache && Date.now() - cache.at < CACHE_MS) {
      setData(cache.payload);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/openrouter/models");
      const payload = (await response.json()) as ModelsPayload & { error?: string };
      if (!response.ok) {
        setError(payload.error ?? "Impossible de charger la liste des modèles.");
        return;
      }
      cache = { payload, at: Date.now() };
      setData(payload);
    } catch {
      setError("Erreur réseau pendant le chargement des modèles.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !mounted.current) {
      mounted.current = true;
      void load();
    }
    if (!open) mounted.current = false;
  }, [open, load]);

  const handlePick = async (modelId: string) => {
    if (pickingId) return;
    setPickingId(modelId);
    const ok = await onPick(modelId);
    setPickingId(null);
    if (ok) onOpenChange(false);
  };

  const freeModels = data?.models.filter((m) => m.free) ?? [];
  const paidModels = data?.models.filter((m) => !m.free) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl border-zinc-800 bg-zinc-900 p-0">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="flex items-center gap-2 text-zinc-100">
            <Cpu className="h-4 w-4 text-violet-400" aria-hidden="true" />
            Choisir le modèle IA
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-zinc-400">
            Tous les modèles OpenRouter sont disponibles. Les modèles&nbsp;
            <span className="font-medium text-emerald-400">gratuits</span> sont listés en premier.
          </DialogDescription>
        </DialogHeader>

        {!hasKey ? (
          <div className="mx-5 mb-4 rounded-lg border border-violet-500/30 bg-violet-500/10 p-4">
            <p className="flex items-center gap-2 text-[13px] font-medium text-violet-200">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Aucune clé OpenRouter configurée
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-400">
              Pour débloquer l&apos;accès à tous les modèles (y compris les gratuits), ajoute ta
              propre clé OpenRouter — gratuite — dans les Paramètres. La liste reste consultable,
              mais Luna utilisera son modèle intégré tant qu&apos;aucune clé n&apos;est enregistrée.
            </p>
            {onGoToSettings ? (
              <Button
                size="sm"
                onClick={() => {
                  onOpenChange(false);
                  onGoToSettings();
                }}
                className="mt-3 gap-1.5 bg-violet-600 text-white hover:bg-violet-500"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Ouvrir les Paramètres
              </Button>
            ) : null}
          </div>
        ) : null}

        <div className="px-5">
          <Command className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950/70">
            <div className="flex items-center border-b border-zinc-800">
              <Search className="ml-3 h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
              <CommandInput
                placeholder="Rechercher un modèle (ex : llama, deepseek, gemini…)"
                className="h-10 border-0 bg-transparent focus:ring-0"
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void load(true)}
                disabled={loading}
                className="mr-1 h-8 w-8 shrink-0 text-zinc-500 hover:text-zinc-200"
                aria-label="Rafraîchir la liste des modèles"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
              </Button>
            </div>
            <CommandList className="max-h-[46vh]">
              {error ? (
                <div className="flex items-start gap-2 p-4 text-[13px] text-red-300">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </div>
              ) : loading && !data ? (
                <div className="flex items-center justify-center gap-2 p-8 text-[13px] text-zinc-400">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Chargement des modèles…
                </div>
              ) : (
                <>
                  <CommandEmpty>Aucun modèle ne correspond à cette recherche.</CommandEmpty>
                  {freeModels.length > 0 ? (
                    <CommandGroup heading={`Gratuits (${freeModels.length})`}>
                      {freeModels.map((model) => (
                        <ModelRow
                          key={model.id}
                          model={model}
                          current={model.id === currentModel}
                          busy={pickingId === model.id}
                          disabled={Boolean(pickingId)}
                          onPick={() => void handlePick(model.id)}
                        />
                      ))}
                    </CommandGroup>
                  ) : null}
                  {paidModels.length > 0 ? (
                    <>
                      {freeModels.length > 0 ? <CommandSeparator className="bg-zinc-800" /> : null}
                      <CommandGroup heading={`Payants (${paidModels.length})`}>
                        {paidModels.map((model) => (
                          <ModelRow
                            key={model.id}
                            model={model}
                            current={model.id === currentModel}
                            busy={pickingId === model.id}
                            disabled={Boolean(pickingId)}
                            onPick={() => void handlePick(model.id)}
                          />
                        ))}
                      </CommandGroup>
                    </>
                  ) : null}
                </>
              )}
            </CommandList>
          </Command>
        </div>

        <DialogFooter className="items-center justify-between gap-2 border-t border-zinc-800 px-5 py-3 sm:justify-between">
          <p className="text-[11.5px] text-zinc-500">
            {data
              ? `${data.total} modèles · ${data.freeCount} gratuits — liste OpenRouter en direct`
              : "Liste récupérée en direct depuis OpenRouter."}
          </p>
          <a
            href="https://openrouter.ai/models"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11.5px] text-zinc-400 transition-colors hover:text-violet-300"
          >
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            openrouter.ai
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ModelRow({
  model,
  current,
  busy,
  disabled,
  onPick,
}: {
  model: OpenRouterModelView;
  current: boolean;
  busy: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  return (
    <CommandItem
      value={`${model.name} ${model.id}`}
      onSelect={onPick}
      disabled={disabled}
      className="group gap-3 px-3 py-2.5 aria-selected:bg-violet-500/10"
    >
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-zinc-200">{model.name}</span>
          {model.free ? (
            <Badge className="shrink-0 border-emerald-500/30 bg-emerald-500/10 text-[10px] font-semibold text-emerald-400">
              Gratuit
            </Badge>
          ) : (
            <Badge className="shrink-0 border-zinc-700 bg-zinc-800 text-[10px] font-semibold text-zinc-400">
              Payant
            </Badge>
          )}
        </span>
        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-zinc-500">
          <span className="truncate font-mono">{model.id}</span>
          {model.contextLength ? (
            <span className="shrink-0 text-zinc-600">· {formatContext(model.contextLength)}</span>
          ) : null}
        </span>
      </span>
      {busy ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-violet-400" aria-hidden="true" />
      ) : current ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
      ) : null}
    </CommandItem>
  );
}
