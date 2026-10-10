import { useEffect, useState, useCallback } from "react";
import {
  Download,
  Copy,
  Check,
  Share2,
  FileText,
  Loader2,
  Sparkles,
  Smartphone,
} from "lucide-react";
import { Modal, Button, Badge } from "../ui";
import {
  generateTicketImage,
  downloadTicketImage,
  copyTicketImageToClipboard,
  shareTicketFile,
} from "../../lib/ticketGenerator";
import { waLink, generateOrderReceipt } from "../../lib/whatsapp";

/**
 * Modal d'affichage et de partage du ticket / reçu de commande sous forme d'image.
 * - Priorité 1 : Partage direct de l'image (Web Share API sur smartphone / WhatsApp)
 * - Condition de repli : Si le partage direct de l'image n'est pas supporté (sur PC/navigateur desktop),
 *   permet de copier l'image dans le presse-papier (Ctrl+V dans WhatsApp), de la télécharger en PNG,
 *   OU d'envoyer le reçu texte complet sur WhatsApp.
 */
export default function ReceiptTicketModal({
  open,
  onClose,
  order,
  restaurant,
  storeSlug = "",
  customerPhone = "",
}) {
  const [ticketData, setTicketData] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareNotice, setShareNotice] = useState("");

  const num = order?.number || order?.id || "CMD-000";
  const phone = customerPhone || order?.customer?.phone || order?.customer_phone || "";

  // Génération du ticket dès l'ouverture du modal
  useEffect(() => {
    if (!open || !order) return;
    let isCurrent = true;

    setGenerating(true);
    setShareNotice("");
    setCopied(false);

    generateTicketImage({
      order,
      restaurant,
      storeSlug,
    })
      .then((res) => {
        if (!isCurrent) return;
        setTicketData(res);
        setGenerating(false);
      })
      .catch((err) => {
        console.error("Erreur génération ticket:", err);
        if (!isCurrent) return;
        setGenerating(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [open, order, restaurant, storeSlug]);

  // Télécharger l'image PNG
  const handleDownload = useCallback(() => {
    if (!ticketData?.dataUrl) return;
    downloadTicketImage(ticketData.dataUrl, num);
  }, [ticketData, num]);

  // Copier l'image dans le presse-papier
  const handleCopyImage = useCallback(async () => {
    if (!ticketData?.blob) return;
    const ok = await copyTicketImageToClipboard(ticketData.blob);
    if (ok) {
      setCopied(true);
      setShareNotice("Image copiée ! Vous pouvez la coller directement (Ctrl+V) dans votre conversation WhatsApp.");
      setTimeout(() => setCopied(false), 4000);
    } else {
      setShareNotice("Impossible de copier automatiquement l'image. Utilisez le bouton Télécharger.");
    }
  }, [ticketData]);

  // Partager l'image directement (smartphone / WhatsApp natif)
  const handleShareImage = useCallback(async () => {
    if (!ticketData?.file) return;
    setSharing(true);
    setShareNotice("");

    const shareRes = await shareTicketFile({
      file: ticketData.file,
      title: `Ticket de commande #${num}`,
      text: `Voici mon ticket de commande #${num} chez ${restaurant?.name || "le restaurant"} 🍲`,
    });

    setSharing(false);

    if (shareRes.supported && shareRes.success) {
      // Partage natif réussi
      return;
    }

    if (shareRes.cancelled) {
      // Annulé par l'utilisateur
      return;
    }

    // Condition de repli : le partage de fichier n'est pas supporté par ce navigateur (ex: PC de bureau)
    // On copie l'image et on ouvre WhatsApp avec le lien
    const copyOk = await copyTicketImageToClipboard(ticketData.blob);
    const textFallback = generateOrderReceipt({
      order,
      restaurantName: restaurant?.name || "RestoHub",
      storeSlug,
    });

    if (copyOk) {
      setShareNotice("Image copiée dans le presse-papier ! Ouverture de WhatsApp… Il vous suffit de faire Coller (Ctrl+V).");
      setTimeout(() => {
        window.open(waLink(phone, `👋 Bonjour ! Voici le reçu de ma commande #${num}`), "_blank", "noopener");
      }, 600);
    } else {
      // Repli texte direct
      setShareNotice("Partage direct d'image non supporté sur ce navigateur. Ouverture du reçu par texte sur WhatsApp…");
      setTimeout(() => {
        window.open(waLink(phone, textFallback), "_blank", "noopener");
      }, 600);
    }
  }, [ticketData, num, restaurant, order, storeSlug, phone]);

  // Envoyer le reçu au format texte WhatsApp (fallback garanti)
  const handleSendTextReceipt = useCallback(() => {
    const text = generateOrderReceipt({
      order,
      restaurantName: restaurant?.name || "RestoHub",
      storeSlug,
    });
    window.open(waLink(phone, text), "_blank", "noopener");
  }, [order, restaurant, storeSlug, phone]);

  if (!open) return null;

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.canShare === "function";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Ticket & Reçu de commande</span>
          <Badge variant="primary">{num}</Badge>
        </div>
      }
      size="md"
      footer={
        <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Fermer
          </Button>

          <div className="flex w-full sm:w-auto flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              disabled={generating || !ticketData}
              className="flex-1 sm:flex-none"
            >
              <Download size={15} />
              <span>Télécharger</span>
            </Button>

            <button
              type="button"
              onClick={handleShareImage}
              disabled={generating || !ticketData || sharing}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              {sharing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Share2 size={15} />
              )}
              <span>Partager sur WhatsApp</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Notice d'information ou notification d'action */}
        {shareNotice ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs text-emerald-800 transition-all">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-emerald-600" />
              <div className="flex-1">
                <p className="font-semibold">{shareNotice}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl bg-zinc-50 border border-zinc-100 p-3 text-xs text-zinc-600">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-zinc-400" />
              <span>
                {canNativeShare
                  ? "Image optimisée pour le partage WhatsApp & réseaux"
                  : "Téléchargez l'image ou collez-la directement dans WhatsApp"}
              </span>
            </div>
            <span className="font-mono font-bold text-zinc-800">#{num}</span>
          </div>
        )}

        {/* Aperçu du ticket généré en haute résolution */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-zinc-100/70 p-3 sm:p-5 border border-zinc-200/80 min-h-[320px]">
          {generating ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-zinc-500">
              <Loader2 size={28} className="animate-spin text-primary-600" />
              <p className="text-sm font-medium">Génération de votre ticket haute définition…</p>
              <p className="text-xs text-zinc-400">Intégration du numéro et du QR code de suivi</p>
            </div>
          ) : ticketData?.dataUrl ? (
            <div className="group relative max-w-full overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-zinc-200/60">
              <img
                src={ticketData.dataUrl}
                alt={`Ticket commande ${num}`}
                className="max-h-[460px] w-auto max-w-full object-contain mx-auto"
              />
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-zinc-400">
              Impossible de générer l'aperçu du ticket.
            </div>
          )}
        </div>

        {/* Actions secondaires rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={generating || !ticketData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Image copiée !" : "Copier l'image (Ctrl+V)"}</span>
          </button>

          <button
            type="button"
            onClick={handleSendTextReceipt}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:border-zinc-300"
          >
            <FileText size={14} className="text-zinc-500" />
            <span>Envoyer reçu texte WhatsApp</span>
          </button>
        </div>

        {/* Petit rappel sur le suivi */}
        <p className="text-center text-[11px] text-zinc-400">
          Ce ticket contient le numéro officiel <strong className="text-zinc-600">#{num}</strong> et un QR Code permettant au destinataire de suivre l'état de la commande en temps réel.
        </p>
      </div>
    </Modal>
  );
}
