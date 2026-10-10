import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Sparkles, ArrowRight, Share2, Calculator, UtensilsCrossed, CheckCircle2 } from "lucide-react";
import { Modal, Button, Input, useToast } from "../ui";
import { storeApi } from "../../api/store";

export default function GroupOrderModal({ open, onClose, slug = "demo" }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("create"); // "create" | "join"
  const [organizerName, setOrganizerName] = useState(() => localStorage.getItem("restohub_user_name") || "");
  const [groupTitle, setGroupTitle] = useState("Pause Déjeuner Bureau");
  const [customCode, setCustomCode] = useState(() => `GRP-${Math.floor(100 + Math.random() * 900)}`);
  const [creating, setCreating] = useState(false);
  const lastGroupCode = typeof localStorage !== "undefined" ? localStorage.getItem("restohub_last_group_code") : null;

  // Pour rejoindre
  const [joinCode, setJoinCode] = useState("");
  const [joinName, setJoinName] = useState(() => localStorage.getItem("restohub_user_name") || "");

  const handleCreate = async (e) => {
    e?.preventDefault();
    const cleanHost = organizerName.trim() || "Moi";
    const cleanCode = (customCode.trim() || `GRP-${Math.floor(100 + Math.random() * 900)}`).toUpperCase();
    const cleanTitle = groupTitle.trim() || "Pause Déjeuner Bureau";

    localStorage.setItem("restohub_user_name", cleanHost);
    localStorage.setItem("restohub_last_group_code", cleanCode);
    localStorage.setItem(`restohub_group_host_${cleanCode}`, "true");

    const initialData = {
      code: cleanCode,
      name: cleanTitle,
      host: cleanHost,
      isLocked: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
      items: [],
    };

    localStorage.setItem(`restohub_group_${cleanCode}`, JSON.stringify(initialData));
    window.dispatchEvent(new Event("storage"));

    setCreating(true);
    try {
      if (slug && slug !== "demo") {
        const res = await storeApi.createGroup(slug, {
          host_name: cleanHost,
          title: cleanTitle,
          code: cleanCode,
        });
        if (res && res.code) {
          localStorage.setItem(`restohub_group_${res.code}`, JSON.stringify(res));
        }
      }
    } catch (err) {
      console.warn("Backend group creation fallback to local", err);
    } finally {
      setCreating(false);
    }

    toast(`Salon ${cleanCode} créé avec succès !`);
    onClose();
    navigate(`/store/${slug}/group/${cleanCode}`);
  };

  const handleJoin = (e) => {
    e?.preventDefault();
    if (!joinCode.trim()) {
      toast("Veuillez saisir le code du salon", "error");
      return;
    }
    const cleanCode = joinCode.trim().toUpperCase();
    const cleanName = joinName.trim() || "Invité";

    localStorage.setItem("restohub_user_name", cleanName);
    localStorage.setItem("restohub_last_group_code", cleanCode);
    toast(`Connexion au salon ${cleanCode}…`);
    onClose();
    navigate(`/store/${slug}/group/${cleanCode}`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Commande Groupée"
      subtitle="Fini la galère des commandes au bureau : commandez ensemble en toute simplicité"
      size="md"
    >
      <div className="space-y-5">
        {lastGroupCode && (
          <div className="flex items-center justify-between rounded-2xl bg-primary-50/80 border border-primary-200/70 p-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary-600 text-white font-mono font-bold text-[10px]">
                {lastGroupCode.slice(0, 3)}
              </span>
              <div>
                <p className="font-bold text-zinc-900">Dernier salon visité : {lastGroupCode}</p>
                <p className="text-[11px] text-zinc-500">Reprendre ce salon d'équipe</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/store/${slug}/group/${lastGroupCode}`);
              }}
              className="rounded-lg bg-primary-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-700 active:scale-95"
            >
              Y aller →
            </button>
          </div>
        )}

        {/* Switch Onglets */}
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("create")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              activeTab === "create"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Sparkles size={14} className="text-primary-500" />
            <span>Créer un nouveau salon</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("join")}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
              activeTab === "join"
                ? "bg-white text-zinc-900 shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Users size={14} className="text-primary-500" />
            <span>Rejoindre un code</span>
          </button>
        </div>

        {activeTab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Input
                label="Votre prénom (Organisateur)"
                value={organizerName}
                onChange={(e) => setOrganizerName(e.target.value)}
                placeholder="Ex : Moussa, Aïcha, Jean…"
                required
                autoFocus
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Vous serez désigné comme l'organisateur qui validera la commande finale.
              </p>
            </div>

            <div>
              <Input
                label="Titre ou nom du groupe"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder="Ex : Pause Déjeuner Bureau Tech"
              />
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-zinc-700">Code du salon</p>
                <p className="text-[11px] text-zinc-400">Code unique partageable à vos collègues</p>
              </div>
              <span className="font-mono text-sm font-black text-primary-600 tracking-wider">
                {customCode}
              </span>
            </div>

            <Button type="submit" disabled={creating} className="w-full py-3 text-sm font-bold shadow-md">
              <span>{creating ? "Création du salon en cours…" : "Créer le salon & Inviter mes collègues"}</span>
              <ArrowRight size={15} />
            </Button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <Input
                label="Code du salon partagé"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Ex : GRP-101 ou GRP-482"
                required
                autoFocus
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Saisissez le code reçu par WhatsApp de la part de votre collègue.
              </p>
            </div>

            <div>
              <Input
                label="Votre prénom"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                placeholder="Ex : Aïcha, Dr. Touré…"
                required
              />
              <p className="mt-1 text-[11px] text-zinc-400">
                Ce prénom sera collé sur votre barquette repas en cuisine.
              </p>
            </div>

            <Button type="submit" className="w-full py-3 text-sm font-bold shadow-md">
              <span>Rejoindre le salon</span>
              <ArrowRight size={15} />
            </Button>
          </form>
        )}

        {/* 3 micro-avantages */}
        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3.5 space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">
            Comment ça marche ?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-zinc-600">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-primary-500 shrink-0 mt-0.5" />
              <span>Partage 1-clic sur WhatsApp</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-primary-500 shrink-0 mt-0.5" />
              <span>Plats étiquetés au prénom</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 size={13} className="text-primary-500 shrink-0 mt-0.5" />
              <span>Calcul des quotes-parts auto</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
