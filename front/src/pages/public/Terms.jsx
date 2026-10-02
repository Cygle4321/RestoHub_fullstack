import { Link } from "react-router-dom";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white">
              <UtensilsCrossed size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight text-zinc-900">RestoHub</span>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-zinc-900">
            <ArrowLeft size={16} /> Retour
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Conditions Générales d'Utilisation</h1>
          <p className="mt-2 text-sm text-zinc-500">Dernière mise à jour : 1er octobre 2026</p>

          <div className="prose prose-zinc mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:leading-relaxed">

            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions Générales d'Utilisation (ci-après « CGU ») ont pour objet de définir les modalités et conditions d'accès et d'utilisation de la plateforme <strong>RestoHub</strong> (ci-après « la Plateforme »), accessible à l'adresse <em>restohub.com</em>, éditée et opérée par la société RestoHub SAS.
            </p>
            <p>
              La Plateforme est un logiciel en tant que service (SaaS) qui permet aux professionnels de la restauration de créer et gérer une boutique en ligne, recevoir des commandes, gérer les paiements, suivre les livraisons et piloter leur activité.
            </p>

            <h2>2. Acceptation des CGU</h2>
            <p>
              L'inscription et l'utilisation de la Plateforme impliquent l'acceptation pleine et entière des présentes CGU. En cochant la case « J'accepte les conditions d'utilisation » lors de l'inscription, l'Utilisateur reconnaît avoir pris connaissance des présentes et les accepter sans réserve.
            </p>

            <h2>3. Définitions</h2>
            <ul>
              <li><strong>Utilisateur :</strong> toute personne physique ou morale qui crée un compte sur la Plateforme, qu'il soit propriétaire de restaurant, membre d'équipe ou administrateur.</li>
              <li><strong>Restaurant :</strong> l'établissement de restauration inscrit sur la Plateforme via un compte Utilisateur.</li>
              <li><strong>Client final :</strong> toute personne qui passe commande via la boutique en ligne d'un Restaurant.</li>
              <li><strong>Abonnement :</strong> formule payante souscrite par le Restaurant, donnant accès aux fonctionnalités de la Plateforme.</li>
            </ul>

            <h2>4. Inscription et compte</h2>
            <h3>4.1 Création de compte</h3>
            <p>
              L'inscription est gratuite et ouverte à tout professionnel de la restauration. L'Utilisateur s'engage à fournir des informations exactes, complètes et à jour. Chaque compte est personnel et ne peut être cédé ou partagé.
            </p>
            <h3>4.2 Sécurité du compte</h3>
            <p>
              L'Utilisateur est responsable de la confidentialité de ses identifiants de connexion. En cas de suspicion d'utilisation non autorisée, il doit en informer immédiatement RestoHub. La Plateforme propose une authentification à deux facteurs (2FA) pour renforcer la sécurité.
            </p>

            <h2>5. Services proposés</h2>
            <p>La Plateforme propose les services suivants :</p>
            <ul>
              <li>Création et personnalisation d'une boutique en ligne (nom, couleurs, logo, horaires)</li>
              <li>Gestion du catalogue de produits (catégories, prix, photos, disponibilité)</li>
              <li>Réception et gestion des commandes en temps réel</li>
              <li>Intégration de paiements en ligne (Mobile Money via FedaPay, paiement à la livraison)</li>
              <li>Gestion des livraisons (zones, frais, livreurs)</li>
              <li>Codes promotionnels et fidélisation client</li>
              <li>Statistiques et tableau de bord analytique</li>
              <li>Génération de QR Code pour accès rapide au menu digital</li>
              <li>Support client intégré</li>
            </ul>

            <h2>6. Abonnements et tarification</h2>
            <h3>6.1 Plans disponibles</h3>
            <p>
              La Plateforme propose plusieurs plans d'abonnement (Starter, Business, Premium) avec des fonctionnalités et limites variables. Les tarifs en vigueur sont affichés sur la page Tarifs de la Plateforme.
            </p>
            <h3>6.2 Période d'essai</h3>
            <p>
              Chaque nouveau Restaurant bénéficie d'une période d'essai gratuite à l'inscription. À l'issue de cette période, le Restaurant doit souscrire un abonnement payant pour continuer à utiliser les fonctionnalités d'écriture (création de commandes, modifications, etc.). L'accès en lecture (consultation du dashboard) reste disponible.
            </p>
            <h3>6.3 Paiement</h3>
            <p>
              Les paiements sont effectués via les moyens de paiement proposés sur la Plateforme (Mobile Money, carte bancaire). La facturation est mensuelle ou annuelle selon le choix de l'Utilisateur.
            </p>

            <h2>7. Obligations de l'Utilisateur</h2>
            <p>L'Utilisateur s'engage à :</p>
            <ul>
              <li>Utiliser la Plateforme conformément à sa destination et aux présentes CGU</li>
              <li>Ne pas publier de contenu illicite, trompeur ou portant atteinte aux droits de tiers</li>
              <li>Respecter la réglementation applicable en matière de restauration, d'hygiène alimentaire et de commerce en ligne</li>
              <li>Garantir l'exactitude des informations relatives à ses produits (prix, description, allergènes)</li>
              <li>Ne pas tenter de contourner les limitations techniques de son plan d'abonnement</li>
            </ul>

            <h2>8. Responsabilité</h2>
            <h3>8.1 Responsabilité de RestoHub</h3>
            <p>
              RestoHub s'engage à fournir un accès à la Plateforme dans les meilleures conditions. Toutefois, RestoHub ne saurait être tenu responsable des interruptions de service liées à des maintenances, pannes techniques ou cas de force majeure. La Plateforme est fournie « en l'état ».
            </p>
            <h3>8.2 Responsabilité de l'Utilisateur</h3>
            <p>
              Le Restaurant est seul responsable du contenu qu'il publie, de la qualité de ses produits, de la gestion de ses commandes et du respect des réglementations sanitaires et commerciales. RestoHub n'intervient pas dans la relation contractuelle entre le Restaurant et ses Clients finaux.
            </p>

            <h2>9. Propriété intellectuelle</h2>
            <p>
              La Plateforme, son interface, son code source, ses textes, graphismes et fonctionnalités sont la propriété exclusive de RestoHub. L'Utilisateur conserve la propriété de son contenu (photos, descriptions, logo) et accorde à RestoHub une licence limitée pour l'afficher sur la Plateforme.
            </p>

            <h2>10. Résiliation</h2>
            <p>
              L'Utilisateur peut résilier son compte à tout moment depuis les paramètres de son espace. RestoHub se réserve le droit de suspendre ou supprimer un compte en cas de violation des présentes CGU, après notification préalable lorsque possible.
            </p>

            <h2>11. Modification des CGU</h2>
            <p>
              RestoHub se réserve le droit de modifier les présentes CGU. Les Utilisateurs seront informés par email ou notification in-app. L'utilisation continue de la Plateforme après modification vaut acceptation des nouvelles CGU.
            </p>

            <h2>12. Droit applicable et juridiction</h2>
            <p>
              Les présentes CGU sont régies par le droit en vigueur en Côte d'Ivoire. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux compétents d'Abidjan seront seuls compétents.
            </p>

            <h2>13. Contact</h2>
            <p>
              Pour toute question relative aux présentes CGU, vous pouvez nous contacter via le support intégré dans votre espace ou par email à : <strong>support@restohub.com</strong>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
