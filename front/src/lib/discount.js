import { fmt } from "./mappers";

/** Calcul de la remise d'un code promo validé côté serveur.
 *  `promo` = réponse de `storeApi.verifyPromo` ({ type, value }).
 *  Retourne le montant réel à déduire selon le sous-total et les frais de livraison.
 */
export function computeDiscount(promo, subtotal, deliveryFee = 0) {
  if (!promo) return 0;
  if (promo.type === "percent") return Math.round((subtotal * promo.value) / 100);
  if (promo.type === "fixed") return Math.min(promo.value, subtotal);
  if (promo.type === "free_delivery") return deliveryFee;
  return 0;
}

/** Libellé lisible de la remise appliquée. */
export function discountLabel(promo) {
  if (!promo) return "";
  if (promo.type === "percent") return `${promo.value} %`;
  if (promo.type === "fixed") return fmt(promo.value);
  if (promo.type === "free_delivery") return "Livraison offerte";
  return "";
}