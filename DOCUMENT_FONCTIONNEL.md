# RestoHub — Document Fonctionnel

## 1. Présentation du projet

**RestoHub** est une plateforme SaaS (Software as a Service) destinée aux professionnels de la restauration en Afrique de l'Ouest. Elle permet à tout restaurant de créer sa propre boutique en ligne, recevoir des commandes, gérer les paiements et piloter son activité — le tout sans compétences techniques.

### Stack technique
| Couche | Technologies |
|--------|-------------|
| **Frontend** | React 18 + Vite, Tailwind CSS v4, React Router v6 |
| **Backend** | Laravel 12 (PHP 8.2), Sanctum (auth token) |
| **Base de données** | PostgreSQL |
| **Paiements** | FedaPay (Mobile Money, carte bancaire) |
| **Hébergement** | Serveur dédié (Gleeze) |

---

## 2. Architecture fonctionnelle

```
┌──────────────────────────────────────────────────────────────┐
│                      RESTOHUB SAAS                          │
├──────────────┬───────────────────┬───────────────────────────┤
│  Landing     │  Espace Owner     │  Espace Super Admin       │
│  (public)    │  (dashboard)      │  (admin)                  │
├──────────────┼───────────────────┼───────────────────────────┤
│ - Accueil    │ - Dashboard KPIs  │ - Pilotage plateforme     │
│ - Tarifs     │ - Commandes       │ - Gestion restaurants     │
│ - Inscription│ - Cuisine live    │ - Abonnements & paiements │
│ - Connexion  │ - Produits        │ - Utilisateurs            │
│              │ - Catégories      │ - Toutes les commandes    │
│  Boutique    │ - Clients         │ - Statistiques globales   │
│  (store)     │ - Livraison       │ - Support                 │
│ - Menu       │ - Promotions      │ - Paramètres              │
│ - Panier     │ - Statistiques    │                           │
│ - Checkout   │ - Ma boutique     │                           │
│ - Suivi CMD  │ - QR Code         │                           │
│              │ - Abonnement      │                           │
│              │ - Support         │                           │
│              │ - Paramètres      │                           │
└──────────────┴───────────────────┴───────────────────────────┘
```

---

## 3. Rôles et permissions

| Rôle | Accès | Description |
|------|-------|-------------|
| **super_admin** | `/admin/*` | Pilotage global de la plateforme RestoHub |
| **owner** | `/dashboard/*` | Propriétaire d'un restaurant, accès complet à son espace |
| **staff** | `/dashboard/*` | Membre d'équipe, accès limité selon configuration |
| **Client final** | `/store/*` | Visiteur de la boutique, passe commande sans compte |

---

## 4. Modules fonctionnels détaillés

### 4.1 Module Authentification
- **Inscription** : nom restaurant + propriétaire + email + mot de passe
- **Connexion** : email + mot de passe, avec option "Mot de passe oublié"
- **2FA** : authentification à deux facteurs optionnelle (code 6 chiffres par email)
- **Vérification email** : lien de confirmation envoyé à l'inscription
- **Réinitialisation** : flux complet forgot → reset avec token sécurisé

