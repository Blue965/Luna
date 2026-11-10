"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { LuauEditor, LuauCode } from "@/components/luna/luau-highlighter";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  /** Luau actif → éditeur coloré avec numéros de lignes. */
  luau?: boolean;
  /** Nom de fichier affiché dans la barre du bloc. */
  label?: string;
  className?: string;
  maxHeightClass?: string;
}

/** Bloc de code copiable utilisé dans les réponses IA. */
export function CodeBlock({ code, luau = false, label, className, maxHeightClass }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className={cn("group relative overflow-hidden rounded-md border border-zinc-800/70 bg-zinc-950/70", className)}>
      <div className="flex items-center justify-between border-b border-zinc-800/60 bg-zinc-900/60 px-3 py-1.5">
        <span className="font-mono text-[11px] text-zinc-500">{label ?? "luau"}</span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-2 focus-visible:outline-violet-500"
          aria-label="Copier le code"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>
      <div className="p-3">
        {luau ? (
          <LuauEditor code={code} maxHeightClass={maxHeightClass ?? "max-h-[360px]"} className="border-0 bg-transparent" />
        ) : (
          <LuauCode code={code} />
        )}
      </div>
    </div>
  );
}
