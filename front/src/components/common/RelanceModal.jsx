import { useState, useEffect } from "react";
import {
  MessageCircle,
  Copy,
  Check,
  Sparkles,
  Tag,
  Flame,
  Send,
  Phone,
  Gift,
} from "lucide-react";
import { Modal, Button, Badge, Input, Textarea, useToast } from "../ui";
import { restaurantApi } from "../../api/restaurant";

export default function RelanceModal({ open, onClose, customer, restaurant }) {
  const toast = useToast();
  const [code, setCode] = useState("REVIENS10");
  const [discount, setDiscount] = useState(10);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [waUrl, setWaUrl] = useState("");

  const restoName = restaurant?.name || "Notre Restaurant";
  const storeSlug = restaurant?.slug || "";
  const storeUrl = typeof window !== "undefined"
    ? `${window.location.origin}/store/${storeSlug}`
    : `/store/${storeSlug}`;

  // Génération du texte par défaut dès l'ouverture
  useEffect(() => {
    if (!open || !customer) return;

    const dish = customer.favorite_dish || "vos plats préférés";
    const days = customer.days_since_last_order ?? 15;

    const defaultMsg =
      `👋 Bonjour ${customer.name} !\n\n` +
      `Votre plat préféré *${dish}* vous attend chez *${restoName}* 🍲 !\n` +
      `Cela fait déjà ${days} jours que nous ne vous avons pas vu.\n\n` +
      `🎁 Pour votre retour, profitez de *-${discount}%* sur votre prochaine commande avec le code promo exclusif *${code}* !\n\n` +
      `👉 Commandez en 1 clic ici : ${storeUrl}\n\n` +
      `À très vite chez ${restoName} !`;

    setMessage(defaultMsg);

    const rawPhone = (customer.phone || "").replace(/[^0-9]/g, "");
    setWaUrl(`https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(defaultMsg)}`);
  }, [open, customer, restoName, storeUrl, code, discount]);

  const handleUpdateMessage = (newText) => {
    setMessage(newText);
    const rawPhone = (customer?.phone || "").replace(/[^0-9]/g, "");
    setWaUrl(`https://api.whatsapp.com/send?phone=${rawPhone}&text=${encodeURIComponent(newText)}`);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast("Message copié dans le presse-papier !", "success");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast("Impossible de copier automatiquement", "error");
    }
  };

  const handleSendWhatsApp = async () => {
    if (!customer?.id) return;
    setLoading(true);
    try {
      // Enregistre ou active la promotion sur le serveur
      await restaurantApi.relanceCustomer(customer.id, {
        code,
        discount: Number(discount) || 10,
      });

      // Ouvre WhatsApp avec le message
      window.open(waUrl, "_blank", "noopener");
      toast(`Relance initiée pour ${customer.name} !`, "success");
      onClose();
    } catch (e) {
      // Même en cas d'erreur API réseau, on permet d'ouvrir WhatsApp
      window.open(waUrl, "_blank", "noopener");
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!open || !customer) return null;

  const days = customer.days_since_last_order ?? 0;
  const dish = customer.favorite_dish;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span>Relance Client Automatique</span>
          <Badge variant="warning">{customer.name}</Badge>
        </div>
      }
      size="md"
      footer={
        <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-2.5">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-full sm:w-auto">
            Annuler
          </Button>

          <div className="flex w-full sm:w-auto flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              className="flex-1 sm:flex-none"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? "Copié !" : "Copier le texte"}</span>
            </Button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={loading}
              className="inline-flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50"
            >
              <Send size={15} />
              <span>Envoyer sur WhatsApp</span>
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Encart profil & plat favori */}
        <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
                <Flame size={18} />
              </span>
              <div>
                <p className="font-bold text-gray-900 text-sm">{customer.name}</p>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  <Phone size={12} /> {customer.phone}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                Inactif depuis {days} jours
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-700">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-amber-600 shrink-0" />
              <span>
                Plat favori : <strong className="text-gray-900">{dish || "Non déterminé"}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gift size={14} className="text-amber-600 shrink-0" />
              <span>
                Commandes passées : <strong className="text-gray-900">{customer.orders_count || 0}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Paramètres de l'offre de relance */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Code Promo Offert"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Ex : REVIENS10"
          />
          <Input
            label="Remise Offerte (%)"
            type="number"
            min="5"
            max="50"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="Ex : 10"
          />
        </div>

        {/* Aperçu et personnalisation du message */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
            <span>Message WhatsApp personnalisé (modifiable)</span>
            <span className="text-[11px] text-gray-400 font-normal">Prêt à envoyer en 1 clic</span>
          </label>
          <Textarea
            rows={7}
            value={message}
            onChange={(e) => handleUpdateMessage(e.target.value)}
            className="font-sans text-xs leading-relaxed"
          />
        </div>

        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-2.5 text-[11px] text-emerald-800 flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-600 shrink-0" />
          <span>
            Le code <strong>{code}</strong> ({discount}%) sera automatiquement activé sur votre boutique pour que le client puisse l'utiliser immédiatement.
          </span>
        </div>
      </div>
    </Modal>
  );
}
