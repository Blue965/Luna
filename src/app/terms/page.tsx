import type { Metadata } from "next";
import { LegalPage, LegalNote, LegalSection } from "@/components/luna/legal-page";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Luna AI",
  description:
    "Conditions d'utilisation de Luna AI : compte Roblox, règles d'usage acceptable, nature du contenu généré par IA et responsabilités.",
};

export default function TermsPage() {
  return (
    <LegalPage title="Conditions d'utilisation" updated="10 novembre 2026">
      <LegalNote>
        En résumé : Luna AI est un outil d&apos;aide au développement pour Roblox Studio. Tu restes
        responsable du code que tu publies — relis et teste toujours les scripts avant de les
        mettre en production. Interdiction d&apos;utiliser Luna AI pour créer des exploits ou des
        codes malveillants.
      </LegalNote>

      <LegalSection number="1." title="Le service">
        <p>
          Luna AI est un copilote technique destiné aux développeurs Roblox Studio. Il propose trois
          assistants : l&apos;<strong className="font-medium text-zinc-300">Atelier Luau</strong>{" "}
          (génération de scripts), la{" "}
          <strong className="font-medium text-zinc-300">Clinique du Code</strong> (diagnostic et
          correction d&apos;erreurs) et{" "}
          <strong className="font-medium text-zinc-300">Économie &amp; Gameplay</strong>{" "}
          (conseil en conception de mécaniques). Luna AI n&apos;est pas affiliée à Roblox
          Corporation ; Roblox, Roblox Studio et Luau sont des marques de Roblox Corporation.
        </p>
        <p>
          Le projet est publié en open source sur{" "}
          <a className="text-violet-400 underline underline-offset-2" href="https://github.com/Blue965/Luna" target="_blank" rel="noreferrer noopener">github.com/Blue965/Luna</a>.
        </p>
      </LegalSection>

      <LegalSection number="2." title="Acceptation">
        <p>
          En créant un compte ou en utilisant Luna AI, tu acceptes les présentes conditions. Si tu
          ne les acceptes pas, n&apos;utilise pas le service. Tu dois avoir au moins 13 ans pour
          utiliser Luna AI, conformément aux règles d&apos;autorisation des applications OAuth de
          Roblox.
        </p>
      </LegalSection>

      <LegalSection number="3." title="Compte et connexion">
        <p>
          La connexion s&apos;effectue exclusivement via « Se connecter avec Roblox » (OAuth 2.0 /
          OpenID Connect). Tu restes responsable de la sécurité de ton compte Roblox et de ton
          environnement de navigation. Le partage de compte ou l&apos;accès automatisé massif au
          service est interdit. Tu peux supprimer ton compte et tes données à tout moment depuis
          la page Paramètres.
        </p>
      </LegalSection>

      <LegalSection number="4." title="Utilisation acceptable">
        <p>Tu t&apos;engages à ne pas utiliser Luna AI pour :</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            créer, distribuer ou améliorer des{" "}
            <strong className="font-medium text-zinc-300">exploits, cheats, scripts malveillants</strong>{" "}
            ou tout code visant à contourner les protections de jeux ou de plateformes ;
          </li>
          <li>
            enfreindre les conditions d&apos;utilisation de Roblox, d&apos;OpenRouter ou de tout
            autre service tiers ;
          </li>
          <li>
            abuser du service : contournement des limites de débit, accès automatisé non autorisé,
            tentative d&apos;accès aux données d&apos;autres comptes ;
          </li>
          <li>
            revendre ou exploiter commercialement l&apos;accès au service sans autorisation
            préalable écrite.
          </li>
        </ul>
        <p>
          Si tu utilises ta propre clé OpenRouter (BYOK), tu en restes l&apos;unique responsable :
          son usage est soumis aux conditions d&apos;OpenRouter, et tu t&apos;engages à ne pas
          l&apos;utiliser depuis Luna AI à des fins interdites par ses conditions.
        </p>
      </LegalSection>

      <LegalSection number="5." title="Nature du contenu généré">
        <p>
          Les réponses de Luna AI sont produites par un modèle d&apos;intelligence artificielle.
          Elles sont fournies <strong className="font-medium text-zinc-300">à titre indicatif</strong> :
          Luna AI ne prétend jamais avoir testé un script dans Roblox Studio, n&apos;invente pas
          d&apos;API Roblox volontairement, mais peut se tromper.
        </p>
        <p>
          <strong className="font-medium text-zinc-300">Tu restes l&apos;unique responsable</strong>{" "}
          du code que tu implémentes et publies : relis-le, teste-le dans Studio et vérifie sa
          sécurité avant toute mise en production. Luna AI décline toute responsabilité quant aux
          conséquences de l&apos;utilisation directe du contenu généré.
        </p>
      </LegalSection>

      <LegalSection number="6." title="Propriété intellectuelle">
        <p>
          Tu conserves l&apos;intégralité des droits sur le contenu que tu envoies et sur les
          systèmes que tu construis avec Luna AI. Le code source de la plateforme est publié sous
          la licence indiquée dans son dépôt GitHub. Les données de ton historique t&apos;appartiennent
          et sont isolées des autres comptes.
        </p>
      </LegalSection>

      <LegalSection number="7." title="Disponibilité et évolutions">
        <p>
          Le service est fourni « en l&apos;état » et « selon disponibilité », sans garantie
          d&apos;ininterromption ni d&apos;exactitude. Nous pouvons le faire évoluer —
          fonctionnalités, limites, modèles — et suspendre temporairement l&apos;accès pour
          maintenance, sécurité ou raison technique, sans préavis.
        </p>
      </LegalSection>

      <LegalSection number="8." title="Suspension et résiliation">
        <p>
          Tu peux cesser d&apos;utiliser Luna AI et supprimer ton compte à tout moment. En cas de
          violation de ces conditions — notamment d&apos;utilisation abusive ou malveillante —
          l&apos;accès au service peut être limité ou suspendu.
        </p>
      </LegalSection>

      <LegalSection number="9." title="Limitation de responsabilité">
        <p>
          Dans la mesure permise par la loi applicable, Luna AI, ses auteurs et ses hébergeurs ne
          sauraient être tenus responsables des dommages indirects, pertes de données ou pertes
          d&apos;opportunités résultant de l&apos;usage du service ou du contenu généré. Rien dans
          ces conditions ne limite les responsabilités qui ne peuvent l&apos;être légalement.
        </p>
      </LegalSection>

      <LegalSection number="10." title="Modifications et contact">
        <p>
          Les présentes conditions peuvent évoluer avec le service ; la date en haut de page
          indique la version en vigueur. L&apos;utilisation continue du service après publication
          d&apos;une nouvelle version vaut acceptation. Pour toute question :{" "}
          <a className="text-violet-400 underline underline-offset-2" href="https://github.com/Blue965/Luna" target="_blank" rel="noreferrer noopener">github.com/Blue965/Luna</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
