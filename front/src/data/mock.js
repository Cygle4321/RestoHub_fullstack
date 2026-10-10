// ---------- Restaurant (dashboard) mock data ----------
export const restaurant = {
  name: "Le Saveur d'Or",
  owner: "Mohamed Diallo",
  email: "contact@lesaveurdor.com",
  phone: "+225 07 00 00 00",
  address: "Cocody, Rue des Jardins, Abidjan",
  description: "Cuisine africaine moderne et grillades premium depuis 2015.",
  logo: null,
  cover: null,
  color: "#14b8a6",
  open: true,
  hours: { lun: "11:00 - 23:00", mar: "11:00 - 23:00", mer: "11:00 - 23:00", jeu: "11:00 - 23:00", ven: "11:00 - 00:00", sam: "11:00 - 00:00", dim: "12:00 - 22:00" },
  social: { facebook: "facebook.com/lesaveurdor", instagram: "@lesaveurdor", whatsapp: "+225 07 00 00 00" },
  plan: "Business",
};

export const categories = [
  { id: 1, name: "Entrées", count: 8, active: true },
  { id: 2, name: "Grillades", count: 12, active: true },
  { id: 3, name: "Plats traditionnels", count: 10, active: true },
  { id: 4, name: "Boissons", count: 14, active: true },
  { id: 5, name: "Desserts", count: 6, active: false },
];

export const products = [
  { id: 1, name: "Poulet Braisé", description: "Poulet mariné aux épices locales, braisé au charbon de bois, servi avec attiéké.", price: 4500, category: "Grillades", image: null, available: true, featured: true, options: [{ name: "Accompagnement", choices: ["Attiéké", "Frites", "Riz", "Alloco"] }], supplements: [{ name: "Sauce piment", price: 250 }, { name: "Supplément poulet", price: 1500 }] },
  { id: 2, name: "Brochettes de bœuf", description: "Brochettes grillées, marinade maison, sauce arachide.", price: 3000, category: "Grillades", image: null, available: true, featured: true, options: [{ name: "Cuisson", choices: ["Saignante", "À point", "Bien cuite"] }], supplements: [{ name: "Oignons extra", price: 200 }] },
  { id: 3, name: "Kedjenou de poulet", description: "Ragoût de poulet mijoté lentement avec tomates et aubergines.", price: 5000, category: "Plats traditionnels", image: null, available: true, featured: false, options: [], supplements: [] },
  { id: 4, name: "Salade d'avocat", description: "Avocat frais, crevettes, vinaigrette citronnée.", price: 2500, category: "Entrées", image: null, available: true, featured: false, options: [], supplements: [{ name: "Crevettes extra", price: 1000 }] },
  { id: 5, name: "Jus de bissap", description: "Hibiscus frais maison, servi bien frais.", price: 1000, category: "Boissons", image: null, available: true, featured: true, options: [{ name: "Taille", choices: ["33cl", "50cl"] }], supplements: [] },
  { id: 6, name: "Alloco", description: "Bananes plantain frites, sauce tomate pimentée.", price: 1500, category: "Entrées", image: null, available: false, featured: false, options: [], supplements: [] },
  { id: 7, name: "Poisson entier grillé", description: "Bar entier grillé, fenouil et citron.", price: 7500, category: "Grillades", image: null, available: true, featured: true, options: [], supplements: [{ name: "Sauce vierge", price: 500 }] },
  { id: 8, name: "Fufu sauce graine", description: "Pâte de manioc, sauce noix de palme.", price: 3500, category: "Plats traditionnels", image: null, available: true, featured: false, options: [], supplements: [] },
];

export const orderStatuses = ["Nouvelle", "Confirmée", "En préparation", "Prête", "En livraison", "Livrée", "Annulée"];

