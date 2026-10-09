import { useEffect } from "react";

const DEFAULT_TITLE = "RestoHub — Solution SaaS Tout-en-Un pour Restaurants & Boutiques en Ligne";
const DEFAULT_DESCRIPTION =
  "RestoHub est la plateforme SaaS tout-en-un pour les restaurants : créez votre boutique en ligne personnalisée, menus QR Code interactifs, encaissement Mobile Money & CB, gestion des commandes en direct et livraisons sans compétence technique.";
const DEFAULT_IMAGE = "/og-image.svg";
const DEFAULT_ROBOTS = "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1";

function setMetaTag(name, content, attribute = "name") {
  if (!content) return;
  let element = document.querySelector(`meta[${attribute}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setLinkRel(rel, href) {
  if (!href) return;
  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

/**
 * Hook personnalisé pour piloter l'ensemble du référencement et des balises méta dynamiquement.
 *
 * @param {Object} options
 * @param {string} [options.title] - Titre de la page
 * @param {boolean} [options.exactTitle] - Si true, n'ajoute pas le suffixe "| RestoHub"
 * @param {string} [options.description] - Description méta & réseaux sociaux
 * @param {string} [options.keywords] - Mots-clés SEO
 * @param {string} [options.image] - URL de l'image de partage (OpenGraph & Twitter)
 * @param {string} [options.url] - URL canonique (par défaut l'URL courante)
 * @param {string} [options.type] - Type OpenGraph (website, restaurant, product, etc.)
 * @param {boolean} [options.noindex] - Si true, empêche les moteurs d'indexer la page (zones privées, checkout, auth)
 * @param {Object|Array} [options.jsonLd] - Données structurées Schema.org JSON-LD
 */
export function useSEO({
  title,
  exactTitle = false,
  description,
  keywords,
  image,
  url,
  type = "website",
  noindex = false,
  jsonLd,
} = {}) {
  useEffect(() => {
    // 1. Titre du document
    const previousTitle = document.title;
    if (title) {
      document.title = exactTitle ? title : `${title} | RestoHub`;
    } else {
      document.title = DEFAULT_TITLE;
    }

    // 2. Balises Meta Primaires
    const currentDesc = description || DEFAULT_DESCRIPTION;
    setMetaTag("description", currentDesc);
    if (keywords) {
      setMetaTag("keywords", keywords);
    }

    // 3. Directives Robots (indexation)
    const robotsValue = noindex ? "noindex, nofollow" : DEFAULT_ROBOTS;
    setMetaTag("robots", robotsValue);
    setMetaTag("googlebot", noindex ? "noindex, nofollow" : DEFAULT_ROBOTS);

    // 4. URL Canonique
    const currentUrl = url || (typeof window !== "undefined" ? window.location.href : "https://restohub.app");
    setLinkRel("canonical", currentUrl);

    // 5. Open Graph (Facebook, WhatsApp, LinkedIn)
    setMetaTag("og:title", title ? (exactTitle ? title : `${title} | RestoHub`) : DEFAULT_TITLE, "property");
    setMetaTag("og:description", currentDesc, "property");
    setMetaTag("og:url", currentUrl, "property");
    setMetaTag("og:type", type, "property");
    const currentImage = image || DEFAULT_IMAGE;
    const absoluteImage = currentImage.startsWith("http")
      ? currentImage
      : `${typeof window !== "undefined" ? window.location.origin : "https://restohub.app"}${currentImage.startsWith("/") ? "" : "/"}${currentImage}`;
    setMetaTag("og:image", absoluteImage, "property");

    // 6. Twitter Card
    setMetaTag("twitter:title", title ? (exactTitle ? title : `${title} | RestoHub`) : DEFAULT_TITLE);
    setMetaTag("twitter:description", currentDesc);
    setMetaTag("twitter:image", absoluteImage);

    // 7. Données structurées dynamiques (JSON-LD)
    let jsonLdScript = document.getElementById("dynamic-seo-jsonld");
    if (jsonLd) {
      if (!jsonLdScript) {
        jsonLdScript = document.createElement("script");
        jsonLdScript.id = "dynamic-seo-jsonld";
        jsonLdScript.type = "application/ld+json";
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(jsonLd);
    } else if (jsonLdScript) {
      jsonLdScript.remove();
    }

    // Cleanup à la désactivation du composant
    return () => {
      document.title = previousTitle;
      const script = document.getElementById("dynamic-seo-jsonld");
      if (script) {
        script.remove();
      }
    };
  }, [title, exactTitle, description, keywords, image, url, type, noindex, jsonLd]);
}
