import { fmt, parseItemParticipant } from "./mappers";

/**
 * Normalise un numéro de téléphone pour WhatsApp (E.164 sans le +).
 * Supporte le Bénin (+229), la Côte d'Ivoire (+225), le Sénégal (+221), le Togo (+228)...
 */
export function normalizePhone(phone, defaultCountry = "229") {
  if (!phone) return "";
  let digits = String(phone).replace(/\D+/g, "");

  // Nettoyage préfixe international
  if (digits.startsWith("00")) digits = digits.slice(2);

  // Déjà indicaté international (ex: 229XXXXXXXX, 225XXXXXXXXXX, 221XXXXXXXX)
  if (digits.startsWith("229") && digits.length >= 11) return digits;
  if (digits.startsWith("225") && digits.length >= 12) return digits;
  if (digits.startsWith("221") && digits.length >= 11) return digits;
  if (digits.startsWith("228") && digits.length >= 10) return digits;

  // Numéro local béninois : 8 chiffres classiques ou 10 chiffres avec le nouveau préfixe 01
  if (digits.length === 8) {
    return `${defaultCountry}${digits}`;
  }
  if (digits.length === 10) {
    if (digits.startsWith("01")) {
      return `${defaultCountry}${digits}`;
    }
    if (digits.startsWith("0")) {
      return `${defaultCountry}${digits.slice(1)}`;
    }
  }

  // Si commence déjà par l'indicatif sans le +
  if (digits.startsWith(defaultCountry)) return digits;

  // Fallback si court
  if (digits.length <= 10) {
    return `${defaultCountry}${digits}`;
  }

  return digits;
}

/**
 * Génère un lien direct WhatsApp. Si aucun numéro n'est fourni,
 * ouvre WhatsApp avec le texte prêt à être partagé à n'importe quel contact ou groupe.
 */
export function waLink(phone, text, defaultCountry = "229") {
  const norm = normalizePhone(phone, defaultCountry);
  const encoded = encodeURIComponent(text || "");
  if (!norm) {
    return `https://wa.me/?text=${encoded}`;
  }
  return `https://wa.me/${norm}?text=${encoded}`;
}

/**
 * Construit l'URL absolue de suivi de commande en direct.
 */
export function getOrderTrackingUrl(order, storeSlug, trackBaseUrl) {
  const base = trackBaseUrl || (typeof window !== "undefined" ? window.location.origin : "");
  const num = order?.number || order?.id || "";
  const phone = order?.customer?.phone || order?.customer_phone || "";
  const slug = storeSlug || order?.restaurant?.slug || order?.slug || "";

  if (!slug) return `${base}/track?number=${encodeURIComponent(num)}`;
  const q = new URLSearchParams();
  if (num) q.set("number", num);
  if (phone) q.set("phone", phone);
  return `${base}/store/${slug}/track?${q.toString()}`;
}

/**
 * Génère un reçu de commande WhatsApp complet, ultra-professionnel et formaté.
 */
