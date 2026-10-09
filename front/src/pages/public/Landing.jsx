import { Link } from "react-router-dom";
import {
  UtensilsCrossed, ShoppingCart, CreditCard, Bike, QrCode, BarChart3,
  Check, Star, ArrowRight, Store, Menu, LayoutDashboard,
} from "lucide-react";
import { Button, Badge } from "../../components/ui";
import { plans, fmt } from "../../data/mock";
import { useAuth } from "../../context/AuthContext";
import SEO from "../../components/common/SEO";

const features = [
  { icon: Store, title: "Menu & Restaurant en ligne", text: "Votre menu interactif et vos commandes, personnalisables à vos couleurs, sans aucune ligne de code." },
  { icon: ShoppingCart, title: "Commandes en temps réel", text: "Recevez et gérez vos commandes en direct, du paiement jusqu'à la livraison." },
  { icon: CreditCard, title: "Paiements intégrés", text: "Mobile Money, carte bancaire ou paiement à la livraison, tout est automatisé." },
  { icon: Bike, title: "Livraisons & zones", text: "Définissez vos zones de livraison, vos frais et suivez vos livreurs en direct." },
  { icon: QrCode, title: "Menu digital & QR Code", text: "Votre menu accessible par un simple flash de QR code, à table ou à emporter." },
  { icon: BarChart3, title: "Statistiques avancées", text: "Ventes, produits stars, clients fidèles : pilotez votre activité avec des données claires." },
];

const steps = [
  { n: 1, title: "Créez votre restaurant", text: "Inscrivez-vous en 2 minutes et renseignez les informations de votre restaurant." },
  { n: 2, title: "Ajoutez votre menu", text: "Ajoutez vos plats, prix, photos et options en quelques clics." },
  { n: 3, title: "Recevez des commandes", text: "Partagez votre lien et votre QR code, et recevez vos premières commandes." },
];

const testimonials = [
  { name: "Awa Sanogo", role: "Pizza Mama", text: "Depuis RestoHub, nos commandes ont doublé. L'interface est simple et mes clients adorent commander en ligne." },
  { name: "Kenji Tanaka", role: "Sushi Express", text: "Le suivi des livraisons et les statistiques m'ont permis d'optimiser toute mon activité. Un vrai gain de temps." },
  { name: "Fatou Coulibaly", role: "Chez Fatou", text: "Le menu QR code est parfait pour ma salle. Mise en place ultra rapide, même sans compétences techniques." },
];

