# RestoHub — Restaurant SaaS

Plateforme SaaS multi-tenant pour restaurants : boutique en ligne, gestion des commandes, super-admin, abonnements SaaS et paiements **FedaPay**.

```
restaurant-saas/
├── front/          # React + Vite + Tailwind (React Router v7, lazy loading)
├── back/           # Laravel 13 API + Sanctum + FedaPay + queues database
└── README.md
```

---

## Prérequis

- Node.js 20+
- PHP 8.3+
- Composer
- MySQL ou PostgreSQL (recommandé)

---

## 1. Backend (`back/`)

```bash
cd back
composer install --ignore-platform-reqs
cp .env.example .env
php artisan key:generate
```

Configurer la base et les clés dans `back/.env` :

```env
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=restohub
DB_USERNAME=postgres
DB_PASSWORD=1234

# Mails — dev avec Mailtrap (les emails partent en file d'attente)
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=ton_user_mailtrap
MAIL_PASSWORD=ton_mot_de_passe_mailtrap
MAIL_FROM_ADDRESS="no-reply@restohub.com"
MAIL_FROM_NAME="${APP_NAME}"

# Sessions / files d'attente (database)
SESSION_DRIVER=database
QUEUE_CONNECTION=database
CACHE_STORE=database

# Tokens Sanctum : expiration après 720 min (12 h)
SANCTUM_TOKEN_EXPIRATION=720

# FedaPay — mets TES clés ici
FEDAPAY_ENVIRONMENT=sandbox
FEDAPAY_SECRET_KEY=
FEDAPAY_PUBLIC_KEY=
FEDAPAY_WEBHOOK_SECRET=
FEDAPAY_CURRENCY=XOF
FEDAPAY_CALLBACK_URL="${APP_URL}/api/webhooks/fedapay"
FEDAPAY_RETURN_URL="${FRONTEND_URL}/store/confirmation"
```

Puis :

```bash
php artisan migrate --seed
php artisan storage:link        # exposé les images stockées (/storage)
php artisan serve               # → http://localhost:8000
php artisan queue:work          # traite les emails en arrière-plan (important !)
```

API : `http://localhost:8000/api` — fichiers d'images servis sur `http://localhost:8000/storage/...`

### Comptes de démo (après seed)

| Rôle | Email | Mot de passe | Espace |
|------|-------|--------------|--------|
| Super Admin | `admin@restohub.com` | `password` | `/admin` |
| Owner restaurant | `owner@lesaveurdor.com` | `password` | `/dashboard` |

Boutique publique : slug `le-saveur-dor` → front `/store`

---

## 2. Frontend (`front/`)

```bash
cd front
cp .env.example .env
npm install
npm run dev
# → http://localhost:5173
```

`front/.env` :

```env
VITE_API_URL=http://localhost:8000/api
VITE_STORE_SLUG=le-saveur-dor
VITE_USE_MOCK=false
```

Si l'API est arrêtée, le front bascule automatiquement sur des données mock pour le développement.

---

## Architecture

### Front (`front/src`)

| Dossier | Rôle |
|---------|------|
| `api/` | Clients API par domaine (`auth`, `restaurant`, `store`, `admin`) |
| `lib/` | `apiClient` (erreurs normalisées), mappers, **`documents.js`** (PDF personnalisés) |
| `context/` | Auth (Sanctum token) |
| `pages/` | Landing, dashboard resto, boutique, super-admin |
| `layouts/` | Sidebars dashboard / admin / store |
| `components/` | UI kit, `ProtectedRoute`, `ConfirmDialog`, `EmailVerificationBanner` |

Les routes sont chargées en **lazy loading** (`React.lazy` + `Suspense`) : chaque page est un chunk séparé.

### Back (`back/app`)

| Dossier | Rôle |
|---------|------|
| `Http/Controllers/Api/Auth` | Register, login, me, logout, vérification d'email |
| `Http/Controllers/Api/Restaurant` | Dashboard owner, commandes, produits, abonnements… |
| `Http/Controllers/Api/Store` | Boutique publique + checkout |
| `Http/Controllers/Api/Admin` | Super admin plateforme |
| `Http/Controllers/Api/Webhook` | Webhook FedaPay (signé HMAC) |
| `Services/ImageStorage.php` | Stockage des images en fichiers (plus de base64 en DB) |
| `Services/FedaPayService.php` | Paiements commandes + abonnements |
| `Rules/ValidImageDataUri.php` | Validation réelle des images (type + taille) |
| `Console/Commands/` | `restohub:reminders`, `restohub:trial-reminders`, `restohub:images-migrate` |
| `Notifications/` | Notifications **en file d'attente** (`ShouldQueue`) |
| `Models/` | User, Restaurant, Order, Product, Plan, Subscription… |

---

## Fonctionnalités

- **Auth** multi-rôles : `super_admin`, `owner`, `staff`, `customer` + **vérification d'email obligatoire**
- **2FA** (TOTP), reset de mot de passe, sessions révocables
- **Dashboard restaurant** : CA, commandes, clients, panier moyen, graphiques
- **Commandes** : statuts, historique, détail, reçu / facture PDF personnalisée
- **Catalogue** : catégories, produits, dispo, vedettes, images stockées en fichiers
- **Clients, livraison (zones + livreurs), promotions, équipe, support**
- **Boutique publique** mobile-first + panier + checkout + suivi de commande
- **QR Code du menu** avec téléchargement PDF personnalisé
- **Paiements FedaPay** (commandes + abonnements SaaS)
- **Super Admin** : restaurants, plans, abonnements, paiements, users, support

