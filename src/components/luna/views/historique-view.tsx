"use client";

/**
 * Historique — liste des conversations de l'utilisateur avec filtre par
 * assistant, consultation du détail et suppression. Isolation par compte
 * garantie côté serveur.
 */
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, History, Loader2, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/luna/user-avatar";
import { LunaMark } from "@/components/luna/logo";
import { LuauEditor } from "@/components/luna/luau-highlighter";
import { MarkdownContent } from "@/components/luna/markdown-content";
import { useLunaStore } from "@/hooks/use-luna-store";
import type { AssistantType, ConversationDetail, ConversationSummary } from "@/lib/types";

const FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "Tous les assistants" },
  { value: "atelier", label: "Atelier Luau" },
  { value: "clinique", label: "Clinique du Code" },
  { value: "gameplay", label: "Économie & Gameplay" },
];

const ASSISTANT_LABEL: Record<AssistantType, string> = {
  atelier: "Atelier Luau",
  clinique: "Clinique du Code",
  gameplay: "Économie & Gameplay",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoriqueView() {
  const user = useLunaStore((s) => s.user);
  const [filter, setFilter] = useState("all");
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleting, setDeleting] = useState<ConversationSummary | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    setConversations(null);
    try {
      const query = filter === "all" ? "" : `?assistant=${filter}`;
      const response = await fetch(`/api/history${query}`);
      if (response.ok) setConversations((await response.json()) as ConversationSummary[]);
      else setConversations([]);
    } catch {
      setConversations([]);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/history/${id}`);
      if (response.ok) setDetail((await response.json()) as ConversationDetail);
    } finally {
      setDetailLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/history/${deleting.id}`, { method: "DELETE" });
      if (response.ok) {
        setConversations((prev) => prev?.filter((c) => c.id !== deleting.id) ?? null);
        if (detail?.id === deleting.id) setDetail(null);
      }
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  const deleteAll = async () => {
    setDeleting({ id: "ALL", assistantType: "atelier", title: "", messageCount: 0, createdAt: "", updatedAt: "" } as ConversationSummary);
    setDeleteLoading(true);
    try {
      const list = conversations ?? [];
      await Promise.all(list.map((c) => fetch(`/api/history/${c.id}`, { method: "DELETE" })));
      await load();
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  };

  const renderMessage = (content: string, role: "user" | "assistant", metaAssistant: AssistantType) => {
    if (role === "user") {
      return (
        <div key={content.slice(0, 24) + role} className="flex justify-end">
          <div className="max-w-[85%] rounded-xl rounded-br-sm border border-violet-500/25 bg-violet-600/15 px-4 py-2.5 text-[13.5px] leading-relaxed text-zinc-100 whitespace-pre-wrap break-words">
            {content}
          </div>
        </div>
      );
    }
    // Assistant : atelier/clinique → JSON structuré ; gameplay → markdown.
    if (metaAssistant === "gameplay") {
      return (
        <div className="rounded-xl rounded-tl-sm border border-zinc-800 bg-zinc-925 px-4 py-3">
          <MarkdownContent content={content} />
        </div>
      );
    }
    try {
      const parsed = JSON.parse(content) as { script?: string; codeCorrige?: string; [k: string]: unknown };
      if (parsed.script) {
        return (
          <div className="space-y-3">
            <LuauEditor code={parsed.script} maxHeightClass="max-h-[320px]" className="bg-zinc-925" />
            {"explication" in parsed ? (
              <MarkdownContent content={String(parsed.explication)} />
            ) : null}
          </div>
        );
      }
      if (parsed.codeCorrige) {
        return (
          <div className="space-y-3">
            <div className="rounded-lg border border-sky-500/25 bg-sky-500/8 px-4 py-3 text-[13.5px] text-zinc-200">
              {String(parsed.diagnostic ?? "")}
            </div>
            <LuauEditor code={parsed.codeCorrige} maxHeightClass="max-h-[320px]" className="bg-zinc-925" />
            {"explication" in parsed ? <MarkdownContent content={String(parsed.explication)} /> : null}
          </div>
        );
      }
      return <MarkdownContent content={content} />;
    } catch {
      return <MarkdownContent content={content} />;
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-700/70 bg-zinc-900">
          <History className="h-5 w-5 text-zinc-300" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-50">Historique</h1>
          <p className="text-[13px] text-zinc-400">Tes conversations, visibles uniquement par toi.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="ml-auto w-56 border-zinc-800 bg-zinc-925" aria-label="Filtrer par assistant">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-zinc-800 bg-zinc-900">
            {FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 space-y-2">
        {conversations === null ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full bg-zinc-800/70" />
            <Skeleton className="h-16 w-full bg-zinc-800/70" />
            <Skeleton className="h-16 w-full bg-zinc-800/70" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-925 px-5 py-12 text-center">
            <MessageSquare className="h-5 w-5 text-zinc-600" aria-hidden="true" />
            <p className="text-[14px] font-medium text-zinc-300">Aucune conversation</p>
            <p className="text-[13px] text-zinc-500">Les générations et analyses apparaîtront ici automatiquement.</p>
          </div>
        ) : (
          <>
            <ul className="space-y-2">
              {conversations.map((conversation) => (
                <li
                  key={conversation.id}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-925 px-4 py-3 transition-colors hover:border-violet-500/40"
                >
                  <button
                    type="button"
                    onClick={() => void openDetail(conversation.id)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-2 focus-visible:outline-violet-500"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md border border-zinc-700/60 bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                        {ASSISTANT_LABEL[conversation.assistantType]}
                      </span>
                      <span className="truncate text-[13.5px] font-medium text-zinc-200">{conversation.title}</span>
                    </div>
                    <p className="mt-1 text-[12px] text-zinc-500">
                      {conversation.messageCount} message(s) · {formatDate(conversation.updatedAt)}
                    </p>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleting(conversation)}
                    className="h-8 w-8 shrink-0 text-zinc-500 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Supprimer la conversation « ${conversation.title} »`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
            <div className="pt-2 text-right">
              <Button variant="ghost" size="sm" onClick={deleteAll} className="text-[12.5px] text-zinc-500 hover:text-red-400">
                Tout supprimer
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Dialogue de détail */}
      <Dialog open={detail !== null || detailLoading} onOpenChange={(open) => { if (!open) setDetail(null); }}>
        <DialogContent className="max-h-[85dvh] max-w-2xl overflow-hidden border-zinc-800 bg-zinc-900 p-0 sm:rounded-xl">
          <DialogHeader className="border-b border-zinc-800 px-5 py-4">
            <DialogTitle className="pr-8 text-[15px] leading-snug text-zinc-100">
              {detailLoading ? "Chargement…" : detail?.title}
            </DialogTitle>
            {detail ? (
              <p className="mt-1 text-[12px] text-zinc-500">
                {ASSISTANT_LABEL[detail.assistantType]} · {formatDate(detail.updatedAt)}
              </p>
            ) : null}
          </DialogHeader>
          <div className="max-h-[calc(85dvh-96px)] space-y-4 overflow-y-auto scrollbar-thin p-5">
            {detailLoading ? (
              <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin text-violet-500" aria-hidden="true" />
            ) : detail ? (
              detail.messages.map((message) =>
                message.role === "user" ? (
                  <div key={message.id} className="flex justify-end gap-3">
                    <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-xl rounded-br-sm border border-violet-500/25 bg-violet-600/15 px-4 py-2.5 text-[13.5px] leading-relaxed text-zinc-100">
                      {message.content}
                    </div>
                    <UserAvatar username={user?.username ?? "?"} avatarUrl={user?.avatarUrl} size={30} />
                  </div>
                ) : (
                  <div key={message.id} className="flex gap-3">
                    <span className="mt-0.5 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10">
                      <LunaMark className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 max-w-full flex-1">{renderMessage(message.content, "assistant", detail.assistantType)}</div>
                  </div>
                )
              )
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation de suppression */}
      <AlertDialog open={deleting !== null} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <AlertDialogContent className="border-zinc-800 bg-zinc-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-zinc-100">
              {deleting?.id === "ALL" ? "Supprimer tout l'historique ?" : "Supprimer cette conversation ?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[13.5px] text-zinc-400">
              {deleting?.id === "ALL"
                ? "Toutes les conversations seront définitivement supprimées. Cette action est irréversible."
                : `« ${deleting?.title} » et ses messages seront définitivement supprimés.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="mt-6">
        <Button variant="ghost" size="sm" onClick={() => useLunaStore.getState().setView("dashboard")} className="gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-200">
          <ChevronLeft className="h-4 w-4" />
          Retour à la vue d&apos;ensemble
        </Button>
      </div>
    </div>
  );
}
