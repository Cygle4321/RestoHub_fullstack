import QRCode from "qrcode";
import { fmt, parseItemParticipant, paymentMethodLabel } from "./mappers";
import { getOrderTrackingUrl } from "./whatsapp";

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * Génère une image PNG haute résolution du ticket de caisse / reçu de commande.
 * Rendu pixel-perfect avec le numéro de commande proéminent, articles, totaux et QR code de suivi.
 */
export async function generateTicketImage({
  order,
  restaurant = null,
  storeSlug = "",
  trackBaseUrl = "",
}) {
  if (!order) return null;

  const num = (order.number || order.id || "CMD-000").toUpperCase();
  const restaurantName = restaurant?.name || "RestoHub Restaurant";
  const custName =
    (typeof order.customer === "object" && order.customer?.name) ||
    order.customer_name ||
    "Client";
  const custPhone =
    (typeof order.customer === "object" && order.customer?.phone) ||
    order.customer_phone ||
    "";

  const dateStr =
    order.date ||
    (order.created_at
      ? new Date(order.created_at).toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : new Date().toLocaleString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }));

  const mode = order.mode === "retrait" ? "Retrait" : (order.mode || "Livraison");
  const rawPayment = order.payment || order.payment_method_label || order.payment_method;
  const payment = paymentMethodLabel(rawPayment) || "Mobile Money";

  const trackUrl = getOrderTrackingUrl(order, storeSlug, trackBaseUrl);
  const items = Array.isArray(order.items) ? order.items : [];

  // Génération du QR Code de suivi
  let qrImg = null;
  try {
    const qrDataUrl = await QRCode.toDataURL(trackUrl, {
      width: 140,
      margin: 1,
      color: { dark: "#0f172a", light: "#ffffff" },
    });
    qrImg = await loadImage(qrDataUrl);
  } catch {
    /* fallback sans QR */
  }

  // Calcul dynamique de la hauteur du ticket
  const width = 580;
  const paddingX = 36;
  let dynamicHeight = 220; // En-tête restaurant + badge Récapitulatif
  dynamicHeight += items.length * 42;
  items.forEach((it) => {
    if (it.options?.length || it.supplements?.length) dynamicHeight += 18;
  });
  dynamicHeight += 170; // Livraison, Réduction, Total, Mode / Paiement
  dynamicHeight += qrImg ? 180 : 70; // QR Code & Footer
  const height = Math.max(680, dynamicHeight);

  // Canvas haute résolution (x2 retina pour un rendu ultra net sur écran et mobile)
  const scale = 2;
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(scale, scale);

  // 1. Fond de la carte
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 6, 6, width - 12, height - 12, 20);
  ctx.fill();

  // Bordure extérieure douce
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 6, 6, width - 12, height - 12, 20);
  ctx.stroke();

  // Bandeau supérieur coloré (accent)
  const primaryColor = restaurant?.color || "#0d9488";
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, 6, 6, width - 12, height - 12, 20);
  ctx.clip();
  ctx.fillStyle = primaryColor;
  ctx.fillRect(6, 6, width - 12, 6);
  ctx.restore();

  let y = 38;

  // 2. Nom du restaurant au sommet
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(restaurantName.toUpperCase(), width / 2, y);

  y += 20;
  ctx.fillStyle = "#64748b";
  ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`Ticket officiel · ${dateStr}`, width / 2, y);

  y += 18;
  drawDashedLine(ctx, paddingX, y, width - paddingX);

  // 3. Ligne "Récapitulatif" à gauche + Badge "CMD-XXXXXX" à droite (Identique à la capture utilisateur)
  y += 26;
  ctx.textAlign = "left";
  ctx.fillStyle = "#0f172a";
  ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Récapitulatif", paddingX, y);

  // Badge du numéro de commande à droite
  const badgeText = num;
  ctx.font = "bold 13px monospace";
  const badgeTextWidth = ctx.measureText(badgeText).width;
  const badgeWidth = Math.max(110, badgeTextWidth + 24);
  const badgeHeight = 28;
  const badgeX = width - paddingX - badgeWidth;
  const badgeY = y - 18;

  ctx.fillStyle = "#ecfdf5";
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 14);
  ctx.fill();

  ctx.strokeStyle = "#a7f3d0";
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeWidth, badgeHeight, 14);
  ctx.stroke();

  ctx.fillStyle = "#0f766e";
  ctx.textAlign = "center";
  ctx.fillText(badgeText, badgeX + badgeWidth / 2, badgeY + 18);

  // Mention client si disponible
  y += 20;
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const clientLine = custPhone ? `Client : ${custName} (${custPhone})` : `Client : ${custName}`;
  ctx.fillText(truncateText(ctx, clientLine, width - paddingX * 2), paddingX, y);

  y += 16;
  drawDashedLine(ctx, paddingX, y, width - paddingX);

  // 4. Articles commandés
  y += 20;

  items.forEach((it) => {
    const qty = it.qty || it.quantity || 1;
    const unitPrice = it.price || it.unit_price || 0;
    const { cleanName, participant } = parseItemParticipant(it.name);
    const participantLabel = participant ? ` [${participant}]` : "";

    ctx.textAlign = "left";
    ctx.fillStyle = "#1e293b";
    ctx.font = "500 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

    const itemTitle = `${qty} × ${cleanName}${participantLabel}`;
    ctx.fillText(truncateText(ctx, itemTitle, width - paddingX * 2 - 120), paddingX, y);

    ctx.textAlign = "right";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 14px monospace";
    ctx.fillText(fmt(unitPrice * qty), width - paddingX, y);

    y += 16;

    // Suppléments & options si présents
    const opts = (it.options || []).map((o) => `${o.name}: ${o.choice || o.value}`).join(", ");
    const supps = (it.supplements || []).map((s) => `+${s.name}`).join(", ");
    const extras = [opts, supps].filter(Boolean).join(" · ");
    if (extras) {
      ctx.textAlign = "left";
      ctx.fillStyle = "#94a3b8";
      ctx.font = "500 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText(truncateText(ctx, `↳ ${extras}`, width - paddingX * 2 - 40), paddingX + 12, y);
      y += 16;
    }

    y += 6;
  });

  drawDashedLine(ctx, paddingX, y, width - paddingX);

  // 5. Récapitulatif financier
  y += 22;
  const subtotal = items.reduce(
    (s, it) => s + (it.price || it.unit_price || 0) * (it.qty || it.quantity || 1),
    0
  );

  // Frais de livraison
  const deliveryFee =
    order.delivery_fee != null
      ? Number(order.delivery_fee)
      : mode === "Livraison"
        ? Math.max(0, (order.total || 0) - subtotal + (order.discount || 0))
        : 0;

  drawFinanceRow(
    ctx,
    "Livraison",
    mode === "Retrait" ? "—" : (deliveryFee > 0 ? fmt(deliveryFee) : "Offerte"),
    paddingX,
    width - paddingX,
    y,
    "#64748b",
    "#0f172a",
    "13px"
  );

  // Réduction si existante
  if (order.discount && Number(order.discount) > 0) {
    y += 20;
    drawFinanceRow(
      ctx,
      "Réduction",
      `−${fmt(order.discount)}`,
      paddingX,
      width - paddingX,
      y,
      "#64748b",
      "#0f766e",
      "13px"
    );
  }

  // TOTAL
  y += 26;
  const total = Number(order.total || (subtotal + deliveryFee - (order.discount || 0)));
  drawFinanceRow(
    ctx,
    "Total",
    fmt(total),
    paddingX,
    width - paddingX,
    y,
    "#0f172a",
    primaryColor,
    "17px",
    true
  );

  y += 18;
  drawDashedLine(ctx, paddingX, y, width - paddingX);

  // 6. Ligne Mode & Paiement (🕒 Livraison 💳 MM) comme sur la capture
  y += 20;
  ctx.textAlign = "left";
  ctx.fillStyle = "#64748b";
  ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`🕒 ${mode}`, paddingX, y);

  ctx.textAlign = "right";
  ctx.fillText(`💳 ${payment}`, width - paddingX, y);

  // 7. QR Code et lien de suivi direct
  if (qrImg) {
    y += 20;
    drawDashedLine(ctx, paddingX, y, width - paddingX);

    y += 16;
    const qrSize = 96;
    const qrX = (width - qrSize) / 2;

    ctx.drawImage(qrImg, qrX, y, qrSize, qrSize);

    y += qrSize + 16;
    ctx.fillStyle = "#64748b";
    ctx.font = "600 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Scannez ce QR Code pour suivre votre commande en direct", width / 2, y);

    y += 16;
    ctx.fillStyle = primaryColor;
    ctx.font = "bold 11px monospace";
    ctx.fillText(`SUIVI : #${num}`, width / 2, y);
  }

  // 8. Pied de page
  y += 24;
  ctx.fillStyle = "#94a3b8";
  ctx.font = "500 10.5px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Conservez ce numéro pour le retrait ou la livraison · Bon appétit 🍲", width / 2, y);

  // Conversion en Blob et DataURL
  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));

  const file = blob
    ? new File([blob], `ticket-${num}.png`, { type: "image/png" })
    : null;

  return {
    dataUrl,
    blob,
    file,
    orderNumber: num,
  };
}

