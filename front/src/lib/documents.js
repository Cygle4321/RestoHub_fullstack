/**
 * Documents PDF personnalisés — design RestoHub.
 * Génère des documents HTML formatés (open → print → enregistrer en PDF)
 * avec le branding du site (teal primaire, Inter, cartes arrondies).
 */

import { fmt } from "./mappers";

const BRAND = {
  primary: "#14b8a6",
  accent: "#0d9488",
  dark: "#0f766e",
  ink: "#111113",
  muted: "#71717a",
  canvas: "#f7f7f8",
  border: "#e4e4e7",
};

function shell({ title, restaurantName, children, note }) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:'Inter',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:${BRAND.ink};margin:0;background:#ffffff;font-size:13px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .head{display:flex;justify-content:space-between;align-items:flex-start;padding:26px 36px;background:linear-gradient(180deg,#ffffff,${BRAND.canvas});border-bottom:3px solid ${BRAND.primary}}
    .brand{display:flex;align-items:center;gap:12px}
    .mark{width:40px;height:40px;border-radius:12px;background:linear-gradient(135deg,${BRAND.primary},${BRAND.accent});color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;box-shadow:0 2px 8px rgba(20,184,166,.35)}
    .brand-name{font-size:18px;font-weight:800;letter-spacing:-.02em}
    .brand-sub{font-size:11px;color:${BRAND.muted}}
    .doc-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:${BRAND.dark}}
    .doc-meta{font-size:11px;color:${BRAND.muted};margin-top:4px}
    .body{padding:26px 36px}
    .card{border:1px solid ${BRAND.border};border-radius:14px;padding:16px 18px;background:#fff}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
    .label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:${BRAND.muted};margin-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:14px}
    th,td{text-align:left;padding:10px 10px;border-bottom:1px solid ${BRAND.border}}
    th{font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:${BRAND.muted};background:${BRAND.canvas}}
    .right{text-align:right}
    .badge{display:inline-block;padding:3px 12px;border-radius:999px;background:rgba(20,184,166,.12);color:${BRAND.accent};font-size:11px;font-weight:700}
    .total-line{font-size:15px;font-weight:800;margin-top:14px;text-align:right}
    .muted{color:${BRAND.muted}}
    .center{text-align:center}
    .qr-img{width:240px;height:240px;border:1px solid ${BRAND.border};border-radius:16px;padding:10px;background:#fff}
    .foot{margin-top:36px;padding:14px 36px;border-top:1px solid ${BRAND.border};font-size:11px;color:${BRAND.muted};display:flex;justify-content:space-between}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
  <div class="head">
    <div class="brand">
      <div class="mark">R</div>
      <div>
        <div class="brand-name">RestoHub</div>
        <div class="brand-sub">${restaurantName}</div>
      </div>
    </div>
    <div style="text-align:right">
      <div class="doc-title">${title}</div>
      <div class="doc-meta">Généré le ${new Date().toLocaleDateString("fr-FR")}</div>
    </div>
  </div>
  <div class="body">${children}</div>
  <div class="foot"><span>${restaurantName} · RestoHub</span>${note ? `<span>${note}</span>` : ""}</div>
  <script>window.onload=function(){window.focus();window.print()}</script>
  </body></html>`;
}

function openDoc(html, fallback) {
  const win = window.open("", "_blank");
  if (!win) return fallback;
  win.document.write(html);
  win.document.close();
  return null;
}

function money(n) {
  return fmt(n);
}

/** Facture d'abonnement (historique de facturation). */
export function downloadSubscriptionPdf({ restaurantName, inv, planName }) {
  const number = inv.number || `SUB-${String(inv.id).padStart(4, "0")}`;
  const statusLabels = {
    active: "Actif",
    trialing: "Essai",
    past_due: "En retard",
    cancelled: "Annulé",
    expired: "Expiré",
  };
  const st = statusLabels[inv.status] || inv.status;
  const cycle = inv.billing_cycle === "yearly" ? "Annuel" : "Mensuel";
  const periodLabel = inv.starts_at && inv.ends_at
    ? `${new Date(inv.starts_at).toLocaleDateString("fr-FR")} → ${new Date(inv.ends_at).toLocaleDateString("fr-FR")}`
    : cycle;

  return openDoc(
    shell({
      title: "Facture d'abonnement",
      restaurantName,
      note: "RestoHub — Plateforme SaaS de gestion de restaurants",
      children: `
        <div class="grid">
          <div class="card">
            <div class="label">Numéro</div>
            <div style="font-weight:700">${number}</div>
            <div class="label" style="margin-top:10px">Plan</div>
            <div>${planName}</div>
          </div>
          <div class="card">
            <div class="label">Statut</div>
            <span class="badge">${st}</span>
            <div class="label" style="margin-top:10px">Cycle</div>
            <div>${cycle}</div>
          </div>
        </div>
        <table>
          <thead><tr><th>Désignation</th><th class="right">Période</th><th class="right">Montant</th></tr></thead>
          <tbody>
            <tr><td>Abonnement ${planName}</td><td class="right">${periodLabel}</td><td class="right" style="font-weight:700">${money(inv.amount)}</td></tr>
          </tbody>
        </table>
        <p class="total-line">Total : ${money(inv.amount)}</p>
      `,
    }),
    "Autorisez les pop-ups pour télécharger la facture"
  );
}

/** Facture / reçu de commande client. */
export function downloadOrderPdf({ restaurantName, order }) {
  const number = order.number || order.id;
  const items = order.items || [];
  const subtotal = order.subtotal != null ? order.subtotal : order.total - (order.delivery_fee || 0);
  const rows = items
    .map(
      (it) => `
        <tr>
          <td><span style="font-weight:700">${it.qty}×</span> ${it.name || ""}</td>
          <td class="right">${money((it.price || 0) * it.qty)}</td>
        </tr>`
    )
    .join("");

  return openDoc(
    shell({
      title: "Facture de commande",
      restaurantName,
      note: order.status || "",
      children: `
        <div class="grid">
          <div class="card">
            <div class="label">Commande</div>
            <div style="font-weight:700">#${number}</div>
            <div class="label" style="margin-top:10px">Date</div>
            <div>${order.date || "—"}</div>
          </div>
          <div class="card">
            <div class="label">Client</div>
            <div style="font-weight:700">${order.customer?.name || "—"}</div>
            <div class="muted">${order.customer?.phone || ""}</div>
            <div class="muted">${order.address && order.address !== "—" ? order.address : ""}</div>
          </div>
        </div>
        <table>
          <thead><tr><th>Produit</th><th class="right">Montant</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="2" class="muted">Aucun article</td></tr>'}</tbody>
        </table>
        <div style="margin-top:10px;text-align:right" class="muted">
          <div>Sous-total : ${money(subtotal)}</div>
          ${order.mode === "Livraison" ? `<div>Frais de livraison : ${money(order.delivery_fee || 0)}</div>` : ""}
          ${order.discount > 0 ? `<div>Réduction : -${money(order.discount)}</div>` : ""}
        </div>
        <p class="total-line">Total : ${money(order.total)}</p>
        <div style="margin-top:10px" class="muted">
          Mode : ${order.mode || "—"} · Paiement : ${order.payment || "—"}
        </div>
      `,
    }),
    "Autorisez les pop-ups pour imprimer le reçu"
  );
}

/** Feuille A4 du QR Code menu. */
export function downloadQrPdf({ restaurantName, url, qrDataUrl }) {
  return openDoc(
    shell({
      title: "QR Code du menu",
      restaurantName,
      note: "Scannez pour voir le menu",
      children: `
        <div class="center" style="padding:8px 0">
          <div class="card" style="display:inline-block;text-align:center">
            ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" class="qr-img" />` : ""}
            <p style="font-weight:700;font-size:16px;margin:12px 0 4px">${restaurantName}</p>
            <p class="muted" style="font-size:12px;margin:0">${url}</p>
          </div>
        </div>
      `,
    }),
    "Autorisez les pop-ups pour télécharger le QR Code"
  );
}