export const orders = [
  { id: "CMD-1042", customer: { name: "Aïcha Koné", phone: "+225 07 11 22 33" }, date: "2026-08-16 12:42", status: "Nouvelle", total: 9500, items: [{ name: "Poulet Braisé", qty: 2 }], mode: "Livraison", address: "Riviera 3, Abidjan", payment: "Mobile Money", history: [{ s: "Nouvelle", t: "12:42" }] },
  { id: "CMD-1041", customer: { name: "Yao Kouassi", phone: "+225 05 44 55 66" }, date: "2026-08-16 12:15", status: "En préparation", total: 12500, items: [{ name: "Poisson entier grillé", qty: 1 }, { name: "Jus de bissap", qty: 2 }], mode: "Livraison", address: "Cocody Angré, Abidjan", payment: "Carte bancaire", history: [{ s: "Nouvelle", t: "12:15" }, { s: "Confirmée", t: "12:18" }, { s: "En préparation", t: "12:22" }] },
  { id: "CMD-1040", customer: { name: "Fatou Traoré", phone: "+225 01 77 88 99" }, date: "2026-08-16 11:58", status: "En livraison", total: 6000, items: [{ name: "Kedjenou de poulet", qty: 1 }], mode: "Livraison", address: "Marcory Zone 4, Abidjan", payment: "Paiement à la livraison", history: [{ s: "Nouvelle", t: "11:58" }, { s: "Confirmée", t: "12:00" }, { s: "En préparation", t: "12:02" }, { s: "Prête", t: "12:25" }, { s: "En livraison", t: "12:31" }] },
  { id: "CMD-1039", customer: { name: "Ibrahim Cissé", phone: "+225 07 33 22 11" }, date: "2026-08-16 11:30", status: "Livrée", total: 8000, items: [{ name: "Brochettes de bœuf", qty: 2 }, { name: "Alloco", qty: 1 }], mode: "Retrait", address: "—", payment: "Mobile Money", history: [{ s: "Nouvelle", t: "11:30" }, { s: "Confirmée", t: "11:32" }, { s: "En préparation", t: "11:35" }, { s: "Prête", t: "11:50" }, { s: "Livrée", t: "12:05" }] },
  { id: "CMD-1038", customer: { name: "Mariam Bamba", phone: "+225 05 66 77 88" }, date: "2026-08-16 11:04", status: "Livrée", total: 4500, items: [{ name: "Poulet Braisé", qty: 1 }], mode: "Livraison", address: "Yopougon, Abidjan", payment: "Mobile Money", history: [{ s: "Nouvelle", t: "11:04" }, { s: "Confirmée", t: "11:06" }, { s: "En préparation", t: "11:10" }, { s: "Prête", t: "11:35" }, { s: "En livraison", t: "11:40" }, { s: "Livrée", t: "12:00" }] },
  { id: "CMD-1037", customer: { name: "Serge Amani", phone: "+225 07 99 88 77" }, date: "2026-08-16 10:45", status: "Annulée", total: 3500, items: [{ name: "Fufu sauce graine", qty: 1 }], mode: "Retrait", address: "—", payment: "Carte bancaire", history: [{ s: "Nouvelle", t: "10:45" }, { s: "Annulée", t: "10:52" }] },
];

export const customers = [
  { id: 1, name: "Aïcha Koné", phone: "+225 07 11 22 33", orders: 24, spent: 148000, last: "2026-08-16" },
  { id: 2, name: "Yao Kouassi", phone: "+225 05 44 55 66", orders: 12, spent: 96500, last: "2026-08-16" },
  { id: 3, name: "Fatou Traoré", phone: "+225 01 77 88 99", orders: 8, spent: 52000, last: "2026-08-16" },
  { id: 4, name: "Ibrahim Cissé", phone: "+225 07 33 22 11", orders: 31, spent: 210300, last: "2026-08-16" },
  { id: 5, name: "Mariam Bamba", phone: "+225 05 66 77 88", orders: 3, spent: 13500, last: "2026-08-15" },
  { id: 6, name: "Serge Amani", phone: "+225 07 99 88 77", orders: 5, spent: 28000, last: "2026-08-12" },
];

export const deliveryZones = [
  { id: 1, name: "Cocody", fee: 1000, delay: "20-30 min", active: true },
  { id: 2, name: "Marcory", fee: 1500, delay: "25-35 min", active: true },
  { id: 3, name: "Yopougon", fee: 2000, delay: "35-50 min", active: true },
  { id: 4, name: "Riviera", fee: 1500, delay: "25-40 min", active: true },
  { id: 5, name: "Plateau", fee: 2500, delay: "40-55 min", active: false },
];

export const drivers = [
  { id: 1, name: "Koffi Adjé", phone: "+225 07 55 44 33", vehicle: "Moto", status: "En course", orders: 5 },
  { id: 2, name: "Alassane Ouattara", phone: "+225 05 22 33 44", vehicle: "Moto", status: "Disponible", orders: 0 },
  { id: 3, name: "Jean-Marc Ehou", phone: "+225 01 88 77 66", vehicle: "Voiture", status: "En course", orders: 2 },
];

export const promotions = [
  { id: 1, code: "BIENVENUE10", type: "-10% première commande", usage: 87, limit: 200, validUntil: "2026-09-30", active: true },
  { id: 2, code: "LIVRAISON0", type: "Livraison offerte dès 10 000 FCFA", usage: 214, limit: 500, validUntil: "2026-08-31", active: true },
  { id: 3, code: "PACKFAMILLE", type: "Pack 4 poulets braisés -15%", usage: 32, limit: 100, validUntil: "2026-10-15", active: false },
];

export const salesSeries = [
  { day: "Lun", ventes: 125000, commandes: 28 },
  { day: "Mar", ventes: 142000, commandes: 31 },
  { day: "Mer", ventes: 118000, commandes: 26 },
  { day: "Jeu", ventes: 165000, commandes: 38 },
  { day: "Ven", ventes: 210000, commandes: 47 },
  { day: "Sam", ventes: 248000, commandes: 56 },
  { day: "Dim", ventes: 195000, commandes: 42 },
];

