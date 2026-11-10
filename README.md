# Luna AI — L'assistant IA pour Roblox Studio

> « Code plus vite. Crée sans limites. »

Luna AI est une plateforme SaaS de copilote technique pour développeurs Roblox Studio : génération de scripts Luau sécurisés, diagnostic des erreurs de l'Output, et conception/équilibrage de systèmes de gameplay.

---

## Sommaire

1. [Fonctionnalités](#fonctionnalités)
2. [Stack technique](#stack-technique)
3. [Installation](#installation)
4. [Configuration de la base de données](#configuration-de-la-base-de-données)
5. [Configuration de l'authentification Roblox (OAuth)](#configuration-de-lauthentification-roblox-oauth)
6. [Configuration du fournisseur IA](#configuration-du-fournisseur-ia)
7. [Architecture du projet](#architecture-du-projet)
8. [API](#api)
9. [Sécurité](#sécurité)
10. [Mode démo](#mode-démo)
11. [Scripts disponibles](#scripts-disponibles)

---

## Fonctionnalités

| Assistant | Rôle |
| --- | --- |
| **Atelier Luau** | Génération de scripts (Script / LocalScript / ModuleScript) avec coloration syntaxique, numéros de lignes, copie, téléchargement, régénération, explication et emplacement Studio. |
| **Clinique du Code** | Analyse d'une erreur Output : diagnostic, cause probable, code corrigé (correction minimale), explication pédagogique, emplacement recommandé, conseils de prévention. |
| **Économie & Gameplay** | Chat conversationnel persistant : XP/niveaux, économies de Tycoon, récompenses quotidiennes, prestige, courbes de progression, formules mathématiques et exemples Luau. |

Plus : landing page premium, dashboard avec statistiques réelles, historique complet (filtre, détail, suppression), paramètres (profil, préférences, utilisation, suppression de compte), responsive mobile/tablette/desktop.

## Stack technique

- **Next.js 16** (App Router) + **TypeScript strict** + **React 19**
- **Tailwind CSS 4** + composants **shadcn/ui** + **Lucide React**
- **Prisma ORM** + **SQLite** (dev/sandbox) — prêt pour PostgreSQL (production)
- **Zod** pour la validation frontend **et** backend
- API Routes Next.js pour le backend
- **z-ai-web-dev-sdk** (modèle intégré) ou clés OpenAI / Anthropic via variables d'environnement
- Authentification **Roblox OAuth 2.0 / OpenID Connect** (Authorization Code Flow + PKCE)

## Installation

```bash
# 1. Dépendances
bun install          # ou npm install / pnpm install

# 2. Variables d'environnement
cp .env.example .env # puis renseigne les valeurs (voir sections ci-dessous)

# 3. Schéma de base de données
bun run db:push

# 4. Développement
bun run dev          # http://localhost:3000
```

## Configuration de la base de données

Le schéma (`prisma/schema.prisma`) définit quatre modèles : `User`, `Session`, `Conversation`, `Message`. Les suppressions sont en cascade (supprimer un utilisateur efface ses sessions et conversations).

**SQLite (par défaut, développement) :**

```env
DATABASE_URL="file:./db/custom.db"
```

**PostgreSQL (production) :** dans `prisma/schema.prisma`, remplace `provider = "sqlite"` par `provider = "postgresql"`, puis :

```env
DATABASE_URL="postgresql://user:password@host:5432/luna"
```

> Note SQLite : Prisma ne supporte pas le type `Json` sur SQLite — le champ `User.preferences` est une chaîne JSON sérialisée (utilitaire `parsePreferences` fourni).

Migrations : `bun run db:migrate` (génère un historique de migrations) ou `bun run db:push` (synchronisation directe).

## Configuration de l'authentification Roblox (OAuth)

L'authentification est **exclusivement** Roblox (OpenID Connect). Aucune connexion Google/Discord/GitHub n'est proposée, et un simple pseudonyme saisi ne suffit jamais à s'authentifier.

1. Ouvre [create.roblox.com → OAuth Apps](https://create.roblox.com/oauth/apps) et crée une application.
2. Ajoute une Redirect URI exacte : `https://ton-domaine/api/auth/roblox/callback` (et `http://localhost:3000/api/auth/roblox/callback` en local).
3. Scopes requis : `openid profile`.
4. Renseigne dans `.env` :

```env
ROBLOX_CLIENT_ID="ton_client_id"
ROBLOX_CLIENT_SECRET="ton_client_secret"
# Optionnel (proxy/CDN) :
ROBLOX_REDIRECT_URI="https://ton-domaine/api/auth/roblox/callback"
```

**Ce que fait le backend** (endpoints officiels Roblox) :

| Étape | Détail |
| --- | --- |
| 1 | `GET /api/auth/roblox` → génère `state`, `nonce` et une paire **PKCE** (S256), stockés dans des cookies HttpOnly (10 min), puis redirige vers `https://apis.roblox.com/oauth/v1/authorize` |
| 2 | `GET /api/auth/roblox/callback` → vérifie le `state` (anti-CSRF), échange le code via `POST /oauth/v1/token` avec le `code_verifier` |
| 3 | Valide le **ID token** : signature RS256 via le JWKS officiel, `iss`, `aud`, `exp`, `nonce` |
| 4 | Récupère le profil via `GET /oauth/v1/userinfo` (serveur uniquement) |
| 5 | Associe le profil Roblox au compte Luna AI (upsert sur le `sub` Roblox) et crée une session en base |
| 6 | Cookie de session `HttpOnly` + `Secure` (production) + `SameSite=Lax` |

Si les identifiants ne sont pas configurés, l'interface l'explique clairement et propose uniquement le **mode démo** — jamais d'authentification simulée.

## Configuration du fournisseur IA

Les instructions système de Luna (identité, règles de programmation Luau, spécialisation par assistant) vivent dans `src/lib/ai/prompts.ts`, **côté serveur uniquement** — elles ne sont jamais envoyées au frontend et ne sont pas modifiables par l'utilisateur.

Chaîne de résolution du provider (`src/lib/ai/provider.ts`) :

1. `OPENAI_API_KEY` définie → API OpenAI (modèle : `OPENAI_MODEL`, défaut `gpt-4o-mini`)
2. `ANTHROPIC_API_KEY` définie → API Anthropic (modèle : `ANTHROPIC_MODEL`, défaut `claude-sonnet-4-20250514`)
3. Sinon → modèle intégré `z-ai-web-dev-sdk` (aucune configuration requise)
4. En cas d'échec → **mode démo** : réponses de secours réalistes, toujours signalées par un badge « Mode démo » (la Clinique y utilise même un vrai moteur d'analyse par règles pour les erreurs Roblox les plus fréquentes)

Chaque requête IA applique le pipeline : authentification → validation Zod → rate limiting (12 req / 5 min par assistant) → prompt système serveur → appel → parsing structuré → historique → réponse.

## Architecture du projet

```
src/
├── app/
│   ├── page.tsx                    # Point d'entrée SPA (landing + app)
│   ├── layout.tsx                  # Fonts Geist, metadata FR, thème sombre
│   ├── globals.css                 # Design system zinc-950 / violet
│   └── api/                        # Backend (voir § API)
│       ├── config/ · auth/ · user/ · stats/ · history/ · ai/
├── components/
│   ├── ui/                         # shadcn/ui
│   └── luna/
│       ├── landing/                # nav, hero (+ aperçu app), bento, CTA
│       ├── views/                  # dashboard, atelier, clinique, gameplay,
│       │                           # historique, paramètres
│       ├── app-shell.tsx           # sidebar responsive + navigation
│       ├── auth-dialog.tsx         # connexion Roblox / mode démo
│       ├── luau-highlighter.tsx    # coloration Luau maison + numéros de lignes
│       ├── code-block.tsx          # blocs de code copiables
│       ├── markdown-content.tsx    # rendu markdown des réponses IA
│       └── logo.tsx · user-avatar.tsx · demo-badge.tsx
├── lib/
│   ├── auth.ts                     # sessions DB + cookies HttpOnly
│   ├── roblox-oauth.ts             # PKCE, state/nonce, JWT RS256 via JWKS, userinfo
│   ├── ai/prompts.ts               # cerveau Luna (instructions système)
│   ├── ai/provider.ts              # z-ai / OpenAI / Anthropic + fallback démo
│   ├── ai/demo.ts                  # réponses de secours signalées
│   ├── rate-limit.ts · validation.ts · api-utils.ts · preferences.ts · types.ts
├── hooks/use-luna-store.ts         # état global (SPA, sync du hash d'URL)
└── prisma/schema.prisma            # User · Session · Conversation · Message
```

## API

| Méthode | Route | Description |
| --- | --- | --- |
| GET | `/api/config` | Configuration publique (OAuth configuré ? provider IA) |
| GET | `/api/auth/roblox` | Démarre l'OAuth Roblox (redirect 302) |
| GET | `/api/auth/roblox/callback` | Callback OAuth (state, PKCE, ID token, userinfo) |
| POST | `/api/auth/demo` | Connexion mode démo (clairement identifiée) |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/user/profile` | Profil de l'utilisateur connecté |
| PATCH | `/api/user/preferences` | Mise à jour des préférences |
| DELETE | `/api/user/account` | Suppression du compte et de toutes ses données |
| GET | `/api/stats` | Statistiques de l'utilisateur |
| GET | `/api/history` | Liste des conversations (filtre `?assistant=`) |
| GET/DELETE | `/api/history/[id]` | Détail / suppression d'une conversation |
| POST | `/api/ai/generate` | Atelier Luau |
| POST | `/api/ai/debug` | Clinique du Code |
| POST | `/api/ai/gameplay` | Économie & Gameplay (chat) |

Toutes les routes sensibles : authentification obligatoire, validation Zod, rate limiting, isolation stricte des données par compte.

## Sécurité

- Clés API uniquement en variables d'environnement serveur — jamais exposées au frontend.
- OAuth : Authorization Code Flow + **PKCE S256**, `state` anti-CSRF, `nonce` anti-rejeu, vérification de la signature du ID token (RS256 / JWKS).
- Cookies `HttpOnly`, `Secure` (production), `SameSite=Lax` ; jetons de session aléatoires (32 octets base64url).
- Rate limiting mémoire par utilisateur et par assistant.
- Anti-injection de prompt : instructions serveur + délimitation des données utilisateur + sanitisation des balises de protocole.
- Limites de taille des requêtes (128 Ko), validation des entrées (Zod) côté client **et** serveur.
- Erreurs sans fuite d'informations sensibles ; isolation des conversations entre comptes vérifiée systématiquement.

## Mode démo

Deux modes démo indépendants, **toujours signalés** dans l'interface (badge « Mode démo ») :

- **Authentification démo** : compte fictif (aucun lien avec Roblox), données réelles persistées mais clairement identifiées (`isDemo`).
- **IA démo** : si aucun fournisseur IA n'aboutit, réponses de secours structurées — sans jamais prétendre qu'une IA a réellement répondu.

## Scripts disponibles

```bash
bun run dev          # Serveur de développement (port 3000)
bun run lint         # ESLint
bun run db:push      # Synchronise le schéma Prisma
bun run db:generate  # Régénère le client Prisma
bun run db:migrate   # Migrations formelles (production)
```

---

Luna AI est un projet indépendant, non affilié à Roblox Corporation.
