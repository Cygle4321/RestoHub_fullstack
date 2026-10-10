import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Users,
  Share2,
  Copy,
  Lock,
  Unlock,
  Clock,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight,
  UtensilsCrossed,
  CheckCircle2,
  UserCheck,
  Calculator,
  Search,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
  MessageCircle,
  Tag,
  Info,
  BadgePercent,
  RotateCcw,
  Star,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  EmptyState,
  Input,
  Modal,
  SearchInput,
  Spinner,
  useToast,
} from "../../components/ui";
import { useStore } from "../../store/StoreContext";
import { useCart } from "../../store/CartContext";
import { fmt } from "../../lib/mappers";
import SEO from "../../components/common/SEO";
import { storeApi } from "../../api/store";
import { waLink } from "../../lib/whatsapp";
import GroupOrderModal from "../../components/common/GroupOrderModal";

// Helper de persistance synchrone locale pour synchroniser entre onglets
function getStoredGroup(code, defaultHost = "Moussa") {
  const key = `restohub_group_${code}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fallback */
  }
  return {
    code,
    name: "Pause Déjeuner Bureau",
    host: defaultHost,
    isLocked: false,
    createdAt: Date.now(),
    expiresAt: Date.now() + 2 * 60 * 60 * 1000, // 2 heures
    items: [],
  };
}

function saveStoredGroup(code, data) {
  try {
    localStorage.setItem(`restohub_group_${code}`, JSON.stringify(data));
    window.dispatchEvent(new Event("storage"));
  } catch {
    /* fallback */
  }
}

export default function GroupOrder() {
  const { code: rawCode, slug } = useParams();
  const code = (rawCode || "GRP-101").toUpperCase();
  const navigate = useNavigate();
  const toast = useToast();
  const { restaurant, products, catNames, loading: storeLoading } = useStore();
  const { add, clear } = useCart();

  const [group, setGroup] = useState(() => getStoredGroup(code));
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("restohub_user_name") || "");
  const [editingUserModal, setEditingUserModal] = useState(() => !localStorage.getItem("restohub_user_name"));
  const [tempUserName, setTempUserName] = useState(() => localStorage.getItem("restohub_user_name") || "");
  const [activeTab, setActiveTab] = useState("menu"); // "menu" | "cart" sur mobile
  const [selectedCat, setSelectedCat] = useState("Tout");
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedChoices, setSelectedChoices] = useState({});
  const [selectedSupps, setSelectedSupps] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [nowTime, setNowTime] = useState(() => Date.now());

  // Horloge temps réel (rafraîchit le compte à rebours et l'état d'expiration toutes les 15s)
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Mémorise le dernier code salon visité
  useEffect(() => {
    if (code) {
      localStorage.setItem("restohub_last_group_code", code);
    }
  }, [code]);

  // Détection d'expiration (2h ou session créée la veille)
  const isExpired = useMemo(() => {
    if (group?.status === "completed") return false;
    if (group?.status === "expired" || group?.isExpired) return true;
    if (group?.expiresAt && nowTime > group.expiresAt) return true;
    if (group?.createdAt && nowTime - group.createdAt > 12 * 3600 * 1000) return true;
    return false;
  }, [group, nowTime]);

  const timeLeftMinutes = useMemo(() => {
    if (!group?.expiresAt) return 0;
    const diff = group.expiresAt - nowTime;
    return Math.max(0, Math.round(diff / 60000));
  }, [group?.expiresAt, nowTime]);

  const fetchGroupData = async (silent = false) => {
    if (!slug || slug === "demo") return;
    try {
      if (!silent) setSyncing(true);
      const data = await storeApi.getGroup(slug, code);
      if (data && data.code) {
        setGroup(data);
        saveStoredGroup(code, data);
      }
    } catch (err) {
      if (!silent) {
        console.warn("Échec récupération salon backend:", err);
      }
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  // Synchronisation temps réel via Storage Event (onglets locaux)
  useEffect(() => {
    const handleStorage = () => {
      setGroup(getStoredGroup(code));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [code]);

  // Synchronisation réseau toutes les 3.5s (multi-smartphones WhatsApp)
  useEffect(() => {
    fetchGroupData(false);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        fetchGroupData(true);
      }
    }, 3500);

    const handleVisibility = () => {
      if (!document.hidden) {
        fetchGroupData(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [slug, code]);

  const handleResetGroup = async () => {
    if (!window.confirm("Voulez-vous réinitialiser ce salon ? Tous les plats actuels seront effacés et le délai sera renouvelé pour 2 heures.")) {
      return;
    }
    try {
      if (slug && slug !== "demo") {
        const res = await storeApi.resetGroup(slug, code);
        if (res && res.code) {
          updateGroupState(res);
          toast("Le salon a été réinitialisé à neuf !");
          return;
        }
      }
      const resetData = {
        ...group,
        items: [],
        isLocked: false,
        status: "open",
        isExpired: false,
        createdAt: Date.now(),
        expiresAt: Date.now() + 2 * 3600 * 1000,
      };
      updateGroupState(resetData);
      toast("Le salon a été réinitialisé à neuf !");
    } catch (err) {
      toast("Erreur lors de la réinitialisation", "error");
    }
  };

  const updateGroupState = (nextData) => {
    setGroup(nextData);
    saveStoredGroup(code, nextData);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://restohub.app/store/${slug}/group/${code}`;

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast("Lien copié dans le presse-papier !");
    } catch {
      toast("Partagez ce lien : " + shareUrl);
    }
  };

  const shareOnWhatsApp = () => {
    const rawText =
      `👋 Salut l'équipe ! Je prépare notre commande groupée chez *${restaurant?.name || "notre restaurant"}* pour le déjeuner 🍲.\n\n` +
      `👉 Cliquez ici pour ajouter votre plat à mon panier avant la clôture :\n${shareUrl}\n\n` +
      `Code du salon : *${code}*`;
    window.open(waLink("", rawText), "_blank", "noopener");
  };

  const shareRefundsWhatsApp = () => {
    const lines = [
      `📋 *Remboursements — Commande Groupée ${code}* (${restaurant?.name || "Restaurant"})`,
      `👑 Organisateur : *${group.host}*`,
      `💰 Total commande : *${fmt(grandTotal)}*`,
      `---------------------------------`,
      ...Object.entries(totalsByParticipant).map(([person, amt]) => `• *${person}* : *${fmt(amt)}*`),
      `---------------------------------`,
      `👉 Merci de régler votre part par Mobile Money ou votre moyen de paiement habituel à *${group.host}* ! Bon appétit l'équipe 🍲`,
    ];
    window.open(waLink("", lines.join("\n")), "_blank", "noopener");
  };

  const toggleLock = async () => {
    const nextLocked = !group.isLocked;
    const next = { ...group, isLocked: nextLocked };
    updateGroupState(next);
    toast(nextLocked ? "Salon clôturé aux nouveaux ajouts" : "Salon rouvert aux participants", nextLocked ? "info" : "success");

    if (slug && slug !== "demo") {
      try {
        const updated = await storeApi.toggleGroupLock(slug, code, nextLocked);
        if (updated) {
          updateGroupState(updated);
        }
      } catch (err) {
        toast("Erreur lors de la mise à jour du statut du salon", "error");
        fetchGroupData(true);
      }
    }
  };

  // Liste unique des participants actifs
  const participants = useMemo(() => {
    const set = new Set([group.host, currentUser]);
    (group.items || []).forEach((it) => set.add(it.participant));
    return Array.from(set).filter(Boolean);
  }, [group, currentUser]);

  const isHost = useMemo(() => {
    if (typeof localStorage !== "undefined" && localStorage.getItem(`restohub_group_host_${code}`) === "true") {
      return true;
    }
    if (!currentUser || !group?.host) return false;
    return currentUser.toLowerCase().trim() === group.host.toLowerCase().trim();
  }, [code, currentUser, group?.host]);

  // Regroupement des articles par participant
  const itemsByParticipant = useMemo(() => {
    const map = {};
    (group.items || []).forEach((it) => {
      const p = it.participant || "Autre";
      if (!map[p]) map[p] = [];
      map[p].push(it);
    });
    return map;
  }, [group.items]);

  // Calcul quote-part par personne
  const totalsByParticipant = useMemo(() => {
    const map = {};
    Object.entries(itemsByParticipant).forEach(([person, list]) => {
      const sum = list.reduce((total, it) => {
        const suppsSum = (it.supplements || []).reduce((s, x) => s + (x.price || 0), 0);
        const qty = it.quantity || 1;
        return total + (it.price + suppsSum) * qty;
      }, 0);
      map[person] = sum;
    });
    return map;
  }, [itemsByParticipant]);

  const grandTotal = useMemo(() => {
    return Object.values(totalsByParticipant).reduce((a, b) => a + b, 0);
  }, [totalsByParticipant]);

  // Gestion d'ajout d'article au salon
  const openProductConfig = (prod) => {
    if (group.status === "completed") {
      toast("La commande d'équipe a déjà été validée et envoyée en cuisine", "info");
      return;
    }
    if (isExpired) {
      toast("Ce salon a expiré. Créez un nouveau salon ou réinitialisez-le pour commander.", "warning");
      return;
    }
    if (group.isLocked) {
      toast("Le salon a été clôturé par l'organisateur", "error");
      return;
    }
    if (!currentUser || !currentUser.trim()) {
      setTempUserName("");
      setEditingUserModal(true);
      toast("Veuillez indiquer votre prénom afin d'étiqueter votre plat", "info");
      return;
    }
    const initChoices = {};
    (prod.options || []).forEach((o) => {
      initChoices[o.name] = o.choices?.[0] || "";
    });
    setSelectedProduct(prod);
    setSelectedChoices(initChoices);
    setSelectedSupps([]);
  };

  const confirmAddItem = async () => {
    if (!selectedProduct) return;
    const tempId = "temp_" + Date.now();
    const payloadOptions = Object.entries(selectedChoices).map(([name, choice]) => ({ name, choice }));
    const payloadSupps = (selectedProduct.supplements || []).filter((s) => selectedSupps.includes(s.name));

    const newItem = {
      id: tempId,
      productId: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      quantity: 1,
      participant: currentUser,
      options: payloadOptions,
      supplements: payloadSupps,
    };
    const next = { ...group, items: [...(group.items || []), newItem] };
    updateGroupState(next);
    toast(`Ajouté pour ${currentUser} !`);
    setSelectedProduct(null);

    if (slug && slug !== "demo") {
      try {
        const res = await storeApi.addGroupItem(slug, code, {
          product_id: selectedProduct.id,
          participant_name: currentUser,
          quantity: 1,
          options: payloadOptions,
          supplements: payloadSupps,
        });
        if (res && res.items) {
          updateGroupState(res);
        }
      } catch (err) {
        toast(err.message || "Erreur lors de la synchronisation au salon", "error");
        fetchGroupData(true);
      }
    }
  };

  const removeItem = async (itemId) => {
    if (group.status === "completed" || group.isLocked) {
      toast("Impossible de modifier une commande déjà validée ou clôturée", "error");
      return;
    }
    const next = { ...group, items: (group.items || []).filter((x) => x.id !== itemId) };
    updateGroupState(next);
    toast("Article retiré du groupe", "info");

    if (slug && slug !== "demo" && typeof itemId === "number") {
      try {
        const res = await storeApi.removeGroupItem(slug, code, itemId);
        if (res && res.items) {
          updateGroupState(res);
        }
      } catch (err) {
        toast("Erreur de synchronisation avec le serveur", "error");
        fetchGroupData(true);
      }
    }
  };

  // Convertir le panier de groupe en checkout RestoHub officiel
  const proceedToCheckout = () => {
    if (isExpired) {
      toast("Ce salon a expiré. Lancez un nouveau salon pour commander aujourd'hui.", "warning");
      return;
    }
    if (!isHost) {
      toast(`Seul l'organisateur (${group.host}) peut valider et passer la commande du groupe`, "warning");
      return;
    }
    if (!group.items || group.items.length === 0) {
      toast("Ajoutez au moins un plat avant de commander", "error");
      return;
    }
    clear();
    // Injecte tous les items avec l'annotation du participant
    group.items.forEach((it) => {
      add({
        id: it.productId,
        name: `${it.name} [${it.participant}]`,
        price: it.price + (it.supplements || []).reduce((s, x) => s + (x.price || 0), 0),
        options: it.options,
        supplements: it.supplements,
      }, it.quantity || 1);
    });

    toast("Panier groupé validé ! Redirection vers la livraison…");
    navigate(`/store/${slug}/checkout`, {
      state: {
        isGroupOrder: true,
        groupCode: code,
        hostName: group.host,
        groupNotes: `Commande groupée ${code} (${participants.length} personnes : ${participants.join(", ")})`,
      },
    });
  };

  const filteredProducts = (products || []).filter((p) => {
    const matchCat = selectedCat === "Tout" || p.category === selectedCat;
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  if (storeLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner label="Chargement du salon de commande…" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-4">
      <SEO
        title={`Commande Groupée ${code} — ${restaurant?.name || "Restaurant"}`}
        noindex
      />

      {/* Bannière Célébration si la commande a été validée */}
      {group.status === "completed" && (
        <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-white ring-1 ring-white/30">
              <CheckCircle2 size={26} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black">Commande Validée & En Cuisine !</h2>
                {group.order?.number && (
                  <span className="rounded-full bg-white/20 px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider text-white">
                    {group.order.number}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-emerald-100 leading-relaxed">
                L'organisateur <strong>{group.host}</strong> a validé la commande d'équipe. Le restaurant prépare actuellement vos boîtes repas étiquetées.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {group.order?.number && (
              <Link
                to={`/store/${slug}/track?number=${group.order.number}&phone=${group.order.customer_phone || ""}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-50 active:scale-95"
              >
                <span>Suivre la livraison en direct</span>
                <ArrowRight size={14} />
              </Link>
            )}
            <button
              onClick={shareRefundsWhatsApp}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/20"
            >
              <MessageCircle size={14} />
              <span>Quotes-parts WhatsApp</span>
            </button>
          </div>
        </div>
      )}

      {/* Bannière Salon Expiré */}
      {isExpired && group.status !== "completed" && (
        <div className="mb-6 overflow-hidden rounded-3xl border border-amber-300/60 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 p-5 sm:p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-700 ring-1 ring-amber-500/30">
              <Clock size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-zinc-900">Ce salon de commande a expiré</h2>
                <span className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold">
                  Délai dépassé
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-600 leading-relaxed max-w-xl">
                Ce salon a été créé il y a plus de 2 heures (ou la veille). Les ajouts sont verrouillés pour cette session. Vous pouvez lancer un nouveau salon pour la commande d'aujourd'hui ou réinitialiser le panier d'équipe.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 cursor-pointer"
            >
              <Sparkles size={15} />
              <span>Nouveau salon pour aujourd'hui</span>
            </button>
            {isHost && (
              <button
                onClick={handleResetGroup}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-zinc-700 shadow-xs transition hover:bg-zinc-50 active:scale-95 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Réinitialiser à neuf</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Banner : Salon de Commande */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950 p-4 sm:p-6 lg:p-8 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/20 px-2.5 py-1 text-xs font-bold text-primary-300 ring-1 ring-inset ring-primary-500/30">
                <Users size={12} /> Salon {code}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  group.status === "completed"
                    ? "bg-primary-500/20 text-primary-300 ring-1 ring-inset ring-primary-500/30"
                    : isExpired
                      ? "bg-rose-500/20 text-rose-300 ring-1 ring-inset ring-rose-500/30"
                      : group.isLocked
                        ? "bg-amber-500/20 text-amber-300"
                        : "bg-emerald-500/20 text-emerald-300"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    group.status === "completed"
                      ? "bg-primary-400"
                      : isExpired
                        ? "bg-rose-400"
                        : group.isLocked
                          ? "bg-amber-400"
                          : "animate-pulse bg-emerald-400"
                  }`}
                />
                {group.status === "completed"
                  ? "En cuisine ✓"
                  : isExpired
                    ? "Expiré"
                    : group.isLocked
                      ? "Clôturé"
                      : "Ouvert aux ajouts"}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs ${isExpired ? "text-rose-300 font-semibold" : "text-primary-300"}`}>
                <Clock size={12} />
                <span>
                  {group.status === "completed"
                    ? "Envoyé"
                    : isExpired
                      ? "Délai dépassé"
                      : `~${timeLeftMinutes} min`}
                </span>
              </span>
            </div>

            <h1 className="mt-2 text-xl font-black tracking-tight sm:text-2xl lg:text-3xl text-white">
              {group.name}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-zinc-300">
              Organisé par <strong className="text-white">{group.host}</strong> · <span className="text-zinc-400">{restaurant?.name || "Restaurant"}</span>
            </p>
          </div>

          {/* Actions d'invitation & gestion */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 sm:pt-0">
            {!isExpired && (
              <button
                onClick={shareOnWhatsApp}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
              >
                <MessageCircle size={16} />
                <span>Inviter sur WhatsApp</span>
              </button>
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={copyShareLink}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 active:scale-95"
                title="Copier le lien"
              >
                <Copy size={14} />
                <span>Copier lien</span>
              </button>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary-400/40 bg-primary-500/20 px-3 py-2 text-xs sm:text-sm font-bold text-primary-200 transition hover:bg-primary-500/30 active:scale-95 cursor-pointer"
                title="Créer un nouveau salon"
              >
                <Sparkles size={14} className="text-primary-300" />
                <span className="hidden xs:inline sm:inline">Nouveau</span>
              </button>

              {isHost && (
                <button
                  onClick={handleResetGroup}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
                  title="Réinitialiser le salon"
                >
                  <RotateCcw size={14} />
                </button>
              )}

              {isHost && !isExpired && (
                <button
                  onClick={toggleLock}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-2.5 py-2 text-xs sm:text-sm font-semibold text-zinc-300 transition hover:bg-white/10"
                  title={group.isLocked ? "Rouvrir le salon" : "Clôturer le salon"}
                >
                  {group.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Barre de participant actuel */}
        <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 sm:pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">Votre prénom :</span>
            <button
              onClick={() => {
                setTempUserName(currentUser);
                setEditingUserModal(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white transition hover:bg-white/25 active:scale-95 shadow-xs"
            >
              <span className="h-2 w-2 rounded-full bg-primary-400" />
              <span>{currentUser || "Entrez votre prénom"}</span>
              <span className="text-[10px] text-primary-300 underline underline-offset-2 ml-1">
                {currentUser ? "Modifier" : "Saisir"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span>Équipe ({participants.length}) :</span>
            <div className="flex -space-x-1.5 overflow-hidden">
              {participants.slice(0, 4).map((p) => (
                <span
                  key={p}
                  className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 ring-2 ring-zinc-900 text-[10px] font-bold text-white uppercase"
                  title={p}
                >
                  {p.slice(0, 2)}
                </span>
              ))}
              {participants.length > 4 && (
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-700 ring-2 ring-zinc-900 text-[10px] font-bold text-white">
                  +{participants.length - 4}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Switcher tabs sur Mobile (Sticky sous le header pour accès instantané pendant le scroll) */}
      <div className="sticky top-16 z-20 -mx-4 px-4 py-2 bg-white/95 backdrop-blur-md border-b border-zinc-200 flex lg:hidden shadow-xs gap-2">
        <button
          onClick={() => setActiveTab("menu")}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "menu" ? "bg-zinc-900 text-white shadow-xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <UtensilsCrossed size={14} />
          <span>Choisir mes plats</span>
        </button>
        <button
          onClick={() => setActiveTab("cart")}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "cart" ? "bg-zinc-900 text-white shadow-xs" : "bg-zinc-100 text-zinc-600 hover:text-zinc-900"
          }`}
        >
          <Users size={14} />
          <span>Panier d'équipe</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
            activeTab === "cart" ? "bg-primary-500 text-white" : "bg-primary-100 text-primary-800"
          }`}>
            {group.items.length}
          </span>
        </button>
      </div>

      {/* Grille Principale */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_390px] items-start">
        {/* Colonne 1 : Le Menu interactif */}
        <div className={`space-y-6 ${activeTab === "cart" ? "hidden lg:block" : "block"}`}>
          {/* Barre de filtre & recherche */}
          <div className="space-y-3">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher un plat pour vous…"
            />
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {catNames.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCat(c)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${selectedCat === c
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Grille des plats */}
          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <EmptyState
                icon={UtensilsCrossed}
                title="Aucun plat trouvé"
                description="Modifiez votre recherche ou explorez une autre catégorie."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-3">
              {filteredProducts.map((p) => (
                <Card key={p.id} className="group flex flex-col overflow-hidden" hover>
                  <div
                    onClick={() => openProductConfig(p)}
                    className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 to-orange-50 text-primary-300 transition group-hover:from-primary-100 group-hover:to-orange-100 cursor-pointer"
                  >
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <UtensilsCrossed size={32} strokeWidth={1.25} />
                    )}
                    {p.featured && (
                      <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary-600 shadow-xs backdrop-blur">
                        <Star size={9} className="fill-current" /> Populaire
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-2.5 sm:p-3.5">
                    <h3
                      onClick={() => openProductConfig(p)}
                      className="line-clamp-1 text-xs font-semibold text-zinc-900 transition group-hover:text-primary-700 sm:text-[13px] cursor-pointer"
                      title={p.name}
                    >
                      {p.name}
                    </h3>
                    <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-zinc-500">
                      {p.description}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-1.5">
                      <span className="min-w-0 truncate text-xs font-bold text-zinc-900 sm:text-sm">
                        {fmt(p.price)}
                      </span>
                      {!p.available && (
                        <Badge variant="danger" className="shrink-0 text-[10px] px-1.5 py-0.5">
                          Épuisé
                        </Badge>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProductConfig(p);
                      }}
                      disabled={group.isLocked || isExpired || !p.available}
                      className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-500 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-40"
                      title={currentUser ? `Ajouter pour ${currentUser}` : "Ajouter à mon nom"}
                    >
                      <Plus size={14} strokeWidth={2.5} className="shrink-0" />
                      <span className="truncate">{currentUser || "Moi"}</span>
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Colonne 2 : Panier d'Équipe & Quote-Part */}
        <div className={`space-y-4 lg:sticky lg:top-4 ${activeTab === "menu" ? "hidden lg:block" : "block"}`}>
          <Card className="overflow-hidden shadow-elevated">
            <div className="bg-zinc-900 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-primary-400" />
                <h2 className="text-sm font-bold">Panier d'Équipe</h2>
              </div>
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-bold">
                {group.items.length} plat(s)
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-5">
              {group.items.length === 0 ? (
                <div className="py-10 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-2">
                    <UtensilsCrossed size={20} />
                  </span>
                  <p className="text-sm font-bold text-zinc-800">Le panier est encore vide</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Cliquez sur "+ Moi" sur n'importe quel plat pour l'ajouter à votre nom.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
                  {Object.entries(itemsByParticipant).map(([person, list]) => {
                    const personTotal = totalsByParticipant[person] || 0;
                    const isMe = person === currentUser;
                    return (
                      <div key={person} className="rounded-2xl border border-zinc-200/80 bg-zinc-50/60 p-3.5">
                        <div className="flex items-center justify-between border-b border-zinc-200/60 pb-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white uppercase">
                              {person.slice(0, 2)}
                            </span>
                            <span className="text-xs font-bold text-zinc-900">
                              {person} {isMe && <span className="text-[10px] text-primary-600 font-semibold">(Vous)</span>}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-zinc-900">{fmt(personTotal)}</span>
                        </div>

                        <ul className="space-y-2">
                          {list.map((it) => {
                            const itemPrice = it.price + (it.supplements || []).reduce((s, x) => s + (x.price || 0), 0);
                            return (
                              <li key={it.id} className="flex items-start justify-between gap-2 text-xs">
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-zinc-800 truncate">{it.name}</p>
                                  {(it.options?.length > 0 || it.supplements?.length > 0) && (
                                    <p className="text-[10px] text-zinc-400 truncate">
                                      {[
                                        ...(it.options || []).map((o) => `${o.name}: ${o.choice}`),
                                        ...(it.supplements || []).map((s) => `+${s.name}`),
                                      ].join(" · ")}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-medium text-zinc-700">{fmt(itemPrice)}</span>
                                  {!group.isLocked && group.status !== "completed" && (isMe || currentUser === group.host) && (
                                    <button
                                      onClick={() => removeItem(it.id)}
                                      className="text-zinc-400 hover:text-danger-600 p-0.5 rounded transition"
                                      title="Supprimer"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Récapitulatif Quote-Part & Remboursement */}
              {group.items.length > 0 && (
                <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Calculator size={14} />
                    <span>Quote-part & Remboursements à l'organisateur</span>
                  </div>
                  <div className="divide-y divide-amber-200/50 text-xs">
                    {Object.entries(totalsByParticipant).map(([person, total]) => (
                      <div key={person} className="flex items-center justify-between py-1.5">
                        <span className="text-amber-800">{person} doit :</span>
                        <span className="font-bold text-amber-950">{fmt(total)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-800/90 pt-1 flex items-center gap-1.5">
                    <Info size={12} className="shrink-0 text-amber-700" />
                    <span>Chacun peut régler sa part par Mobile Money ou tout autre moyen de paiement à <strong>{group.host}</strong>.</span>
                  </p>
                  <button
                    type="button"
                    onClick={shareRefundsWhatsApp}
                    className="w-full mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
                  >
                    <MessageCircle size={14} />
                    <span>Partager le récapitulatif sur WhatsApp</span>
                  </button>
                </div>
              )}

              {/* Total & Checkout */}
              <div className="border-t border-zinc-100 pt-3 space-y-2">
                <div className="flex items-center justify-between text-base">
                  <span className="font-bold text-zinc-900">Total commande</span>
                  <span className="font-black text-xl text-primary-600">{fmt(grandTotal)}</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {participants.length} personne(s) · Livraison unique pour tout le groupe
                </p>

                {group.status === "completed" ? (
                  <Link
                    to={group.order?.number ? `/store/${slug}/track?number=${group.order.number}&phone=${group.order.customer_phone || ""}` : `/store/${slug}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95 text-center"
                  >
                    <CheckCircle2 size={16} />
                    <span>Commande validée · Suivre la livraison →</span>
                  </Link>
                ) : isExpired ? (
                  <div className="space-y-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-center">
                    <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-full bg-amber-200 text-amber-800">
                      <Clock size={16} />
                    </div>
                    <p className="text-xs font-bold text-amber-900">Ce salon a expiré</p>
                    <p className="text-[11px] text-amber-800 leading-relaxed">
                      La session d'équipe n'est plus active. Vous pouvez créer un nouveau salon pour aujourd'hui ou réinitialiser le panier.
                    </p>
                    <div className="pt-1 space-y-1.5">
                      <Button
                        onClick={() => setCreateModalOpen(true)}
                        className="w-full py-2.5 text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Sparkles size={13} />
                        <span>Nouveau salon pour aujourd'hui</span>
                      </Button>
                      {isHost && (
                        <Button
                          variant="outline"
                          onClick={handleResetGroup}
                          className="w-full py-2 text-xs font-semibold cursor-pointer"
                        >
                          <RotateCcw size={12} />
                          <span>Réinitialiser ce salon (+2h)</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ) : isHost ? (
                  <div className="space-y-1.5">
                    <Button
                      onClick={proceedToCheckout}
                      disabled={group.items.length === 0}
                      className="w-full py-3.5 text-sm font-bold shadow-md"
                    >
                      Passer la commande du groupe ({fmt(grandTotal)}) →
                    </Button>
                    <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-1.5 pt-0.5">
                      <BadgePercent size={13} className="text-primary-600" />
                      <span>Codes promo & réductions applicables à l'étape suivante</span>
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-primary-200/80 bg-primary-50/70 p-4 text-center space-y-2">
                    <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <Clock size={18} />
                    </div>
                    <p className="text-xs font-bold text-zinc-900">En attente de commande par {group.host}</p>
                    <p className="text-[11px] text-zinc-600 leading-relaxed">
                      Vos plats sont bien enregistrés dans le panier d'équipe. <strong>{group.host}</strong> (l'organisateur) validera et réglera la commande pour tout le bureau.
                    </p>
                    {totalsByParticipant[currentUser] > 0 && (
                      <div className="pt-2 border-t border-primary-200/50 flex items-center justify-between text-xs">
                        <span className="text-zinc-500 font-medium">Votre part à rembourser :</span>
                        <span className="font-extrabold text-primary-700">{fmt(totalsByParticipant[currentUser])}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Barre flottante du panier d'équipe sur mobile quand on parcourt le menu */}
      {group.items.length > 0 && activeTab === "menu" && (
        <div className="fixed bottom-4 inset-x-4 z-30 lg:hidden">
          <button
            type="button"
            onClick={() => setActiveTab("cart")}
            className="w-full flex items-center justify-between rounded-2xl bg-zinc-900 text-white px-4 py-3 shadow-2xl border border-zinc-800 active:scale-95 transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-black text-white">
                {group.items.length}
              </span>
              <span className="text-xs sm:text-sm font-bold truncate">
                Voir le panier d'équipe
              </span>
            </div>
            <span className="text-xs sm:text-sm font-black text-primary-400 shrink-0">
              {fmt(grandTotal)} →
            </span>
          </button>
        </div>
      )}

      {/* Modal Saisie / Changement de Prénom pour les collègues */}
      <Modal
        open={editingUserModal}
        onClose={() => {
          if (currentUser) setEditingUserModal(false);
          else toast("Veuillez indiquer votre prénom pour que la cuisine prépare votre repas", "warning");
        }}
        title={currentUser ? "Modifier votre prénom" : "Bienvenue dans la commande groupée !"}
        subtitle={
          currentUser
            ? "Ce prénom sera écrit sur vos boîtes repas en cuisine."
            : `${group.host ? `${group.host} prépare une commande` : "Commande d'équipe"} chez ${restaurant?.name || "le restaurant"}. Quel est votre prénom ?`
        }
        footer={
          <>
            {currentUser && (
              <Button variant="secondary" onClick={() => setEditingUserModal(false)}>
                Annuler
              </Button>
            )}
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                if (tempUserName.trim()) {
                  const clean = tempUserName.trim();
                  setCurrentUser(clean);
                  localStorage.setItem("restohub_user_name", clean);
                  toast(`Enchanté ${clean} ! Vous pouvez maintenant choisir votre plat.`);
                  setEditingUserModal(false);
                } else {
                  toast("Veuillez entrer votre prénom", "error");
                }
              }}
            >
              {currentUser ? "Valider" : "Rejoindre & Choisir mon plat →"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-3.5 flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white font-bold text-sm">
              <Tag size={16} />
            </span>
            <div className="text-xs text-primary-950">
              <p className="font-bold">Pourquoi votre prénom ?</p>
              <p className="mt-0.5 text-primary-800 leading-relaxed">
                Chaque barquette préparée en cuisine aura une étiquette avec votre prénom pour que chacun retrouve immédiatement son plat lors de la livraison au bureau.
              </p>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tempUserName.trim()) {
                const clean = tempUserName.trim();
                setCurrentUser(clean);
                localStorage.setItem("restohub_user_name", clean);
                toast(`Enchanté ${clean} !`);
                setEditingUserModal(false);
              }
            }}
          >
            <Input
              label="Votre prénom"
              value={tempUserName}
              onChange={(e) => setTempUserName(e.target.value)}
              placeholder="Ex : Aïcha, Jean, Dr. Touré…"
              required
              autoFocus
            />
          </form>
        </div>
      </Modal>

      {/* Modal Personnalisation du Plat à ajouter */}
      <Modal
        open={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title={selectedProduct?.name || "Personnaliser votre plat"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelectedProduct(null)}>Annuler</Button>
            <Button onClick={confirmAddItem}>
              Ajouter pour {currentUser} · {fmt((selectedProduct?.price || 0) + selectedSupps.reduce((s, name) => {
                const sp = selectedProduct?.supplements?.find((x) => x.name === name);
                return s + (sp?.price || 0);
              }, 0))}
            </Button>
          </>
        }
      >
        {selectedProduct && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">{selectedProduct.description}</p>

            {/* Options */}
            {selectedProduct.options?.map((opt) => (
              <div key={opt.name}>
                <p className="text-xs font-bold text-zinc-800 mb-1.5">{opt.name}</p>
                <div className="flex flex-wrap gap-2">
                  {opt.choices.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedChoices((prev) => ({ ...prev, [opt.name]: c }))}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${selectedChoices[opt.name] === c
                          ? "border-primary-500 bg-primary-50 text-primary-700"
                          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Suppléments */}
            {selectedProduct.supplements?.length > 0 && (
              <div>
                <p className="text-xs font-bold text-zinc-800 mb-1.5">Suppléments (optionnels)</p>
                <div className="space-y-1.5">
                  {selectedProduct.supplements.map((s) => {
                    const active = selectedSupps.includes(s.name);
                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          setSelectedSupps((prev) =>
                            active ? prev.filter((x) => x !== s.name) : [...prev, s.name]
                          );
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition ${active
                            ? "border-primary-500 bg-primary-50 text-primary-900"
                            : "border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                          }`}
                      >
                        <span>{s.name}</span>
                        <span className="font-bold text-primary-600">+{fmt(s.price)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal Création / Changement de salon */}
      <GroupOrderModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        slug={slug}
      />
    </div>
  );
}
