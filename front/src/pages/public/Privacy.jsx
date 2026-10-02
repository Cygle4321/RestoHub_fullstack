import { Link } from "react-router-dom";
import { UtensilsCrossed, ArrowLeft } from "lucide-react";

export default function Privacy() {
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Politique de Confidentialité</h1>
          <p className="mt-2 text-sm text-zinc-500">Dernière mise à jour : 1er octobre 2026</p>

          <div className="prose prose-zinc mt-8 max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-h2:text-xl prose-h3:text-lg prose-p:leading-relaxed prose-li:leading-relaxed">

            <h2>1. Introduction</h2>
            <p>
              La société RestoHub SAS (ci-après « RestoHub », « nous ») s'engage à protéger la vie privée de ses utilisateurs. La présente Politique de Confidentialité décrit comment nous collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous utilisez notre plateforme.
            </p>
            <p>
              Cette politique s'applique à tous les utilisateurs de la plateforme RestoHub : propriétaires de restaurants, membres d'équipe, administrateurs et clients finaux qui passent commande via les boutiques hébergées.
            </p>

            <h2>2. Données collectées</h2>
            <h3>2.1 Données fournies par l'Utilisateur</h3>
            <ul>
              <li><strong>Données d'identification :</strong> nom, prénom, adresse email, numéro de téléphone</li>
              <li><strong>Données du restaurant :</strong> nom commercial, adresse, description, logo, horaires d'ouverture, couleur de personnalisation</li>
              <li><strong>Données des produits :</strong> noms, descriptions, prix, photos des plats et boissons</li>
              <li><strong>Données de commande :</strong> contenu de la commande, adresse de livraison, mode de paiement choisi</li>
              <li><strong>Données de paiement :</strong> les transactions sont traitées par notre partenaire FedaPay. RestoHub ne stocke pas directement les données de carte bancaire ou de compte Mobile Money</li>
            </ul>

            <h3>2.2 Données collectées automatiquement</h3>
            <ul>
              <li><strong>Données de connexion :</strong> adresse IP, type de navigateur, système d'exploitation, pages visitées</li>
              <li><strong>Données d'utilisation :</strong> actions effectuées sur la plateforme (création de produits, gestion de commandes), horodatage</li>
              <li><strong>Cookies :</strong> cookies techniques nécessaires au fonctionnement de la plateforme (authentification, préférences de session)</li>
            </ul>

            <h2>3. Finalités du traitement</h2>
            <p>Vos données personnelles sont traitées pour les finalités suivantes :</p>
            <ul>
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Fourniture des services de la plateforme (boutique en ligne, commandes, paiements)</li>
              <li>Communication relative à votre compte (vérification d'email, notifications de commandes, alertes)</li>
              <li>Facturation et gestion des abonnements</li>
              <li>Amélioration de la plateforme et statistiques d'usage (données anonymisées)</li>
              <li>Support client et résolution de problèmes techniques</li>
              <li>Respect de nos obligations légales et réglementaires</li>
            </ul>

            <h2>4. Base légale du traitement</h2>
            <p>Le traitement de vos données repose sur :</p>
            <ul>
              <li><strong>L'exécution du contrat :</strong> les données nécessaires à la fourniture du service (compte, commandes, paiements)</li>
              <li><strong>Le consentement :</strong> pour les communications marketing optionnelles</li>
              <li><strong>L'intérêt légitime :</strong> pour l'amélioration de la plateforme et la sécurité</li>
              <li><strong>L'obligation légale :</strong> pour la conservation des données de facturation</li>
            </ul>

            <h2>5. Partage des données</h2>
            <p>Vos données personnelles ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :</p>
            <ul>
              <li><strong>FedaPay :</strong> notre prestataire de paiement, pour le traitement sécurisé des transactions</li>
              <li><strong>Hébergeur :</strong> nos serveurs sont hébergés de manière sécurisée avec des mesures de protection appropriées</li>
              <li><strong>Autorités compétentes :</strong> en cas d'obligation légale ou de réquisition judiciaire</li>
            </ul>
            <p>
              Entre restaurants et clients finaux : les données de commande (nom, téléphone, adresse de livraison) sont transmises au restaurant concerné pour l'exécution de la commande. Le restaurant s'engage à les utiliser exclusivement à cette fin.
            </p>

            <h2>6. Durée de conservation</h2>
            <ul>
              <li><strong>Données de compte :</strong> conservées pendant toute la durée d'utilisation du service, puis 3 ans après la suppression du compte</li>
              <li><strong>Données de commande :</strong> conservées 5 ans à des fins comptables et fiscales</li>
              <li><strong>Données de paiement :</strong> conservées par FedaPay selon leur propre politique de conservation</li>
              <li><strong>Logs de connexion :</strong> conservés 12 mois</li>
            </ul>

            <h2>7. Sécurité des données</h2>
            <p>RestoHub met en œuvre des mesures de sécurité appropriées pour protéger vos données :</p>
            <ul>
              <li>Chiffrement des communications (HTTPS/TLS)</li>
              <li>Hachage des mots de passe (bcrypt)</li>
              <li>Authentification par token sécurisé (Sanctum)</li>
              <li>Authentification à deux facteurs (2FA) optionnelle</li>
              <li>Accès restreint aux données selon les rôles (propriétaire, staff, admin)</li>
              <li>Sauvegardes régulières de la base de données</li>
            </ul>

            <h2>8. Vos droits</h2>
            <p>Conformément à la réglementation applicable, vous disposez des droits suivants :</p>
            <ul>
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit de suppression :</strong> demander la suppression de vos données (sous réserve des obligations légales de conservation)</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données pour des motifs légitimes</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré et lisible</li>
              <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment pour les traitements basés sur celui-ci</li>
            </ul>
            <p>
              Pour exercer ces droits, contactez-nous via le support intégré dans votre espace ou par email à : <strong>privacy@restohub.com</strong>
            </p>

            <h2>9. Cookies</h2>
            <p>
              La Plateforme utilise uniquement des cookies techniques strictement nécessaires au fonctionnement du service (token d'authentification, préférences de session). Aucun cookie publicitaire ou de traçage tiers n'est utilisé.
            </p>

            <h2>10. Données des clients finaux</h2>
            <p>
              Lorsqu'un client final passe commande via la boutique d'un Restaurant, RestoHub agit en tant que sous-traitant pour le compte du Restaurant (responsable de traitement). Le Restaurant est tenu d'informer ses clients de l'utilisation de la plateforme RestoHub et de respecter la réglementation en matière de protection des données.
            </p>

            <h2>11. Transferts internationaux</h2>
            <p>
              Vos données sont hébergées et traitées principalement en Afrique de l'Ouest. En cas de transfert vers un pays tiers, des garanties appropriées seront mises en place conformément à la réglementation applicable.
            </p>

            <h2>12. Modifications</h2>
            <p>
              Nous nous réservons le droit de modifier la présente Politique de Confidentialité. Toute modification significative sera notifiée par email ou notification in-app. La date de dernière mise à jour est indiquée en haut de cette page.
            </p>

            <h2>13. Contact</h2>
            <p>
              Pour toute question relative à la protection de vos données personnelles, vous pouvez nous contacter :
            </p>
            <ul>
              <li>Par email : <strong>privacy@restohub.com</strong></li>
              <li>Via le support intégré dans votre espace RestoHub</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
