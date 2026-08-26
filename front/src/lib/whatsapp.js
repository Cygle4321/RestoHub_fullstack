/**
 * Lien WhatsApp pré-rempli pour contacter un client au sujet d'une commande.
 * Normalise les numéros locaux béninois (8 chiffres / 10 avec 0) en format
 * international 229XXXXXXXX.
 */
export function waLink(phone, text) {
  let digits = String(phone || "").replace(/\D+/g, "");

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits.startsWith("229") && digits.length <= 10) {
    if (digits.startsWith("0")) digits = digits.slice(1);
    digits = `229${digits}`;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function orderWaText(order) {
  const total = Number(order.total || 0).toLocaleString("fr-FR");
  return (
    `Bonjour ${order.customer_name || ""} ! ` +
    `Au sujet de votre commande ${order.number} (${total} FCFA) : `
  );
}
