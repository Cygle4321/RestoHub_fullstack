/**
 * Générateurs de données structurées Schema.org (JSON-LD) conformes aux standards Google Rich Results.
 */

/**
 * Génère le schéma Schema.org pour un restaurant.
 */
export function generateRestaurantSchema(restaurant, storeUrl = "") {
  if (!restaurant) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": `${storeUrl || "https://restohub.app"}#restaurant`,
    "name": restaurant.name,
    "description":
      restaurant.description ||
      `Boutique en ligne et menu digital de ${restaurant.name}. Commandez vos plats préférés en livraison ou à emporter.`,
    "image": restaurant.banner || restaurant.logo || "https://restohub.app/og-image.svg",
    "telephone": restaurant.phone || "+225 00 00 00 00",
    "servesCuisine": restaurant.cuisine || "Africaine, Internationale",
    "priceRange": "$$",
    "currenciesAccepted": restaurant.currency || "XOF",
    "paymentAccepted": "Mobile Money, Carte Bancaire, Espèces",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": restaurant.address || "Centre-ville",
      "addressLocality": restaurant.city || "Abidjan",
      "addressCountry": "CI",
    },
    "hasMenu": storeUrl ? `${storeUrl}/menu` : "https://restohub.app/store/menu",
    "url": storeUrl || "https://restohub.app/store",
  };
}

/**
 * Génère le schéma Schema.org pour un plat / produit du menu.
 */
export function generateMenuItemSchema(product, restaurant, productUrl = "") {
  if (!product) return null;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl || "https://restohub.app"}#product-${product.id}`,
    "name": product.name,
    "description": product.description || `Dégustez notre ${product.name} chez ${restaurant?.name || "RestoHub"}.`,
    "image": product.image || restaurant?.logo || "https://restohub.app/og-image.svg",
    "category": product.category || "Plats",
    "brand": {
      "@type": "Brand",
      "name": restaurant?.name || "RestoHub",
    },
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": restaurant?.currency || "XOF",
      "availability": product.available !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "url": productUrl || undefined,
    },
  };
}

/**
 * Génère un fil d'Ariane Schema.org (BreadcrumbList).
 */
export function generateBreadcrumbSchema(items = []) {
  if (!items || items.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url,
    })),
  };
}