export const plans = [
  { name: "Starter", price: 10000, period: "/mois", features: ["Menu digital & QR Code interactif", "Commandes en direct & Reçus digitaux", "Jusqu'à 30 produits", "Paiements Mobile Money intégrés", "Support email 7j/7"], current: false },
  { name: "Business", price: 25000, period: "/mois", features: ["Tout Starter inclus", "Produits & catégories illimités", "Commandes groupées (salons partagés)", "Programme de fidélité & CRM clients", "Livraison & zones multi-tarifs", "Statistiques de ventes & plats stars", "Support prioritaire"], current: true },
  { name: "Premium", price: 50000, period: "/mois", features: ["Tout Business inclus", "Relances WhatsApp ciblées 1-clic", "Multi-restaurants & points de vente", "Gestion de flotte de livreurs en direct", "API & intégrations personnalisées", "Account manager dédié 24/7"], current: false },
];

// ---------- Storefront (public shop) ----------
export const storeCategories = ["Tout", "Entrées", "Grillades", "Plats traditionnels", "Boissons", "Desserts"];

export const storeProducts = products.filter((p) => p.available);

export const reviews = [
  { name: "Aïcha K.", rating: 5, text: "Le poulet braisé est incroyable, livraison rapide !" },
  { name: "Yao K.", rating: 4, text: "Très bon kedjenou, un peu long mais ça vaut le coup." },
  { name: "Fatou T.", rating: 5, text: "Ma commande est toujours bien emballée et chaude." },
];

// ---------- Super Admin mock data ----------
export const platformRestaurants = [
  { id: 1, name: "Le Saveur d'Or", owner: "Mohamed Diallo", plan: "Business", status: "Actif", joined: "2026-01-12", orders: 1240, revenue: 4820000 },
  { id: 2, name: "Pizza Mama", owner: "Awa Sanogo", plan: "Premium", status: "Actif", joined: "2026-02-03", orders: 3421, revenue: 15200000 },
  { id: 3, name: "Sushi Express", owner: "Kenji Tanaka", plan: "Starter", status: "Actif", joined: "2026-03-15", orders: 890, revenue: 4100000 },
  { id: 4, name: "Chez Fatou", owner: "Fatou Coulibaly", plan: "Business", status: "Suspendu", joined: "2026-04-20", orders: 410, revenue: 1580000 },
  { id: 5, name: "Burger House", owner: "Emmanuel Kouadio", plan: "Premium", status: "Actif", joined: "2026-05-08", orders: 2760, revenue: 9800000 },
  { id: 6, name: "Le Petit Plateau", owner: "Sarah Mensah", plan: "Starter", status: "Inactif", joined: "2026-06-25", orders: 45, revenue: 180000 },
];

export const transactions = [
  { id: "TRX-8821", restaurant: "Pizza Mama", amount: 25000, method: "Mobile Money", status: "Réussi", date: "2026-08-16 09:12" },
  { id: "TRX-8820", restaurant: "Le Saveur d'Or", amount: 25000, method: "Carte bancaire", status: "Réussi", date: "2026-08-15 14:30" },
  { id: "TRX-8819", restaurant: "Burger House", amount: 50000, method: "Carte bancaire", status: "Réussi", date: "2026-08-15 10:05" },
  { id: "TRX-8818", restaurant: "Sushi Express", amount: 10000, method: "Mobile Money", status: "Échoué", date: "2026-08-14 18:44" },
  { id: "TRX-8817", restaurant: "Chez Fatou", amount: 25000, method: "Mobile Money", status: "Remboursé", date: "2026-08-13 11:20" },
];

export const platformUsers = [
  { id: 1, name: "Mohamed Diallo", email: "contact@lesaveurdor.com", role: "Propriétaire", restaurant: "Le Saveur d'Or", status: "Actif" },
  { id: 2, name: "Awa Sanogo", email: "awa@pizzamama.com", role: "Propriétaire", restaurant: "Pizza Mama", status: "Actif" },
  { id: 3, name: "Kenji Tanaka", email: "kenji@sushiexpress.com", role: "Propriétaire", restaurant: "Sushi Express", status: "Actif" },
  { id: 4, name: "Fatou Coulibaly", email: "fatou@chezfatou.com", role: "Propriétaire", restaurant: "Chez Fatou", status: "Suspendu" },
  { id: 5, name: "Sarah Mensah", email: "sarah@lepetitplateau.com", role: "Propriétaire", restaurant: "Le Petit Plateau", status: "Inactif" },
];

export const platformSeries = [
  { month: "Mar", restaurants: 12, revenus: 350000, commandes: 890 },
  { month: "Avr", restaurants: 18, revenus: 520000, commandes: 1240 },
  { month: "Mai", restaurants: 27, revenus: 780000, commandes: 1860 },
  { month: "Juin", restaurants: 39, revenus: 1050000, commandes: 2540 },
  { month: "Juil", restaurants: 52, revenus: 1420000, commandes: 3320 },
  { month: "Août", restaurants: 68, revenus: 1810000, commandes: 4180 },
];

export const fmt = (n) => n.toLocaleString("fr-FR") + " FCFA";
