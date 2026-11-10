/**
 * Types partagés entre le client et le serveur.
 * Aucun import serveur ici — ce fichier est importable côté client.
 */

export type AssistantType = "atelier" | "clinique" | "gameplay";

export type ScriptType = "Script" | "LocalScript" | "ModuleScript";

export type ScriptLevel = "debutant" | "intermediaire" | "avance";

export type ScriptFocus = "general" | "securite" | "performance" | "pedagogique";

export type ViewId =
  | "landing"
  | "dashboard"
  | "atelier"
  | "clinique"
  | "economie"
  | "historique"
  | "parametres";

export type AiProviderId = "zai" | "openai" | "anthropic" | "openrouter" | "demo";

/** Statut OpenRouter (BYOK) exposé au client — jamais la clé elle-même. */
export interface UserOpenRouterStatus {
  configured: boolean;
  keyHint: string | null;
  defaultModel: string | null;
  verifiedAt: string | null;
  isFreeTier: boolean | null;
  usage: number | null;
  limit: number | null;
}

/** Préférences d'interface stockées côté compte (JSON). */
export interface UserPreferences {
  defaultLevel: ScriptLevel;
  defaultScriptType: ScriptType;
  defaultFocus: ScriptFocus;
  detailLevel: "concis" | "detaille";
  reduceMotion: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultLevel: "intermediaire",
  defaultScriptType: "Script",
  defaultFocus: "general",
  detailLevel: "detaille",
  reduceMotion: false,
};

export interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isDemo: boolean;
  robloxUserId: string | null;
  createdAt: string;
  preferences: UserPreferences;
  openrouter: UserOpenRouterStatus;
}

export interface AppPublicConfig {
  robloxOAuthConfigured: boolean;
  aiProvider: AiProviderId;
  version: string;
}

/** Modèle exposé par /api/openrouter/models. */
export interface OpenRouterModelView {
  id: string;
  name: string;
  contextLength: number | null;
  free: boolean;
}

export interface ConversationSummary {
  id: string;
  assistantType: AssistantType;
  title: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ConversationMessage[];
  meta?: Record<string, unknown> | null;
}

/** Résultat de l'Atelier Luau (JSON structuré renvoyé par le backend). */
export interface GenerationResult {
  conversationId: string;
  script: string;
  explication: string;
  emplacement: string;
  remarques: string[];
  provider: AiProviderId;
  demo: boolean;
}

/** Résultat de la Clinique du Code. */
export interface DiagnosisResult {
  conversationId: string;
  diagnostic: string;
  causeProbable: string;
  codeCorrige: string;
  explication: string;
  emplacement: string;
  conseils: string[];
  provider: AiProviderId;
  demo: boolean;
}

export interface UserStats {
  generations: number;
  bugs: number;
  gameplay: number;
  total: number;
  recent: ConversationSummary[];
}

export interface GameplayReply {
  conversationId: string;
  reply: string;
  provider: AiProviderId;
  demo: boolean;
}

export const ASSISTANT_META: Record<
  AssistantType,
  { label: string; description: string; icon: string }
> = {
  atelier: {
    label: "Atelier Luau",
    description: "Génération de scripts propres, commentés et optimisés.",
    icon: "hammer",
  },
  clinique: {
    label: "Clinique du Code",
    description: "Analyse des erreurs Output et correction intelligente.",
    icon: "stethoscope",
  },
  gameplay: {
    label: "Économie & Gameplay",
    description: "Conception et équilibrage de systèmes de jeu.",
    icon: "gamepad",
  },
};