/**
 * Télécharge directement l'image PNG du ticket
 */
export function downloadTicketImage(dataUrl, orderNumber = "CMD") {
  if (!dataUrl) return;
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `ticket-${orderNumber}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copie l'image du ticket dans le presse-papier pour la coller directement (Ctrl+V)
 */
export async function copyTicketImageToClipboard(blob) {
  if (!blob || !navigator.clipboard?.write) return false;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch (err) {
    console.warn("Échec copie image presse-papier:", err);
    return false;
  }
}

/**
 * Tente de partager l'image via Web Share API native (WhatsApp sur smartphone)
 */
export async function shareTicketFile({ file, title, text }) {
  if (!file || typeof navigator === "undefined" || !navigator.canShare) {
    return { supported: false };
  }
  try {
    const shareData = {
      title: title || "Ticket de commande",
      text: text || "Voici mon ticket de commande",
      files: [file],
    };
    if (navigator.canShare(shareData)) {
      await navigator.share(shareData);
      return { supported: true, success: true };
    }
    return { supported: false };
  } catch (err) {
    if (err.name === "AbortError") {
      return { supported: true, cancelled: true };
    }
    console.warn("Erreur partage natif:", err);
    return { supported: false, error: err };
  }
}

// Helpers de dessin canvas
function drawDashedLine(ctx, x1, y, x2) {
  ctx.save();
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

function drawFinanceRow(ctx, label, val, x1, x2, y, col1, col2, fontSize = "13px", bold = false) {
  ctx.textAlign = "left";
  ctx.fillStyle = col1;
  ctx.font = `${bold ? "bold" : "500"} ${fontSize} -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
  ctx.fillText(label, x1, y);

  ctx.textAlign = "right";
  ctx.fillStyle = col2;
  ctx.font = `${bold ? "bold" : "600"} ${fontSize} monospace`;
  ctx.fillText(val, x2, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function truncateText(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let str = text;
  while (str.length > 0 && ctx.measureText(str + "…").width > maxWidth) {
    str = str.slice(0, -1);
  }
  return str + "…";
}
