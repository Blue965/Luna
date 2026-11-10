/**
 * MODE DÉMO — Réponses de secours générées sans IA.
 *
 * Utilisées uniquement quand aucun fournisseur IA n'est disponible ou
 * opérationnel. Le contenu est réaliste, utile et CLAIREMENT signalé comme
 * une démonstration (aucune prétention d'avoir réellement analysé).
 */
import { sanitizeUserContent } from "@/lib/api-utils";
import type { ScriptLevel, ScriptType } from "@/lib/types";

const DEMO_HEADER =
  "⚠️ **Mode démonstration** — Aucun fournisseur IA n'est actuellement configuré. Voici une réponse structurée d'exemple ; configure une clé IA (voir README) pour obtenir des réponses réelles de Luna.";

/* ------------------------------------------------------------------ */
/* Atelier Luau                                                        */
/* ------------------------------------------------------------------ */

export interface DemoGeneration {
  script: string;
  explication: string;
  emplacement: string;
  remarques: string[];
}

function luauPlaceFor(scriptType: ScriptType): string {
  switch (scriptType) {
    case "Script":
      return "ServerScriptService (script serveur)";
    case "LocalScript":
      return "StarterPlayer > StarterPlayerScripts (script client)";
    case "ModuleScript":
      return "ReplicatedStorage > Modules (module partagé client/serveur)";
  }
}

