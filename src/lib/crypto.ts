/**
 * Chiffrement au repos des secrets utilisateur (clés API BYOK).
 *
 * - AES-256-GCM (authentifié) : toute altération du texte chiffré
 *   fait échouer le déchiffrement — la clé est alors ignorée.
 * - La clé de chiffrement est dérivée de APP_SECRET (variable serveur)
 *   via SHA-256 avec un contexte dédié. APP_SECRET n'apparaît jamais
 *   dans le code, les réponses API ou les logs.
 *
 * Format stocké : "v1:<iv base64>:<tag base64>:<ciphertext base64>"
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const CIPHER = "aes-256-gcm";
const IV_BYTES = 12;
const VERSION = "v1";
const KEY_CONTEXT = "luna-ai:openrouter-byok:v1";

function deriveKey(): Buffer {
  const secret = process.env.APP_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "APP_SECRET manquante ou trop courte : impossible de chiffrer les clés API personnelles."
    );
  }
  return createHash("sha256").update(`${KEY_CONTEXT}:${secret}`, "utf8").digest();
}

/** Chiffre une chaîne secrète. Renvoie null si la configuration serveur est incomplète. */
export function encryptSecret(plaintext: string): string | null {
  try {
    const key = deriveKey();
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(CIPHER, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [
      VERSION,
      iv.toString("base64"),
      tag.toString("base64"),
      encrypted.toString("base64"),
    ].join(":");
  } catch (error) {
    console.error("[Luna AI] Échec du chiffrement du secret :", error);
    return null;
  }
}

/** Déchiffre une chaîne produite par encryptSecret. Renvoie null en cas d'échec. */
export function decryptSecret(payload: string): string | null {
  try {
    const parts = payload.split(":");
    if (parts.length !== 4 || parts[0] !== VERSION) return null;
    const [, ivB64, tagB64, dataB64] = parts;
    const key = deriveKey();
    const decipher = createDecipheriv(CIPHER, key, Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, "base64")),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    // Tag d'authentification invalide, format inconnu, clé dérivée différente…
    return null;
  }
}

/** Indice non sensible affiché au client : derniers caractères de la clé. */
export function keyHint(secret: string): string {
  const tail = secret.slice(-4);
  return `sk-or-v1-…${tail}`;
}