export function generateOrderReceipt({ order, restaurantName = "RestoHub", storeSlug = "", trackBaseUrl = "" }) {
  if (!order) return "";
  const trackUrl = getOrderTrackingUrl(order, storeSlug, trackBaseUrl);
  const custName = order.customer?.name || order.customer_name || "Client";
  const num = order.number || order.id || "CMD";
  const dateStr = order.date || (order.created_at ? new Date(order.created_at).toLocaleDateString("fr-FR") : "Aujourd'hui");

  const lines = [
    `🧾 *REÇU DE COMMANDE — ${restaurantName.toUpperCase()}*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔖 *Commande :* #${num}`,
    `👤 *Client :* ${custName}`,
    `📅 *Date :* ${dateStr}`,
  ];

  // Mention commande groupée si applicable
  const isGroup = Boolean(order.group_code || order.is_group_order);
  if (isGroup) {
    lines.push(`👥 *Commande Groupée :* Salon ${order.group_code || ""}`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🛒 *DÉTAIL DU PANIER :*`);

  const items = Array.isArray(order.items) ? order.items : [];
  items.forEach((it) => {
    const qty = it.qty || it.quantity || 1;
    const unitPrice = it.price || it.unit_price || 0;
    const { cleanName, participant } = parseItemParticipant(it.name);
    const participantLabel = participant ? ` [👤 ${participant}]` : "";

    lines.push(`• *${qty} × ${cleanName}*${participantLabel} — ${fmt(unitPrice * qty)}`);

    // Options et suppléments
    const opts = (it.options || []).map((o) => `${o.name}: ${o.choice || o.value}`).join(", ");
    const supps = (it.supplements || []).map((s) => `+ ${s.name}`).join(", ");
    const extras = [opts, supps].filter(Boolean).join(" · ");
    if (extras) {
      lines.push(`   ↳ _${extras}_`);
    }
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);

  const subtotal = items.reduce((sum, it) => sum + (it.price || it.unit_price || 0) * (it.qty || it.quantity || 1), 0);
  lines.push(`💵 *Sous-total :* ${fmt(subtotal)}`);

  if (order.discount && Number(order.discount) > 0) {
    lines.push(`🏷️ *Remise code promo :* -${fmt(order.discount)}`);
  }

  const deliveryFee = order.delivery_fee ?? (order.mode === "Livraison" ? (order.total - subtotal + (order.discount || 0)) : 0);
  if (order.mode === "Livraison") {
    lines.push(`🛵 *Livraison :* ${deliveryFee > 0 ? fmt(deliveryFee) : "Offerte"}`);
  } else {
    lines.push(`🏪 *Mode :* Retrait sur place`);
  }

  lines.push(`💰 *TOTAL PAYÉ :* *${fmt(order.total)}*`);
  if (order.payment || order.payment_method) {
    lines.push(`💳 *Règlement :* ${order.payment_method_label || order.payment || "Mobile Money"}`);
  }

  if (order.mode === "Livraison" && order.address && order.address !== "—") {
    lines.push(`📍 *Adresse de livraison :* ${order.address}`);
  }

  if (order.customer_notes || order.notes) {
    lines.push(`📝 *Note :* _${order.customer_notes || order.notes}_`);
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`🔗 *SUIVRE MA COMMANDE EN DIRECT :*`);
  lines.push(`${trackUrl}`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`✨ *Merci pour votre confiance !* Bon appétit de la part de toute l'équipe de *${restaurantName}* 🍲`);

  return lines.join("\n");
}

/**
 * Messages contextuels d'alerte statut pour le client.
 */
export function generateOrderStatusMessage({
  order,
  status,
  restaurantName = "RestoHub",
  storeSlug = "",
  trackBaseUrl = "",
}) {
  if (!order) return "";
  const custName = order.customer?.name || order.customer_name || "Cher client";
  const num = order.number || order.id || "CMD";
  const trackUrl = getOrderTrackingUrl(order, storeSlug, trackBaseUrl);
  const currentStatus = status || order.status || "Confirmée";

  switch (currentStatus) {
    case "Confirmée":
    case "Nouvelle":
      return (
        `Bonjour *${custName}* ! 👨‍🍳\n\n` +
        `Votre commande *#${num}* a bien été confirmée chez *${restaurantName}*.\n` +
        `Nos cuisiniers s'activent pour préparer vos plats frais avec le plus grand soin.\n\n` +
        `🔗 *Suivez la préparation en direct :*\n${trackUrl}\n\n` +
        `Merci pour votre confiance ! 🍲`
      );

    case "En préparation":
      return (
        `Bonjour *${custName}* ! 🍳\n\n` +
        `Votre commande *#${num}* est actuellement *en cours de préparation* en cuisine chez *${restaurantName}*.\n\n` +
        `🔗 *Consultez l'avancement en temps réel :*\n${trackUrl}`
      );

    case "Prête":
      if (order.mode === "Retrait") {
        return (
          `Bonjour *${custName}* ! 🎉\n\n` +
          `Bonne nouvelle : votre commande *#${num}* est *prête et bien emballée* au comptoir de *${restaurantName}* !\n` +
          `Vous pouvez venir la récupérer à tout moment.\n\n` +
          `À tout de suite ! 🛍️`
        );
      }
      return (
        `Bonjour *${custName}* ! 🎉\n\n` +
        `Votre commande *#${num}* est *prête* en cuisine et attend la prise en charge par le livreur.\n\n` +
        `🔗 *Suivez l'expédition en direct :*\n${trackUrl}`
      );

    case "En livraison":
      return (
        `Bonjour *${custName}* ! 🛵💨\n\n` +
        `Excellente nouvelle : votre commande *#${num}* est en route !\n` +
        `Le livreur se dirige actuellement vers : *${order.address || "l'adresse indiquée"}*.\n\n` +
        `🔗 *Suivez la livraison en direct :*\n${trackUrl}\n\n` +
        `Préparez-vous à déguster, ça arrive tout chaud ! 🔥`
      );

    case "Livrée":
      return (
        `Bonjour *${custName}* ! ✨\n\n` +
        `Votre commande *#${num}* vient d'être livrée avec succès.\n` +
        `Toute l'équipe de *${restaurantName}* vous souhaite un *excellent appétit* 😋🍲 !\n\n` +
        `⭐ *Votre avis compte énormément pour nous !*\n` +
        `Notez votre expérience en 2 secondes ici : ${trackUrl}\n\n` +
        `À très bientôt chez ${restaurantName} !`
      );

    case "Annulée":
      return (
        `Bonjour *${custName}*.\n\n` +
        `Nous vous informons que votre commande *#${num}* a été annulée chez *${restaurantName}*.\n` +
        `Si vous avez la moindre question, n'hésitez pas à nous contacter directement sur WhatsApp.`
      );

    default:
      return (
        `Bonjour *${custName}* ! Au sujet de votre commande *#${num}* chez *${restaurantName}* (${fmt(order.total)}) :\n\n` +
        `🔗 *Lien de suivi :* ${trackUrl}`
      );
  }
}

/**
 * Message spécial pour partager le suivi d'une commande groupée aux collègues.
 */
export function generateGroupShareMessage({
  order,
  restaurantName = "RestoHub",
  storeSlug = "",
  trackBaseUrl = "",
}) {
  if (!order) return "";
  const trackUrl = getOrderTrackingUrl(order, storeSlug, trackBaseUrl);
  const num = order.number || order.id || "CMD";
  const groupCode = order.group_code || "";
  const host = order.customer?.name || order.customer_name || "L'organisateur";

  return (
    `📢 *COMMANDE D'ÉQUIPE VALIDÉE !* (${restaurantName})\n\n` +
    `La commande commune *#${num}* ${groupCode ? `(Code : *${groupCode}*) ` : ""}a été transmise avec succès par *${host}* 🍲.\n\n` +
    `👨‍🍳 Les plats de chacun sont en cours de préparation en cuisine avec vos étiquettes de prénom !\n\n` +
    `🔗 *Suivez l'avancement et la livraison en direct :*\n${trackUrl}\n\n` +
    `Bon appétit l'équipe ! 🚀`
  );
}

/**
 * Fonction historique pour la compatibilité existante.
 */
export function orderWaText(order, restaurantName = "RestoHub", storeSlug = "") {
  if (!order) return "";
  return generateOrderStatusMessage({
    order,
    status: order.status,
    restaurantName,
    storeSlug,
  });
}
