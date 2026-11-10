/**
 * Schémas de validation Zod — utilisés côté serveur (API) et côté client (formulaires).
 * Toutes les entrées utilisateur passent par ces schémas avant tout traitement.
 */
import { z } from "zod";

const SAFE_TEXT = /^[\s\S]*$/; // Autorise les retours à la ligne, validé par longueur.

export const generateSchema = z.object({
  description: z
    .string()
    .trim()
    .min(10, "Décris ton besoin en au moins 10 caractères.")
    .max(4000, "La description ne peut pas dépasser 4000 caractères.")
    .regex(SAFE_TEXT),
  scriptType: z.enum(["Script", "LocalScript", "ModuleScript"]),
  level: z.enum(["debutant", "intermediaire", "avance"]),
  focus: z.enum(["general", "securite", "performance", "pedagogique"]).default("general"),
});
export type GenerateInput = z.infer<typeof generateSchema>;

export const debugSchema = z.object({
  code: z
    .string()
    .min(1, "Le code source est requis.")
    .max(20000, "Le code ne peut pas dépasser 20 000 caractères.")
    .regex(SAFE_TEXT),
  errorMessage: z
    .string()
    .trim()
    .min(3, "Le message d'erreur est requis (3 caractères minimum).")
    .max(3000, "Le message d'erreur ne peut pas dépasser 3000 caractères.")
    .regex(SAFE_TEXT),
  context: z
    .string()
    .trim()
    .max(3000, "Le contexte ne peut pas dépasser 3000 caractères.")
    .optional()
    .or(z.literal("")),
});
export type DebugInput = z.infer<typeof debugSchema>;

export const gameplaySchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, "Ton message est trop court.")
    .max(4000, "Le message ne peut pas dépasser 4000 caractères.")
    .regex(SAFE_TEXT),
  conversationId: z.string().cuid().optional(),
});
export type GameplayInput = z.infer<typeof gameplaySchema>;

export const preferencesSchema = z.object({
  defaultLevel: z.enum(["debutant", "intermediaire", "avance"]),
  defaultScriptType: z.enum(["Script", "LocalScript", "ModuleScript"]),
  defaultFocus: z.enum(["general", "securite", "performance", "pedagogique"]),
  detailLevel: z.enum(["concis", "detaille"]),
  reduceMotion: z.boolean(),
});
export type PreferencesInput = z.infer<typeof preferencesSchema>;

/** Extrait le premier message d'erreur lisible d'un résultat Zod. */
export function firstIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  return issue?.message ?? "Données invalides.";
}