export default function Landing() {
  const { user } = useAuth();
  const dashboardPath = user?.role === "super_admin" ? "/admin" : "/dashboard";

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <SEO
        title="RestoHub — Solution SaaS pour Restaurants : Menus Digitaux & Commandes en Ligne"
        exactTitle
        description="Digitalisez votre restaurant en 5 minutes : menu digital interactif, QR code de table, commandes en direct, paiements Mobile Money et livraisons automatisées."
        keywords="restohub, saas restaurant, menu digital restaurant, menu qr code, commande restaurant afrique, livraison repas, fedapay"
        url="https://restohub.app/"
        type="website"
      />
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-white">
              <UtensilsCrossed size={20} />
            </span>
            <span className="text-lg font-bold tracking-tight">RestoHub</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
            <a href="#fonctionnalites" className="hover:text-zinc-900">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-zinc-900">Tarifs</a>
            <a href="#temoignages" className="hover:text-zinc-900">Témoignages</a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <Link to={dashboardPath}>
                <Button><LayoutDashboard size={16} /> Mon Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost">Se connecter</Button>
                </Link>
                <Link to="/register">
                  <Button className="px-3 text-sm sm:px-4">Créer mon restaurant</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-zinc-50/60">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <Badge variant="primary" dot>Nouvelle plateforme 2026</Badge>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Votre restaurant, <span className="text-primary-500">en ligne en 5 minutes</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-zinc-600">
              RestoHub vous donne un menu digital et un système de commande en ligne clé en main : commandes en temps réel,
              paiements Mobile Money, livraisons suivies et statistiques. Sans commission sur vos ventes.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register">
                <Button className="px-6 py-3 text-base">
                  Créer mon restaurant gratuitement <ArrowRight size={18} />
                </Button>
              </Link>
              <a href="#tarifs">
                <Button variant="secondary" className="px-6 py-3 text-base">Voir les tarifs</Button>
              </a>
            </div>
            <div className="mt-8 flex items-center gap-3 text-sm text-zinc-500">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span>4,9/5 — plus de 500 restaurants nous font confiance</span>
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-primary-100/60 blur-2xl" aria-hidden="true" />
            <div className="relative rounded-2xl border border-zinc-200 bg-white shadow-xl">
              <div className="flex items-center gap-2 border-b border-zinc-100 px-4 py-3">
                <span className="h-3 w-3 rounded-full bg-danger-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-success-400" />
                <span className="ml-3 rounded-md bg-zinc-100 px-3 py-1 text-xs text-zinc-500">app.restohub.com/dashboard</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500">Chiffre d'affaires — aujourd'hui</p>
                    <p className="text-2xl font-bold">{fmt(248000)}</p>
                  </div>
                  <Badge variant="success" dot>+18% ce semaine</Badge>
                </div>
                <div className="mt-5 flex h-32 items-end gap-2">
                  {[40, 55, 35, 70, 85, 100, 65].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-primary-500/80" style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="mt-5 space-y-2">
                  {[
                    { id: "CMD-1042", name: "Poulet Braisé x2", st: "Nouvelle" },
                    { id: "CMD-1041", name: "Poisson grillé x1", st: "En préparation" },
                    { id: "CMD-1040", name: "Kedjenou x1", st: "En livraison" },
                  ].map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50/70 px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                          <ShoppingCart size={15} />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-zinc-800">{o.id}</p>
                          <p className="text-xs text-zinc-500">{o.name}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">{o.st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Comment ça marche</h2>
          <p className="mt-3 text-zinc-600">Digitalisez votre restaurant et votre carte en trois étapes simples.</p>
        </div>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="relative rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-500 text-lg font-bold text-white">
                {s.n}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-zinc-600">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fonctionnalités */}
      <section id="fonctionnalites" className="bg-zinc-50/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Tout ce qu'il faut pour vendre en ligne</h2>
            <p className="mt-3 text-zinc-600">Une plateforme complète pensée pour les restaurants.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                  <f.icon size={22} />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tarifs */}
      <section id="tarifs" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Des tarifs simples et transparents</h2>
          <p className="mt-3 text-zinc-600">Sans commission sur vos ventes. Changez de formule à tout moment.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => {
            const highlight = p.name === "Business";
            return (
              <div
                key={p.name}
                className={`relative rounded-2xl border p-7 shadow-sm ${
                  highlight ? "border-primary-500 bg-white shadow-lg ring-1 ring-primary-500" : "border-zinc-200 bg-white"
                }`}
              >
                {highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3.5 py-1 text-xs font-semibold text-white">
                    Populaire
                  </span>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="mt-3">
                  <span className="text-4xl font-extrabold tracking-tight">{fmt(p.price)}</span>
                  <span className="text-sm text-zinc-500">{p.period}</span>
                </p>
                <ul className="mt-6 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-zinc-700">
                      <Check size={17} className="mt-0.5 shrink-0 text-success-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="mt-8 block">
                  <Button variant={highlight ? "primary" : "secondary"} className="w-full py-3">Choisir {p.name}</Button>
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Témoignages */}
      <section id="temoignages" className="bg-zinc-50/70 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Ils vendent déjà avec RestoHub</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-zinc-700">« {t.text} »</p>
                <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                    {t.name.split(" ").map((w) => w[0]).join("")}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-zinc-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="rounded-2xl bg-zinc-900 px-6 py-14 text-center sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">Prêt à digitaliser votre restaurant ?</h2>
          <p className="mx-auto mt-3 max-w-xl text-zinc-300">
            Rejoignez plus de 500 restaurants qui développent leur activité avec RestoHub. Essai gratuit, sans engagement.
          </p>
          <Link to="/register" className="mt-8 inline-block">
            <Button className="px-8 py-3.5 text-base">Créer mon restaurant gratuitement <ArrowRight size={18} /></Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 text-white">
              <UtensilsCrossed size={16} />
            </span>
            <span className="font-bold">RestoHub</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
            <a href="#fonctionnalites" className="hover:text-zinc-900">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-zinc-900">Tarifs</a>
            <Link to="/login" className="hover:text-zinc-900">Connexion</Link>
            <Link to="/register" className="hover:text-zinc-900">Inscription</Link>
            <Link to="/terms" className="hover:text-zinc-900">Conditions d'utilisation</Link>
            <Link to="/privacy" className="hover:text-zinc-900">Confidentialité</Link>
          </nav>
          <p className="text-sm text-zinc-400">© 2026 RestoHub. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
