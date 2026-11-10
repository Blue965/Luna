/**
 * Fournisseur IA de Luna AI.
 *
 * Chaîne de résolution (serveur uniquement) :
 *   1. OPENAI_API_KEY configuré    → API OpenAI (chat completions)
 *   2. ANTHROPIC_API_KEY configuré → API Anthropic (messages)
 *   3. Sinon                       → SDK intégré z-ai-web-dev-sdk
 *   4. En cas d'échec              → générateur de secours "mode démo"
 *                                     (réponses réalistes clairement signalées)
 *
 * Les clés restent dans les variables d'environnement et ne sont
 * jamais exposées au frontend.
 */
import type { AiProviderId } from "@/lib/types";

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AiCallResult {
  content: string;
  provider: AiProviderId;
  demo: boolean;
}

interface ProviderAttempt {
  provider: Exclude<AiProviderId, "demo">;
  available: boolean;
}

export function availableProvider(): ProviderAttempt["provider"] {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "zai";
}

export function aiProviderLabel(): AiProviderId {
  return availableProvider();
}

/* ------------------------------------------------------------------ */
/* Appels réels                                                        */
/* ------------------------------------------------------------------ */

async function callOpenAI(system: string, messages: AiMessage[]): Promise<string> {
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0.4,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI API a répondu ${response.status}`);
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse OpenAI vide.");
  return content;
}

async function callAnthropic(system: string, messages: AiMessage[]): Promise<string> {
  const model = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system,
      messages,
    }),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API a répondu ${response.status}`);
  }
  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const content = data.content?.filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  if (!content) throw new Error("Réponse Anthropic vide.");
  return content;
}

async function callZai(system: string, messages: AiMessage[]): Promise<string> {
  // Import dynamique : le SDK n'est disponible que dans l'environnement exécuté.
  const { default: ZAI } = await import("z-ai-web-dev-sdk");
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: system } as never,
      ...messages,
    ] as never,
    thinking: { type: "disabled" },
  });
  const content =
    (completion as { choices?: Array<{ message?: { content?: string } }> }).choices?.[0]?.message?.content;
  if (!content || !content.trim()) throw new Error("Réponse du modèle intégrée vide.");
  return content;
}

/* ------------------------------------------------------------------ */
/* Point d'entrée unique                                               */
/* ------------------------------------------------------------------ */

/**
 * Appelle le fournisseur IA configuré avec les instructions système.
 * En cas d'échec, bascule automatiquement en mode démo (réponse signalée).
 */
export async function callLuna(
  system: string,
  messages: AiMessage[],
  demoFallback: () => string
): Promise<AiCallResult> {
  const provider = availableProvider();

  if (provider !== "demo") {
    try {
      const content =
        provider === "openai"
          ? await callOpenAI(system, messages)
          : provider === "anthropic"
            ? await callAnthropic(system, messages)
            : await callZai(system, messages);
      return { content, provider, demo: false };
    } catch (error) {
      console.error(`[Luna AI] Échec du fournisseur ${provider} :`, error);
    }
  } else {
    try {
      return { content: await callZai(system, messages), provider: "zai", demo: false };
    } catch (error) {
      console.error("[Luna AI] Modèle intégré indisponible, bascule en mode démo :", error);
    }
  }

  return { content: demoFallback(), provider: "demo", demo: true };
}

/* ------------------------------------------------------------------ */
/* Analyse de la réponse                                               */
/* ------------------------------------------------------------------ */

/**
 * Extrait un objet JSON d'une réponse IA. Tolère les blocs de code
 * ```json … ``` et le texte parasite autour de l'objet.
 */
export function extractJsonObject<T>(raw: string): T | null {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}