export function demoGenerate(
  description: string,
  scriptType: ScriptType,
  level: ScriptLevel
): DemoGeneration {
  const safeDescription = sanitizeUserContent(description).slice(0, 120);
  const comments =
    level === "debutant"
      ? "-- (Mode démo) Ce gabarit est commenté pas à pas.\n"
      : "";

  const scriptByType: Record<ScriptType, string> = {
    Script: `${comments}--[[
\tMode démonstration Luna AI
\tGabarit de Script serveur sécurisé : validations + RemoteEvent protégé.
\tDemande simulée : ${safeDescription}
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local ServerStorage = game:GetService("ServerStorage")

-- RemoteEvent créé par le serveur : le client ne peut pas le supprimer.
local remoteEvent = Instance.new("RemoteEvent")
remoteEvent.Name = "DemoRequest"
remoteEvent.Parent = ReplicatedStorage

local MAX_REQUESTS_PER_MINUTE = 20
local requestCounts: { [Player]: { count: number, resetAt: number } } = {}

local function isRateLimited(player: Player): boolean
\tlocal entry = requestCounts[player]
\tlocal now = os.clock()
\tif not entry or now - entry.resetAt >= 60 then
\t\tentry = { count = 0, resetAt = now }
\t\trequestCounts[player] = entry
\tend
\tentry.count += 1
\treturn entry.count > MAX_REQUESTS_PER_MINUTE
end

-- Ne jamais faire confiance au client : on valide chaque argument.
remoteEvent.OnServerEvent:Connect(function(player: Player, action: unknown)
\tif typeof(action) ~= "string" then return end
\tif isRateLimited(player) then
\t\twarn("[Demo] Trop de requêtes de " .. player.Name)
\t\treturn
\tend
\t-- TODO : remplace ce bloc par la logique réelle de ta demande.
\tprint("[Demo] Action valide reçue :", action)
end)

Players.PlayerRemoving:Connect(function(player)
\trequestCounts[player] = nil
end)`,
    LocalScript: `${comments}--[[
\tMode démonstration Luna AI
\tGabarit de LocalScript client : entrée clavier + RemoteEvent sécurisé.
\tDemande simulée : ${safeDescription}
]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local remoteEvent = ReplicatedStorage:WaitForChild("DemoRequest")

local COOLDOWN_SECONDS = 1
local lastSent = 0

UserInputService.InputBegan:Connect(function(input, gameProcessed)
\t-- gameProcessed = true quand l'UI consomme l'entrée : on ignore.
\tif gameProcessed then return end
\tif input.KeyCode ~= Enum.KeyCode.E then return end

\tif os.clock() - lastSent < COOLDOWN_SECONDS then return end
\tlastSent = os.clock()

\t-- Le serveur revalide tout : on n'envoie que des données simples.
\tremoteEvent:FireServer("demo_action")
end)`,
    ModuleScript: `${comments}--[[
\tMode démonstration Luna AI
\tGabarit de ModuleScript réutilisable avec types Luau.
\tDemande simulée : ${safeDescription}
]]

export type DemoConfig = {
\tname: string,
\tinterval: number,
}

local DemoModule = {}

function DemoModule.new(config: DemoConfig)
\tassert(typeof(config.name) == "string", "name doit être une chaîne")
\tassert(typeof(config.interval) == "number" and config.interval > 0, "interval doit être positif")

\tlocal self = setmetatable({}, { __index = DemoModule })
\tself._config = config
\tself._running = false
\treturn self
end

function DemoModule:start()
\tif self._running then return end
\tself._running = true
\ttask.spawn(function()
\t\twhile self._running do
\t\t\t-- TODO : logique réelle de ta demande.
\t\t\tprint(("[Demo] Cycle %s"):format(self._config.name))
\t\t\ttask.wait(self._config.interval)
\t\tend
\tend)
end

function DemoModule:stop()
\tself._running = false
end

return DemoModule`,
  };

  return {
    script: scriptByType[scriptType],
    explication:
      "Ce gabarit de démonstration illustre l'architecture que Luna recommanderait pour ta demande : un service adapté au type de script choisi, des entrées validées, un rate limiting sur les RemoteEvents côté serveur et une séparation nette client/serveur. Une fois un fournisseur IA configuré, Luna adapterait chaque partie à ta description précise au lieu de proposer un gabarit générique.",
    emplacement: luauPlaceFor(scriptType),
    remarques: [
      "Réponse d'exemple : configure une clé IA pour une génération réellement adaptée à ta demande.",
      "Les RemoteEvents restent vulnérables si tu n'y appliques pas de validations : ce gabarit le fait pour toi.",
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Clinique du Code — mini-analyseur à règles (réel et utile en démo)  */
/* ------------------------------------------------------------------ */

export interface DemoDiagnosis {
  diagnostic: string;
  causeProbable: string;
  codeCorrige: string;
  explication: string;
  emplacement: string;
  conseils: string[];
}

interface Rule {
  test: RegExp;
  diagnostic: string;
  cause: string;
  conseils: string[];
  patch?: (code: string) => string;
}

const RULES: Rule[] = [
  {
    test: /attempt to (?:index|call) nil/i,
    diagnostic:
      "Une variable vaut `nil` au moment où le script tente de l'utiliser (indexation ou appel).",
    cause:
      "L'objet n'existait pas encore au moment de l'exécution (réplication incomplète, instance supprimée, ou `GetService`/`WaitForChild` manquant).",
    conseils: [
      "Remplace les accès directs par `:WaitForChild(\"Nom\")` pour attendre la réplication.",
      "Vérifie l'ordre d'exécution serveur/client : un Script serveur voit les Players plus tôt qu'un LocalScript.",
      "Utilise `pcall` autour des accès à des services externes (DataStore, MarketplaceService).",
    ],
    patch: (code) =>
      code
        .replace(/\bgame\.GetService\("([\w]+)"\)/g, 'game:GetService("$1")')
        .replace(/(?<!:WaitForChild\()\.WaitForChild\(/g, ".WaitForChild("),
  },
  {
    test: /attempt to perform arithmetic|attempt to compare/i,
    diagnostic: "Une opération arithmétique ou une comparaison reçoit une valeur non numérique.",
    cause:
      "Une variable est `nil` ou une chaîne au lieu d'un nombre — souvent la valeur d'un leaderstats, d'un attribut ou d'un argument de RemoteEvent non validé.",
    conseils: [
      "Valide les types : `typeof(value) == \"number\"` avant tout calcul.",
      "Convertit explicitement avec `tonumber()` et vérifie que le résultat n'est pas `nil`.",
      "Les arguments de RemoteEvent proviennent du client : ne leur fais jamais confiance.",
    ],
  },
  {
    test: /Players\.(\w+)\.PlayerScripts|not a valid member/i,
    diagnostic: "L'instance ciblée par son nom n'existe pas (ou plus) au moment de l'accès.",
    cause:
      "Nom d'instance incorrect, objet renommé, détruit, ou placé ailleurs que dans l'endroit attendu.",
    conseils: [
      "Vérifie l'orthographe exacte du nom dans l'Explorer.",
      "Utilise `FindFirstChild` avec une vérification `nil` pour un accès tolérant aux erreurs.",
      "Préfère la collection par tag (`CollectionService`) aux chemins d'accès fragiles.",
    ],
  },
  {
    test: /infinite (?:yield|wait)|possible infinite loop/i,
    diagnostic: "Le script reste bloqué en attente infinie sur un enfant qui n'arrive jamais.",
    cause:
      "`WaitForChild` attend un enfant qui n'est jamais créé (mauvais parent, objet côté serveur uniquement).",
    conseils: [
      "Ajoute un timeout : `local obj = folder:WaitForChild(\"X\", 10)` puis vérifie `nil`.",
      "Confirme que l'objet est bien créé côté client (les objets créés en local n'existent pas côté serveur).",
    ],
  },
  {
    test: /Unable to cast|invalid argument #1/i,
    diagnostic: "Un argument d'appel a le mauvais type (instance attendue, valeur reçue, ou inversement).",
    cause: "Type incorrect passé à une API Roblox (ex : Vector3 attendu, table reçue).",
    conseils: [
      "Affiche le type avec `print(typeof(valeur))` juste avant l'appel fautif.",
      "Construis explicitement les types Roblox : `Vector3.new(x, y, z)` plutôt que de passer une table.",
    ],
  },
];

export function demoDiagnose(code: string, errorMessage: string): DemoDiagnosis {
  const rule = RULES.find((r) => r.test.test(errorMessage));

  if (rule) {
    return {
      diagnostic: `[Démo — analyse par règles] ${rule.diagnostic}`,
      causeProbable: rule.cause,
      codeCorrige: rule.patch ? rule.patch(code) : code,
      explication:
        "Cette analyse provient du moteur de démonstration (règles basées sur les erreurs Roblox les plus fréquentes) : elle ne remplace pas une analyse IA complète. La cause identifiée correspond au motif de ton message d'erreur — applique les correctifs proposés, puis retest dans Studio avec la fenêtre Output ouverte pour confirmer.",
      emplacement: "Conserve le script à son emplacement actuel (aucun déplacement nécessaire pour ce type d'erreur).",
      conseils: rule.conseils,
    };
  }

  return {
    diagnostic:
      "[Démo] L'erreur ne correspond à aucun motif connu du moteur de démonstration ; une analyse IA est nécessaire pour un diagnostic précis.",
    causeProbable:
      "Cause non déterminée en mode démo. Relis le numéro de ligne dans le message d'erreur : il pointe généralement l'expression fautive.",
    codeCorrige: code,
    explication:
      "En mode démonstration, Luna ne modifie pas ton code pour éviter d'introduire des erreurs. Configure un fournisseur IA (voir README) pour obtenir un diagnostic complet avec correction minimale du code.",
    emplacement: "Non déterminé en mode démo.",
    conseils: [
      "Ouvre la fenêtre Output et relance le jeu pour capturer l'erreur complète avec le numéro de ligne.",
      "Isole la ligne fautive avec des `print` de contrôle pour vérifier les valeurs intermédiaires.",
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Économie & Gameplay                                                 */
/* ------------------------------------------------------------------ */

export function demoGameplayReply(message: string): string {
  const safeMessage = sanitizeUserContent(message).toLowerCase();

  if (/xp|niveau|level|progression/.test(safeMessage)) {
    return `${DEMO_HEADER}

## Courbe d'XP recommandée (mode démo)

**Formule :** \`XP requis(niveau) = base × croissance^(niveau − 1)\`

Avec **base = 100** et **croissance = 1,35**, chaque niveau demande environ 35 % d'XP de plus que le précédent :

| Niveau | XP requis | XP cumulé |
|--------|-----------|-----------|
| 1 | 100 | 100 |
| 2 | 135 | 235 |
| 5 | 332 | 1 147 |
| 10 | 1 501 | 5 426 |

\`\`\`lua
-- Exemple minimal de courbe géométrique
local BASE_XP = 100
local GROWTH = 1.35

local function xpForLevel(level: number): number
\treturn math.floor(BASE_XP * GROWTH ^ (level - 1))
end
\`\`\`

**Pourquoi géométrique ?** Elle garde un rythme régulier sans exploser trop vite : les 10 premiers niveaux durent quelques minutes, les niveaux 30+ deviennent des objectifs à long terme.

> Configure une clé IA pour recevoir un plan d'équilibrage complet adapté à ton jeu (sources d'XP, temps de farming cible, récompenses).`;
  }

  if (/tycoon|économie|economie|monnaie|argent|prix/.test(safeMessage)) {
    return `${DEMO_HEADER}

## Économie de Tycoon (mode démo)

**Règle d'or :** le revenu par minute doit toujours être **inférieur** au prix de l'achat suivant ÷ temps de collecte visé.

Exemple cohérent :
- Dropeur de base : **50 € / 10 s** → 300 € / minute
- Premier achat : 500 € (≈ 100 s de collecte)
- Progression ×2,5 par étage de Tycoon : prix suivants 1 250 → 3 100 → 7 800…

**Points d'équilibrage :**
1. Perte de monnaie à la mort : −10 à −20 % (assez pour compter, pas assez pour frustrer).
2. Boucle courte en début de partie (< 2 min) pour accrocher le joueur.
3. Cap du stockage de monnaie pour éviter le farming AFK infini.

> Configure une clé IA pour un modèle économique complet (flux de monnaie, sinks/faucets, rareté des objets).`;
  }

  return `${DEMO_HEADER}

## Mode démonstration

Je suis Luna en **mode démo** : je peux t'illustrer des gabarits de réponse sur les thèmes suivants :

- **Systèmes d'XP et de niveaux** (courbes géométriques, paliers)
- **Économies de Tycoon** (flux de monnaie, équilibrage des achats)
- **Récompenses quotidiennes** (streaks, anti-abus)

Pose une question sur un de ces thèmes, ou configure un fournisseur IA (voir README) pour accéder à la vraie Luna.`;
}
