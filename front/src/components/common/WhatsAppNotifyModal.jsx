import { useState, useEffect } from "react";
import {
  MessageCircle,
  Copy,
  Check,
  Send,
  Receipt,
  Bike,
  ChefHat,
  Sparkles,
  ShoppingBag,
  Users,
  Smartphone,
} from "lucide-react";
import { Modal, Button, Textarea, Input, useToast } from "../ui";
import {
  waLink,
  normalizePhone,
  generateOrderReceipt,
  generateOrderStatusMessage,
  generateGroupShareMessage,
} from "../../lib/whatsapp";

export default function WhatsAppNotifyModal({
  open,
  onClose,
  order,
  restaurantName = "RestoHub",
  storeSlug = "",
  initialStatus,
}) {
  const toast = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState("status");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialisation à l'ouverture
  useEffect(() => {
    if (!order || !open) return;
    const clientPhone = order.customer?.phone || order.customer_phone || "";
    setPhone(clientPhone);

    const targetStatus = initialStatus || order.status || "Confirmée";
    const defaultText = generateOrderStatusMessage({
      order,
      status: targetStatus,
      restaurantName,
      storeSlug,
    });
    setMessage(defaultText);
    setSelectedTemplate("status");
    setCopied(false);
  }, [order, open, initialStatus, restaurantName, storeSlug]);

  if (!order) return null;

  const isGroup = Boolean(order.group_code || order.is_group_order);

  const applyTemplate = (type) => {
    setSelectedTemplate(type);
    let nextText = "";
    switch (type) {
      case "status":
        nextText = generateOrderStatusMessage({
          order,
          status: order.status,
          restaurantName,
          storeSlug,
        });
        break;
      case "receipt":
        nextText = generateOrderReceipt({
          order,
          restaurantName,
          storeSlug,
        });
        break;
      case "preparing":
        nextText = generateOrderStatusMessage({
          order,
          status: "En préparation",
          restaurantName,
          storeSlug,
        });
        break;
      case "delivering":
        nextText = generateOrderStatusMessage({
          order,
          status: "En livraison",
          restaurantName,
          storeSlug,
        });
        break;
      case "ready":
        nextText = generateOrderStatusMessage({
          order,
          status: "Prête",
          restaurantName,
          storeSlug,
        });
        break;
      case "delivered":
        nextText = generateOrderStatusMessage({
          order,
          status: "Livrée",
          restaurantName,
          storeSlug,
        });
        break;
      case "group_share":
        nextText = generateGroupShareMessage({
          order,
          restaurantName,
          storeSlug,
        });
        break;
      default:
        break;
    }
    if (nextText) setMessage(nextText);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast("Message copié dans le presse-papier !", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Impossible de copier automatiquement", "error");
    }
  };

  const handleSendWhatsApp = () => {
    if (!message.trim()) {
      toast("Le message est vide", "warning");
      return;
    }
    const link = waLink(phone, message);
    window.open(link, "_blank", "noopener");
    toast("WhatsApp ouvert !", "success");
    if (onClose) onClose();
  };

  const customerName = order.customer?.name || order.customer_name || "Client";
  const normPhone = normalizePhone(phone);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Notification WhatsApp — #${order.number || order.id} (${customerName})`}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          <Button variant="secondary" onClick={handleCopy} className="gap-1.5 text-xs">
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Copié !" : "Copier le message"}</span>
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
            >
              <Send size={15} />
              <span>Envoyer sur WhatsApp</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Infos Destinataire */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3.5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <Smartphone size={18} />
            </span>
            <div>
              <p className="text-xs font-bold text-zinc-900">{customerName}</p>
              <p className="text-[11px] font-mono text-zinc-500">
                {phone || "Aucun numéro renseigné"}
                {normPhone && <span className="ml-1 text-emerald-700 font-semibold">({normPhone})</span>}
              </p>
            </div>
          </div>
          <div className="w-40 sm:w-48">
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Modifier n° tél"
              className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Sélection rapide du modèle */}
        <div>
          <label className="mb-1.5 block text-xs font-bold text-zinc-700">
            Modèles de messages rapides :
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => applyTemplate("status")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                selectedTemplate === "status"
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              <Sparkles size={12} />
              <span>Statut : {order.status}</span>
            </button>

            <button
              type="button"
              onClick={() => applyTemplate("receipt")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                selectedTemplate === "receipt"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <Receipt size={12} />
              <span>Reçu complet</span>
            </button>

            <button
              type="button"
              onClick={() => applyTemplate("preparing")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                selectedTemplate === "preparing"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100"
              }`}
            >
              <ChefHat size={12} />
              <span>En préparation</span>
            </button>

            <button
              type="button"
              onClick={() => applyTemplate("delivering")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                selectedTemplate === "delivering"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-blue-50 text-blue-800 hover:bg-blue-100"
              }`}
            >
              <Bike size={12} />
              <span>En livraison</span>
            </button>

            <button
              type="button"
              onClick={() => applyTemplate("ready")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                selectedTemplate === "ready"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "bg-purple-50 text-purple-800 hover:bg-purple-100"
              }`}
            >
              <ShoppingBag size={12} />
              <span>Prête</span>
            </button>

            <button
              type="button"
              onClick={() => applyTemplate("delivered")}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                selectedTemplate === "delivered"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "bg-teal-50 text-teal-800 hover:bg-teal-100"
              }`}
            >
              <Check size={12} />
              <span>Livrée / Avis</span>
            </button>

            {isGroup && (
              <button
                type="button"
                onClick={() => applyTemplate("group_share")}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                  selectedTemplate === "group_share"
                    ? "bg-primary-600 text-white shadow-xs"
                    : "bg-primary-50 text-primary-800 hover:bg-primary-100"
                }`}
              >
                <Users size={12} />
                <span>Partage Groupe</span>
              </button>
            )}
          </div>
        </div>

        {/* Aperçu / Édition du message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-zinc-700">
              Message à envoyer (modifiable avant envoi) :
            </label>
            <span className="text-[11px] text-zinc-400">
              {message.length} caractères
            </span>
          </div>
          <textarea
            rows={10}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-2xl border border-zinc-200 bg-white p-3.5 font-sans text-xs leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>

        {/* Note d'aide */}
        <p className="text-[11px] text-zinc-500 leading-snug">
          💡 En cliquant sur <strong>Envoyer sur WhatsApp</strong>, la discussion WhatsApp s'ouvrira directement avec ce texte pré-rempli sur votre téléphone ou WhatsApp Web.
        </p>
      </div>
    </Modal>
  );
}
