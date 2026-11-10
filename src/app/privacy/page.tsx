import type { Metadata } from "next";
import { LegalPage, LegalNote, LegalSection } from "@/components/luna/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Luna AI",
  description:
    "Comment Luna AI collecte, utilise et protège tes données : profil Roblox, conversations, clé OpenRouter chiffrée et suppression du compte.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="10 novembre 2026">
      <LegalNote>
        Résumé en une phrase : Luna AI conserve le minimum nécessaire pour te connecter avec
        Roblox et sauvegarder ton travail — ta clé OpenRouter est chiffrée, n&apos;est jamais
        partagée, et tu peux tout supprimer en un clic.
      </LegalNote>

      <LegalSection number="1." title="Responsable et périmètre">
        <p>
          Luna AI est un assistant IA pour les développeurs Roblox Studio, publié en open source
          sur <a className="text-violet-400 underline underline-offset-2" href="https://github.com/Blue965/Luna" target="_blank" rel="noreferrer noopener">github.com/Blue965/Luna</a>.
          La présente politique décrit le traitement des données effectué par la plateforme Luna AI.
        </p>
        <p>
          Luna AI n&apos;est <strong className="font-medium text-zinc-300">pas affiliée à Roblox Corporation</strong>.
          Roblox, Roblox Studio et Luau sont des marques de Roblox Corporation. L&apos;authentification
          « Se connecter avec Roblox » est réalisée via le système officiel OAuth 2.0 / OpenID Connect
          de Roblox : nous ne voyons jamais ton mot de passe Roblox.
        </p>
      </LegalSection>

      <LegalSection number="2." title="Données collectées">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="font-medium text-zinc-300">Profil Roblox</strong> — identifiant
            numérique Roblox, nom d&apos;utilisateur, nom affiché et URL de l&apos;avatar, obtenus
            via les scopes <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">openid</code>{" "}
            et <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-[12px] text-zinc-300">profile</code> uniquement.
            Aucun autre accès à ton compte Roblox n&apos;est demandé.
          </li>
          <li>
            <strong className="font-medium text-zinc-300">Conversations</strong> — titre, messages
            que tu envoies et réponses générées, par assistant (Atelier Luau, Clinique du Code,
            Économie &amp; Gameplay). Elles alimentent uniquement ton historique personnel.
          </li>
          <li>
            <strong className="font-medium text-zinc-300">Paramètres</strong> — préférences
            d&apos;interface et modèle IA sélectionné.
          </li>
          <li>
            <strong className="font-medium text-zinc-300">Clé OpenRouter personnelle</strong> —
            uniquement si tu décides d&apos;en enregistrer une (voir section 4).
          </li>
          <li>
            <strong className="font-medium text-zinc-300">Données de sécurité minimales</strong> —
            cookie de session et compteurs de limitation de débit (anti-abus), conservés localement.
          </li>
        </ul>
        <p>
          Luna AI n&apos;utilise aucun traceur publicitaire ni outil d&apos;analyse tiers, et ne
          vend ni ne loue tes données.
        </p>
      </LegalSection>

      <LegalSection number="3." title="Finalités">
        <p>Les données collectées servent exclusivement à :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>te connecter et afficher ton profil Roblox ;</li>
          <li>conserver ton historique de conversations entre tes sessions ;</li>
          <li>faire fonctionner les trois assistants IA ;</li>
          <li>protéger le service contre les abus (limitation de débit, validation côté serveur).</li>
        </ul>
      </LegalSection>

      <LegalSection number="4." title="Ta clé OpenRouter (BYOK)">
        <p>
          Si tu enregistres ta propre clé OpenRouter gratuite dans Paramètres, elle est{" "}
          <strong className="font-medium text-zinc-300">chiffrée AES-256-GCM au repos</strong>{" "}
          avec une clé dérivée d&apos;un secret serveur, puis stockée en base dans sa forme
          chiffrée. Elle n&apos;est :
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>jamais renvoyée au navigateur — seul un indice des 4 derniers caractères est affiché ;</li>
          <li>utilisée uniquement pour adresser tes requêtes IA aux serveurs d&apos;OpenRouter ;</li>
          <li>jamais transmise à un autre tiers ;</li>
          <li>supprimée immédiatement et définitivement quand tu la retires.</li>
        </ul>
        <p>
          Quand tu utilises ton propre modèle via OpenRouter, les contenus de tes requêtes sont
          traités par OpenRouter selon sa propre politique de confidentialité. Tu peux à tout
          moment supprimer ta clé pour revenir au modèle intégré.
        </p>
      </LegalSection>

      <LegalSection number="5." title="Cookies">
        <p>
          Luna AI utilise un seul cookie : un cookie de session strictement nécessaire (HttpOnly,
          SameSite) qui identifie ta connexion après authentification. Il expire après 30 jours ou
          lors de ta déconnexion. Aucun cookie publicitaire ni de suivi n&apos;est posé.
        </p>
      </LegalSection>

      <LegalSection number="6." title="Conservation et suppression">
        <p>
          Tes données sont conservées tant que ton compte existe. Tu peux{" "}
          <strong className="font-medium text-zinc-300">supprimer ton compte et toutes tes
          données</strong> (profil, conversations, clé OpenRouter, paramètres) depuis la page{" "}
          <strong className="font-medium text-zinc-300">Paramètres</strong> — la suppression est
          immédiate et définitive. Tu peux également supprimer uniquement ta clé OpenRouter ou
          chaque conversation individuellement.
        </p>
      </LegalSection>

      <LegalSection number="7." title="Mineurs">
        <p>
          Le service s&apos;adresse aux développeurs de 13 ans et plus : Roblox exige un compte de
          13 ans ou plus pour autoriser une application OAuth. Nous ne collectons sciemment aucune
          donnée d&apos;enfants de moins de 13 ans.
        </p>
      </LegalSection>

      <LegalSection number="8." title="Sécurité">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Chiffrement authentifié (AES-256-GCM) des secrets utilisateur au repos ;</li>
          <li>Sessions serveur avec cookies HttpOnly / Secure / SameSite ;</li>
          <li>Validation stricte (schémas) de toutes les entrées, côté client et côté serveur ;</li>
          <li>
            Isolation stricte des données par compte : chaque utilisateur n&apos;accède qu&apos;à
            ses propres conversations et réglages ;
          </li>
          <li>Les instructions système des assistants sont exécutées uniquement côté serveur.</li>
        </ul>
      </LegalSection>

      <LegalSection number="9." title="Tes droits et contact">
        <p>
          Tu disposes des droits d&apos;accès, de rectification et de suppression de tes données.
          L&apos;accès et la suppression sont réalisables en autonomie depuis la page Paramètres.
          Pour toute autre demande relative à tes données, contacte-nous via le dépôt du projet :{" "}
          <a className="text-violet-400 underline underline-offset-2" href="https://github.com/Blue965/Luna" target="_blank" rel="noreferrer noopener">github.com/Blue965/Luna</a>.
        </p>
        <p>
          La présente politique peut être mise à jour pour refléter l&apos;évolution du service ;
          la date d&apos;entrée en vigueur en haut de page indique la dernière version.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