### 4.2 Module Onboarding
Après inscription, un assistant de configuration guide le propriétaire :
1. Informations du restaurant (nom, adresse, description, téléphone)
2. Personnalisation visuelle (logo, bannière, couleur d'accent)
3. Horaires d'ouverture (par jour de la semaine)
4. Première catégorie et premier produit

### 4.3 Module Dashboard (KPIs)
Le tableau de bord affiche en temps réel :
- **Chiffre d'affaires** du jour, de la semaine, du mois
- **Nombre de commandes** avec variation par rapport à la période précédente
- **Commandes en cours** (nouvelle → en préparation → prête → en livraison)
- **Top 5 produits** les plus vendus
- **Graphique d'évolution** des ventes sur 7/30 jours
- **Note moyenne** des avis clients

### 4.4 Module Commandes
#### Cycle de vie d'une commande
```
nouvelle → confirmée → en_preparation → prête → en_livraison → livrée
                                                                  ↓
                                                               annulée
```

#### Fonctionnalités
- Liste paginée avec filtres : statut, mode (livraison/retrait), date, recherche
- Détail complet : articles, historique de statuts, infos client, paiement
- Changement de statut en 1 clic avec historique horodaté
- Export CSV des commandes filtrées
- Auto-refresh toutes les 20 secondes
- Notifications temps réel (nouvelle commande, annulation)

### 4.5 Module Cuisine (Vue temps réel)
- Vue Kanban des commandes actives par statut
- Passage rapide d'un statut au suivant
- Son de notification pour les nouvelles commandes
- Optimisé pour tablette en cuisine

### 4.6 Module Produits
- CRUD complet : nom, description, prix, photo, catégorie
- Activation/désactivation de la disponibilité
- Marquage "produit vedette" (featured)
- Upload d'image avec prévisualisation
- Tri et recherche

### 4.7 Module Catégories
- CRUD avec tri par drag & drop (sort_order)
- Activation/désactivation
- Compteur de produits par catégorie

### 4.8 Module Clients
- Liste des clients avec historique de commandes
- Compteur automatique : nombre de commandes, montant total dépensé
- Fiche client détaillée avec timeline des commandes
- Contact direct via WhatsApp

### 4.9 Module Livraison
- **Zones de livraison** : nom, frais de livraison, délai estimé, activation
- **Livreurs** : nom, téléphone, véhicule, statut (disponible/en course/indisponible)
- Attribution d'un livreur à une commande

### 4.10 Module Promotions
- Création de codes promo : pourcentage, montant fixe, livraison gratuite
- Paramètres : montant minimum de commande, limite d'utilisation, dates de validité
- Suivi en temps réel : nombre d'utilisations, taux d'utilisation
- Activation/désactivation

### 4.11 Module Statistiques
- Chiffre d'affaires par période (jour, semaine, mois)
- Évolution graphique des ventes
- Répartition par mode de paiement
- Top produits vendus
- Nombre de nouveaux clients
- Taux de commandes livrées vs annulées

### 4.12 Module Boutique en ligne (Store)
#### Côté propriétaire
- Personnalisation : logo, bannière, couleur d'accent, description, horaires
- Prévisualisation de la boutique
- Génération de QR Code unique vers la boutique

#### Côté client final
- Page d'accueil avec bannière et produits vedettes
- Menu complet avec filtrage par catégorie et recherche
- Fiche produit détaillée
- Panier avec gestion des quantités
- Checkout : infos client → choix mode (livraison/retrait) → zone → paiement
- Paiement intégré via FedaPay (Mobile Money)
- Page de confirmation avec récapitulatif
- Suivi de commande en temps réel avec barre de progression

### 4.13 Module Abonnement & Facturation
#### Plans disponibles
| Plan | Prix mensuel | Prix annuel | Produits max | Commandes/mois |
|------|-------------|-------------|-------------|----------------|
| **Starter** | 10 000 FCFA | 100 000 FCFA | 50 | 300 |
| **Business** | 25 000 FCFA | 250 000 FCFA | 200 | 2 000 |
| **Premium** | 50 000 FCFA | 500 000 FCFA | Illimité | Illimité |

#### Fonctionnalités
- Souscription et paiement en ligne (FedaPay)
- Cycle mensuel ou annuel
- Période d'essai gratuite à l'inscription
- Historique des paiements
- Changement de plan à tout moment

### 4.14 Module Support
- Système de tickets intégré (chat-like)
- Conversation bidirectionnelle propriétaire ↔ équipe RestoHub
- Notifications de nouvelles réponses
- Historique complet des échanges

### 4.15 Module Paramètres
- **Profil** : nom, email, avatar, mot de passe
- **Sécurité** : activation/désactivation 2FA
- **Notifications** : préférences par type (commandes, support, alertes)
- **Restaurant** : informations, ouverture/fermeture de la boutique

### 4.16 Module Notifications
- Panneau de notifications en temps réel (cloche dans le header)
- Types : nouvelle commande, annulation, réponse support, alertes admin
- Marquage lu/non-lu
- Badge compteur de notifications non-lues

---

## 5. Module Super Admin

### 5.1 Dashboard Admin
- KPIs globaux : restaurants actifs, revenus plateforme, commandes totales
- Répartition des abonnements par plan
- Graphique d'évolution mensuelle

### 5.2 Gestion Restaurants
- Liste de tous les restaurants avec statut, plan, date de création
- Fiche détaillée : infos, propriétaire, statistiques, abonnement
- Actions : activer/désactiver, contacter le propriétaire

### 5.3 Gestion Abonnements & Paiements
- Liste des abonnements actifs, expirés, en attente
- Historique de tous les paiements de la plateforme

### 5.4 Gestion Utilisateurs
- Liste de tous les utilisateurs avec rôle et statut
- Actions : activer/désactiver un compte

### 5.5 Support Admin
- Vue unifiée de tous les tickets de support
- Réponse directe aux propriétaires depuis l'interface admin

---

## 6. Intégrations

### 6.1 FedaPay (Paiements)
- **Environnement** : Sandbox (test) et Production
- **Flux** : Création de transaction → Redirection client → Callback de confirmation
- **Méthodes** : Mobile Money (MTN, Moov, Orange), Carte bancaire
- Configuration via variables d'environnement (`FEDAPAY_SECRET_KEY`, `FEDAPAY_PUBLIC_KEY`)

### 6.2 WhatsApp
- Lien direct vers WhatsApp avec message pré-rempli (récapitulatif commande)
- Accessible depuis la fiche commande et la fiche client

### 6.3 QR Code
- Génération côté client (JavaScript) d'un QR code unique
- Pointe vers l'URL publique de la boutique (`/store/{slug}`)
- Téléchargeable en image PNG

---

## 7. Sécurité

| Mesure | Implémentation |
|--------|---------------|
| Authentification | Token Sanctum (Bearer) |
| Mots de passe | Hachage bcrypt |
| 2FA | Code 6 chiffres par email |
| CORS | Configuré pour le domaine frontend uniquement |
| CSRF | Protection via Sanctum |
| Rôles | Middleware `EnsureRole` (super_admin, owner, staff) |
| Accès restaurant | Middleware `EnsureRestaurantAccess` |
| Abonnement | Middleware `EnsureSubscription` |
| HTTPS | Forcé en production |

---

## 8. Accessibilité (RGAA / WCAG 2.1 AA)

- Contraste minimum 4.5:1 pour tout texte interactif
- Palette de couleurs vérifiée (primary-600 : 4.8:1 ✅)
- Focus visible sur tous les éléments interactifs (ring-2)
- Labels et attributs ARIA sur les formulaires
- Structure sémantique HTML5 (nav, main, header, footer)
- Navigation au clavier fonctionnelle

---

## 9. Données de démonstration (Seeder)

Le seeder génère un environnement de démo complet :
- 3 plans d'abonnement (Starter, Business, Premium)
- 1 restaurant « Le Saveur d'Or » avec abonnement Business actif
- 2 utilisateurs : Super Admin + Owner
- 5 catégories, 13 produits
- 15 clients avec adresses variées
- 5 zones de livraison (Cocody → Abobo)
- 3 livreurs
- 3 codes promo (PROMO10, WELCOME5, LIVRAISON)
- ~65 commandes historiques sur 30 jours
- 5 commandes en cours (dashboard vivant)
- ~35 avis clients (notes 3-5)
- Paiements FedaPay associés

**Identifiants démo :**
```
Owner  : owner@lesaveurdor.com / password
Admin  : admin@restohub.com / password
```

---

## 10. URLs et routing

### Pages publiques
| URL | Page |
|-----|------|
| `/` | Landing page |
| `/login` | Connexion |
| `/register` | Inscription |
| `/forgot-password` | Mot de passe oublié |
| `/reset-password` | Réinitialisation mot de passe |
| `/terms` | Conditions d'utilisation |
| `/privacy` | Politique de confidentialité |

### Boutique publique
| URL | Page |
|-----|------|
| `/store` | Boutique par défaut |
| `/store/:slug` | Boutique d'un restaurant spécifique |
| `/store/:slug/menu` | Menu complet |
| `/store/:slug/product/:id` | Fiche produit |
| `/store/:slug/cart` | Panier |
| `/store/:slug/checkout` | Paiement |
| `/store/:slug/confirmation` | Confirmation de commande |
| `/store/:slug/track` | Suivi de commande |

### Dashboard propriétaire
| URL | Page |
|-----|------|
| `/dashboard` | Tableau de bord |
| `/dashboard/orders` | Liste des commandes |
| `/dashboard/orders/:id` | Détail d'une commande |
| `/dashboard/kitchen` | Vue cuisine |
| `/dashboard/products` | Gestion produits |
| `/dashboard/categories` | Gestion catégories |
| `/dashboard/customers` | Gestion clients |
| `/dashboard/delivery` | Livraison & zones |
| `/dashboard/promotions` | Codes promo |
| `/dashboard/analytics` | Statistiques |
| `/dashboard/shop` | Paramètres boutique |
| `/dashboard/qrcode` | QR Code |
| `/dashboard/billing` | Abonnement & facturation |
| `/dashboard/support` | Support |
| `/dashboard/settings` | Paramètres compte |

### Admin
| URL | Page |
|-----|------|
| `/admin` | Dashboard admin |
| `/admin/restaurants` | Gestion restaurants |
| `/admin/subscriptions` | Abonnements |
| `/admin/payments` | Paiements |
| `/admin/users` | Utilisateurs |
| `/admin/orders` | Commandes globales |
| `/admin/analytics` | Statistiques |
| `/admin/support` | Support |
| `/admin/settings` | Paramètres |