---

## Abonnements & restrictions

- Inscription → essai gratuit de **14 jours** (`trial_ends_at`) sur le plan Starter.
- **Limites par formule** appliquées côté serveur :
  - `max_products` : création de produit bloquée (422) au-delà du quota ;
  - `max_orders_month` : checkout bloqué (422) au-delà du quota mensuel.
- **Après l'essai sans paiement**, le restaurant est restreint (middleware `subscription`) :
  - lecture du dashboard conservée,
  - **écritures bloquées** (produits, commandes, promos, livraison, réglages…) → `402` ;
  - le checkout public est coupé ;
  - seules `subscribe` et `subscription/cancel` restent possibles.
- **Relance par email** : `restohub:trial-reminders` (planifiée à 09:30) envoie un email de paiement au 13ᵉ jour / à l'expiration (une seule fois), et marque l'abonnement d'essai `expired`.
- **Changement de plan** par le propriétaire : l'abonnement actif précédent est clôturé, le « Plan actuel » se met à jour immédiatement. Le bouton « Annuler l'abonnement » est grisé si l'abonnement est payé.

---

## Paiements FedaPay

- **Commandes boutique** : le checkout (`POST /api/store/{slug}/checkout`) crée un paiement FedaPay et renvoie un `checkout_url` (paiement `pending`). Le client est redirigé vers la page FedaPay ; la confirmation se fait via le **webhook** (ou le retour GET) → paiement `approved` + commande `paid` + notification équipe + email client (`OrderConfirmationMail`).
- **Paiement en espèces** : approuvé immédiatement côté serveur (sans FedaPay).
- **Abonnements** : `POST /api/restaurant/subscribe` crée l'abonnement en `pending` (statut ajouté par la migration `add_pending_status_to_subscriptions`) puis un paiement FedaPay (`checkout_url`). À l'approbation via webhook : paiement `approved`, abonnement `active` (dates définies), **l'ancien abonnement actif est clôturé**, le plan du restaurant est mis à jour et les admins sont notifiés.
- **Webhook** : `POST /api/webhooks/fedapay` (signé HMAC-SHA256 si `FEDAPAY_WEBHOOK_SECRET` renseigné, sinon ignoré en dev) ; garde anti-doublon `wasPaid` pour ne notifier qu'une seule fois.
- **Sandbox** : clés pré-remplies dans `.env` (`FEDAPAY_ENVIRONMENT=sandbox`) — vérifier que le réseau atteint `sandbox-api.fedapay.com` (des timeouts réseau peuvent faire échouer la création de transaction).

---

## Emails

Tous les emails partent en **file d'attente** (`QUEUE_CONNECTION=database`) — penser à lancer `php artisan queue:work`.

| Email | Déclencheur | Cible |
|-------|-------------|-------|
| Vérification d'email | Inscription (route signée `/email/verify/{id}/{hash}`) | propriétaire |
| Lien de réinitialisation | Mot de passe oublié | propriétaire |
| Nouvelle commande | Checkout | équipe restaurant |
| Commandes annulées | Annulation | équipe restaurant |
| Réponse au ticket | Réponse du support | propriétaire |
| Alerte admin (restaurant / abonnement / ticket) | Événements plateforme | super admins |
| Relance d'essai (paiement) | `restohub:trial-reminders` | propriétaire |

Les **PDF personnalisés** (factures d'abonnement, reçus de commande, QR Code) sont générés côté front avec le design RestoHub (`front/src/lib/documents.js`).

---

## Sécurité

- **Rate limiting** : login / 2FA / reset 5/min, register 3/min, API globale 60/min (`throttle:*`).
- **Tokens Sanctum** avec expiration (12 h).
- **Webhook FedaPay** vérifié par **signature HMAC-SHA256** (401 si invalide).
- **Images** validées côté serveur : vrai type MIME (PNG/JPEG/WebP) + taille max 4 Mo (`ValidImageDataUri`), stockées en fichiers (pas de base64 en DB).
- **Emails de vérification** : route signée + throttle, comptes existants rétro-backfillés.
- CORS / `.env` hors versioning, `front/.gitignore` propre, logs sensibles évités.

---

## Performance

- **Images en fichiers** : les produits/restaurants/avatars ne stockent plus de base64 en base → listes très légères (`ImageStorage` + `php artisan storage:link`). Migration des données existantes : `php artisan restohub:images-migrate`.
- **Lazy loading frontend** : chunk principal ~300 kB (au lieu d'un gros bundle unique > 500 kB), pages chargées à la demande.
- **Emails asynchrones** : `ShouldQueue` sur toutes les notifications → les requêtes ne bloquent plus sur l'envoi.
- Commandes planifiées (scheduler) : rappel quotidien `restohub:reminders` (08:00) et relance d'essai `restohub:trial-reminders` (09:30).

---

## Scripts utiles

```bash
# Front
cd front && npm run dev
cd front && npm run build
cd front && npm run lint

# Back
cd back && php artisan serve
cd back && php artisan queue:work            # emails en arrière-plan
cd back && php artisan schedule:work         # crons locaux (rappel + relance)
cd back && php artisan migrate --seed
cd back && php artisan storage:link
cd back && php artisan restohub:images-migrate
cd back && php artisan route:list --path=api
cd back && php artisan schedule:list
```

---

## Licence

Projet privé — RestoHub.  0164000001 et 0166000001 fedapay