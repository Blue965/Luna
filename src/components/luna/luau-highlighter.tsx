"use client";

/**
 * Coloration syntaxique Luau — tokenizeur maison (sans dépendance).
 * Rendu déterministe côté serveur et client (aucun risque d'hydratation),
 * numéros de lignes inclus.
 */
import { cn } from "@/lib/utils";

type TokenType = "comment" | "string" | "keyword" | "boolean" | "number" | "api" | "func" | "operator" | "plain";

interface Token {
  type: TokenType;
  value: string;
}

const KEYWORDS = new Set([
  "local", "function", "end", "if", "then", "else", "elseif", "for", "while",
  "do", "return", "break", "continue", "repeat", "until", "in", "and", "or",
  "not", "type", "export", "self",
]);

const LITERALS = new Set(["nil", "true", "false"]);

const ROBLOX_APIS = new Set([
  "game", "workspace", "Workspace", "script", "Instance", "Vector3", "Vector2",
  "CFrame", "Color3", "UDim2", "UDim", "TweenInfo", "Enum", "task", "print",
  "warn", "error", "pcall", "xpcall", "require", "math", "string", "table",
  "os", "tick", "Random", "typeof", "tostring", "tonumber", "pairs", "ipairs",
  "next", "select", "assert", "setmetatable", "getmetatable", "rawget", "rawset",
  "coroutine", "Players", "RunService", "ReplicatedStorage", "ServerScriptService",
  "ServerStorage", "StarterGui", "StarterPlayer", "UserInputService", "TweenService",
  "HttpService", "SoundService", "Lighting", "CollectionService", "DataStoreService",
  "MarketplaceService", "TeleportService", "Workspace", "Ray", "Region3", "BrickColor",
  "NumberRange", "NumberSequence", "ColorSequence", "wait", "spawn", "delay",
]);

function tokenizeLuau(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = code.length;

  const push = (type: TokenType, value: string) => {
    const last = tokens[tokens.length - 1];
    if (last && last.type === type) last.value += value;
    else tokens.push({ type, value });
  };

  while (i < n) {
    const char = code[i];

    // Commentaires longs --[[ ... ]] ou --[==[ ... ]==]
    if (char === "-" && code[i + 1] === "-") {
      const longMatch = /^--\[(=*)\[/.exec(code.slice(i));
      if (longMatch) {
        const closeTag = `]${longMatch[1]}]`;
        const closeIdx = code.indexOf(closeTag, i + longMatch[0].length);
        const end = closeIdx === -1 ? n : closeIdx + closeTag.length;
        push("comment", code.slice(i, end));
        i = end;
        continue;
      }
      // Commentaire de ligne -- ...
      let end = code.indexOf("\n", i);
      if (end === -1) end = n;
      push("comment", code.slice(i, end));
      i = end;
      continue;
    }

    // Chaînes longues [[ ... ]] ou [==[ ... ]==]
    const longStrMatch = /^\[(=*)\[/.exec(code.slice(i));
    if (longStrMatch) {
      const closeTag = `]${longStrMatch[1]}]`;
      const closeIdx = code.indexOf(closeTag, i + longStrMatch[0].length);
      const end = closeIdx === -1 ? n : closeIdx + closeTag.length;
      push("string", code.slice(i, end));
      i = end;
      continue;
    }

    // Chaînes avec quotes
    if (char === '"' || char === "'") {
      let j = i + 1;
      while (j < n && code[j] !== char) {
        if (code[j] === "\\") j += 1;
        if (code[j] === "\n") break;
        j += 1;
      }
      const end = Math.min(j + 1, n);
      push("string", code.slice(i, end));
      i = end;
      continue;
    }

    // Nombres
    if (/[0-9]/.test(char) || (char === "." && /[0-9]/.test(code[i + 1] ?? ""))) {
      const match = /^[0-9]*\.?[0-9]+(?:[eE][+-]?[0-9]+)?/.exec(code.slice(i));
      if (match) {
        push("number", match[0]);
        i += match[0].length;
        continue;
      }
    }

    // Identifiants
    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(code.slice(i));
      if (match) {
        const word = match[0];
        let j = i + word.length;
        while (j < n && /\s/.test(code[j])) j += 1;
        const isCall = code[j] === "(" || code[j] === '"' || code[j] === "{";
        if (KEYWORDS.has(word)) push("keyword", word);
        else if (LITERALS.has(word)) push("boolean", word);
        else if (ROBLOX_APIS.has(word)) push("api", word);
        else if (isCall) push("func", word);
        else push("plain", word);
        i += word.length;
        continue;
      }
    }

    // Opérateurs
    if (/[+\-*/%^#=<>~{}()[\];:,.]/.test(char)) {
      push("operator", char);
      i += 1;
      continue;
    }

    push("plain", char);
    i += 1;
  }

  return tokens;
}

const TOKEN_CLASS: Record<TokenType, string> = {
  comment: "text-zinc-500 italic",
  string: "text-emerald-300",
  keyword: "text-violet-400 font-medium",
  boolean: "text-orange-300",
  number: "text-orange-300",
  api: "text-sky-300",
  func: "text-yellow-100",
  operator: "text-zinc-400",
  plain: "text-zinc-200",
};

export function LuauCode({ code, className }: { code: string; className?: string }) {
  const tokens = tokenizeLuau(code);
  return (
    <code className={cn("font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words", className)}>
      {tokens.map((token, idx) => (
        <span key={idx} className={TOKEN_CLASS[token.type]}>
          {token.value}
        </span>
      ))}
    </code>
  );
}

/**
 * Éditeur de code avec numéros de lignes.
 * La coloration est calculée ligne par ligne pour aligner les numéros.
 */
export function LuauEditor({
  code,
  className,
  maxHeightClass = "max-h-[420px]",
}: {
  code: string;
  className?: string;
  maxHeightClass?: string;
}) {
  const lines = code.split("\n");

  return (
    <div
      className={cn(
        "overflow-auto scrollbar-thin rounded-md border border-zinc-800/70 bg-zinc-950/80",
        maxHeightClass,
        className
      )}
    >
      <div className="flex min-w-full">
        <div
          aria-hidden="true"
          className="sticky left-0 z-10 select-none border-r border-zinc-800/70 bg-zinc-950 px-3 py-3 text-right font-mono text-[13px] leading-relaxed text-zinc-600"
        >
          {lines.map((_, idx) => (
            <div key={idx}>{idx + 1}</div>
          ))}
        </div>
        <div className="min-w-0 flex-1 px-4 py-3">
          {lines.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap break-words">
              <LuauCode code={line.length ? line : " "} className="inline" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
