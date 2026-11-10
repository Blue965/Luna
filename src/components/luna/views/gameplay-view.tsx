"use client";

/**
 * Économie & Gameplay — assistant conversationnel spécialisé.
 * Conversation persistante côté serveur, indicateur de génération,
 * réponses markdown avec blocs de code copiables.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Gamepad2, Loader2, SendHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/luna/user-avatar";
import { LunaMark } from "@/components/luna/logo";
import { MarkdownContent } from "@/components/luna/markdown-content";
import { DemoBadge } from "@/components/luna/demo-badge";
import { ModelIndicator } from "@/components/luna/model-indicator";
import { useLunaStore } from "@/hooks/use-luna-store";
import { toast } from "sonner";
import { gameplaySchema } from "@/lib/validation";
import type { GameplayReply } from "@/lib/types";

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  demo?: boolean;
}

const SUGGESTIONS = [
  "Conçois une courbe d'XP pour 50 niveaux avec un prestige au niveau 50",
  "Comment équilibrer l'économie d'un Tycoon de taverne ?",
  "Quelle progression de récompenses quotidiennes pour retenir les joueurs ?",
  "Comment éviter l'inflation de monnaie dans un jeu de farming ?",
];

export function GameplayView() {
  const user = useLunaStore((s) => s.user);
  const conversationIdRef = useRef<string | null>(useLunaStore.getState().gameplayConversationId);
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [entries, scrollToEnd]);

  const send = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || sending) return;

      const parsed = gameplaySchema.safeParse({ message, conversationId: conversationIdRef.current ?? undefined });
      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message ?? "Message invalide.");
        return;
      }

      const userId = `u-${Date.now()}`;
      setEntries((prev) => [...prev, { id: userId, role: "user", content: message }]);
      setInput("");
      setSending(true);
      scrollToEnd();

      try {
        const response = await fetch("/api/ai/gameplay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.data),
        });
        const data = (await response.json()) as GameplayReply & { error?: string };
        if (!response.ok) {
          toast.error(data.error ?? "L'assistant n'a pas répondu. Réessaie.");
          setEntries((prev) => prev.filter((e) => e.id !== userId));
          setInput(message);
          return;
        }
        conversationIdRef.current = data.conversationId;
        useLunaStore.getState().setGameplayConversationId(data.conversationId);
        setEntries((prev) => [
          ...prev,
          { id: `a-${Date.now()}`, role: "assistant", content: data.reply, demo: data.demo },
        ]);
      } catch {
        toast.error("Erreur réseau. Réessaie.");
        setEntries((prev) => prev.filter((e) => e.id !== userId));
        setInput(message);
      } finally {
        setSending(false);
        scrollToEnd();
      }
    },
    [sending, scrollToEnd]
  );

  const resetConversation = () => {
    conversationIdRef.current = null;
    useLunaStore.getState().setGameplayConversationId(null);
    setEntries([]);
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-0px)] max-w-4xl flex-col px-5 py-8 sm:px-8 lg:h-dvh">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10">
          <Gamepad2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">Économie &amp; Gameplay</h1>
          <p className="text-[13px] text-zinc-400">Conception, mathématiques et équilibrage — conversation continue.</p>
        </div>
        <ModelIndicator />
        <Button
          variant="outline"
          size="sm"
          onClick={resetConversation}
          disabled={sending}
          className="gap-1.5 border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          aria-label="Nouvelle conversation"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Nouvelle
        </Button>
      </div>

      {/* Fil de conversation */}
      <div ref={scrollRef} className="mt-6 flex-1 space-y-5 overflow-y-auto scrollbar-thin pb-4 pr-1">
        {entries.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Gamepad2 className="h-6 w-6 text-zinc-600" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[15px] font-medium text-zinc-300">Concevons ton système de jeu</p>
              <p className="mx-auto mt-1 max-w-md text-[13px] leading-relaxed text-zinc-500">
                XP et niveaux, économies de Tycoon, récompenses quotidiennes, prestige,
                boucles de gameplay : Luna propose des formules chiffrées et des exemples Luau.
              </p>
            </div>
            <div className="flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-[12px] text-zinc-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-300"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          entries.map((entry) =>
            entry.role === "user" ? (
              <div key={entry.id} className="flex justify-end gap-3">
                <div className="max-w-[85%] rounded-xl rounded-br-sm border border-violet-500/25 bg-violet-600/15 px-4 py-2.5 text-[13.5px] leading-relaxed text-zinc-100 sm:max-w-[70%]">
                  {entry.content}
                </div>
                <UserAvatar username={user?.username ?? "?"} avatarUrl={user?.avatarUrl} size={30} />
              </div>
            ) : (
              <div key={entry.id} className="flex gap-3">
                <span className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
                  <LunaMark className="h-4 w-4" />
                </span>
                <div className="min-w-0 max-w-full rounded-xl rounded-tl-sm border border-zinc-800 bg-zinc-925 px-4 py-3 sm:max-w-[85%]">
                  {entry.demo ? <DemoBadge className="mb-2" /> : null}
                  <MarkdownContent content={entry.content} />
                </div>
              </div>
            )
          )
        )}

        {sending ? (
          <div className="flex gap-3" aria-live="polite" aria-label="Luna rédige une réponse">
            <span className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
              <LunaMark className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2 rounded-xl rounded-tl-sm border border-zinc-800 bg-zinc-925 px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-violet-400" aria-hidden="true" />
              <span className="text-[13px] text-zinc-400">Luna calcule les équilibres…</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* Zone de saisie */}
      <div className="mt-4 shrink-0 rounded-xl border border-zinc-800 bg-zinc-925 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            placeholder="Ex : quel multiplicateur de prix pour un système de prestige ?"
            className="min-h-11 flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[13.5px] placeholder:text-zinc-600 focus-visible:ring-0"
            maxLength={4000}
            aria-label="Message pour Luna"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || sending}
            className="mb-1 h-10 w-10 shrink-0 bg-violet-600 text-white hover:bg-violet-500"
            aria-label="Envoyer le message"
          >
            <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </form>
        <p className="px-2 pb-1 pt-1 text-[11px] text-zinc-600">
          Entrée pour envoyer · Maj+Entrée pour un retour à la ligne
        </p>
      </div>
    </div>
  );
}
