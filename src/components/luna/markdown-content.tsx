"use client";

/**
 * Rendu Markdown des réponses Luna (chat Gameplay, explications).
 * Les blocs de code `luau`/`lua` sont coloriés et copiables.
 */
import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/luna/code-block";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn("space-y-3 text-[14px] leading-relaxed text-zinc-200", className)}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h3 className="mt-4 text-[15px] font-semibold text-zinc-100 first:mt-0">{children}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="mt-4 text-[15px] font-semibold text-zinc-100 first:mt-0">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="mt-3 text-[14px] font-semibold text-zinc-100 first:mt-0">{children}</h4>
          ),
          p: ({ children }) => <p className="text-zinc-200">{children}</p>,
          ul: ({ children }) => <ul className="ml-4 list-disc space-y-1.5 text-zinc-200">{children}</ul>,
          ol: ({ children }) => <ol className="ml-4 list-decimal space-y-1.5 text-zinc-200">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-zinc-100">{children}</strong>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 underline decoration-violet-500/40 underline-offset-2 hover:text-violet-300"
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-violet-500/50 pl-3 text-zinc-400">{children}</blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto scrollbar-thin rounded-md border border-zinc-800">
              <table className="w-full text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-zinc-900/80 text-zinc-300">{children}</thead>,
          th: ({ children }) => <th className="border-b border-zinc-800 px-3 py-2 text-left font-medium">{children}</th>,
          td: ({ children }) => <td className="border-b border-zinc-800/50 px-3 py-2">{children}</td>,
          pre: () => null, // Les blocs sont rendus par "code" (voir dessous).
          code: (props) => {
            const { className: cls, children } = props;
            const raw = String(children ?? "").replace(/\n$/, "");
            const match = /language-(\w+)/.exec(cls ?? "");
            const lang = match?.[1]?.toLowerCase();
            const isBlock = raw.includes("\n") || lang != null;
            if (!isBlock) {
              return (
                <code className="rounded-sm border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[12.5px] text-violet-300">
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                code={raw}
                luau={lang === "lua" || lang === "luau" || lang == null}
                label={lang ?? "texte"}
                maxHeightClass="max-h-[420px]"
              />
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
