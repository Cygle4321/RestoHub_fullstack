import { useSEO } from "../../hooks/useSEO";

/**
 * Composant SEO déclaratif pour gérer le référencement et les balises meta de n'importe quelle page.
 *
 * Exemples d'utilisation :
 * <SEO title="Accueil" description="..." />
 * <SEO title="Panier" noindex />
 * <SEO title={restaurant.name} image={restaurant.banner} jsonLd={restaurantSchema} />
 */
export default function SEO(props) {
  useSEO(props);
  return null;
}
