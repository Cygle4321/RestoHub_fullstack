import { useState, useEffect } from "react";
import { Gift, Sparkles, Check } from "lucide-react";
import { Modal, Button, Input, Toggle, useToast } from "../ui";
import { restaurantApi } from "../../api/restaurant";

export default function LoyaltySettingsModal({ open, onClose, onSaved }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    enabled: true,
    threshold: 5,
    reward_title: "Une boisson offerte",
  });

  useEffect(() => {
    if (!open) return;
    let isCurrent = true;
    setFetching(true);
    restaurantApi
      .loyaltySettings()
      .then((res) => {
        if (!isCurrent) return;
        const s = res.settings || res.data?.settings || res.data || res;
        setSettings({
          enabled: s.enabled ?? true,
          threshold: s.threshold ?? 5,
          reward_title: s.reward_title || "Une boisson offerte",
        });
        setFetching(false);
      })
      .catch(() => {
        if (!isCurrent) return;
        setFetching(false);
      });
    return () => {
      isCurrent = false;
    };
  }, [open]);

  const handleSave = async () => {
    if (!settings.reward_title.trim()) {
      toast("Veuillez indiquer le cadeau offert", "error");
      return;
    }
    setLoading(true);
    try {
      await restaurantApi.updateLoyaltySettings({
        enabled: Boolean(settings.enabled),
        threshold: Math.max(2, Math.min(20, Number(settings.threshold) || 5)),
        reward_title: settings.reward_title.trim(),
      });
      toast("Programme de fidélité mis à jour avec succès !", "success");
      if (onSaved) onSaved(settings);
      onClose();
    } catch (e) {
      toast(e?.message || "Erreur lors de l'enregistrement", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Gift size={18} className="text-emerald-600" />
          <span>Configuration de la Carte de Fidélité Digitale</span>
        </div>
      }
      size="md"
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave} disabled={loading || fetching}>
            {loading ? "Enregistrement…" : "Enregistrer les paramètres"}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-xs text-emerald-900 leading-relaxed">
          <p className="font-bold flex items-center gap-1.5 mb-1">
            <Sparkles size={14} className="text-emerald-600 shrink-0" />
            Fidélisation automatique sans carte papier
          </p>
          <p className="text-emerald-800">
            Chaque fois qu'un client passe commande avec son numéro de téléphone, ses tampons augmentent automatiquement. Lorsqu'il atteint le palier requis, sa récompense est débloquée.
          </p>
        </div>

        <div className="flex items-center justify-between border-y border-zinc-100 py-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Activer le programme de fidélité</p>
            <p className="text-xs text-zinc-500">
              Affiche les tampons et récompenses automatiques aux clients
            </p>
          </div>
          <Toggle
            checked={settings.enabled}
            onChange={(val) => setSettings((s) => ({ ...s, enabled: val }))}
          />
        </div>

        {settings.enabled && (
          <div className="space-y-3 pt-1">
            <Input
              label="Nombre de commandes pour obtenir la récompense (tampons)"
              type="number"
              min="2"
              max="20"
              value={settings.threshold}
              onChange={(e) => setSettings((s) => ({ ...s, threshold: e.target.value }))}
              hint="Exemple : 5 (la 5e commande donne droit à la récompense)"
            />

            <Input
              label="Récompense ou cadeau offert"
              value={settings.reward_title}
              onChange={(e) => setSettings((s) => ({ ...s, reward_title: e.target.value }))}
              placeholder="Ex : Une boisson offerte, Un dessert offert, -10% de réduction"
              hint="Ce texte sera affiché sur la carte de fidélité et lors du passage de commande."
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
