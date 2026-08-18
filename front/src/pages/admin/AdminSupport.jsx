import { useEffect, useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { Badge, Button, Card, EmptyState, Spinner, Tabs, Textarea, useToast } from "../../components/ui";
import { adminApi } from "../../api/admin";

const STATUS_UI = {
  open: { label: "Ouvert", variant: "warning" },
  in_progress: { label: "En cours", variant: "warning" },
  resolved: { label: "Résolu", variant: "success" },
  closed: { label: "Clos", variant: "neutral" },
};

const PRIORITY_UI = {
  high: { label: "Haute", variant: "danger" },
  medium: { label: "Moyenne", variant: "warning" },
  low: { label: "Basse", variant: "neutral" },
};

const isOpen = (t) => t.status === "open" || t.status === "in_progress";
const isResolved = (t) => t.status === "resolved" || t.status === "closed";

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

export default function AdminSupport() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Tous");
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .support({ per_page: 100 })
      .then((data) => {
        const list = data.data || data;
        const ts = Array.isArray(list) ? list : [];
        if (cancelled) return;
        setTickets(ts);
        if (ts.length) setSelectedId(ts[0].id);
      })
      .catch(() => { if (!cancelled) setTickets([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingThread(true);
    adminApi
      .supportTicket(selectedId)
      .then((t) => { if (!cancelled) setThread(t.messages || []); })
      .catch(() => { if (!cancelled) setThread([]); })
      .finally(() => { if (!cancelled) setLoadingThread(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const mapTicket = (t) => ({
    ...t,
    statusLabel: STATUS_UI[t.status]?.label || t.status,
    statusVariant: STATUS_UI[t.status]?.variant || "neutral",
    priority: PRIORITY_UI[t.priority]?.label || t.priority,
    priorityVariant: PRIORITY_UI[t.priority]?.variant || "neutral",
    restaurant: t.restaurant?.name || "—",
    author: t.user?.name || "Client",
    date: fmt(t.created_at),
    count: t.messages_count ?? (t.messages || []).length,
  });

  const filtered = tickets.filter((t) => (tab === "Tous" ? true : tab === "Ouverts" ? isOpen(t) : isResolved(t)));
  const selected = tickets.find((t) => t.id === selectedId);
  const sel = selected ? mapTicket(selected) : null;

  const resolveTicket = async () => {
    try {
      await adminApi.updateTicket(selected.id, { status: "resolved" });
      setTickets((ts) => ts.map((t) => (t.id === selected.id ? { ...t, status: "resolved" } : t)));
      toast("Ticket marqué comme résolu");
    } catch {
      toast("Impossible de mettre à jour le ticket", "error");
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const msg = await adminApi.replyTicket(selected.id, { body: reply.trim() });
      setThread((m) => [...m, msg]);
      setTickets((ts) =>
        ts.map((t) =>
          t.id === selected.id ? { ...t, status: isOpen(t) ? t.status : "in_progress", messages_count: (t.messages_count ?? 1) + 1 } : t
        )
      );
      setReply("");
      toast("Réponse envoyée au client");
    } catch {
      toast("Erreur lors de l'envoi", "error");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Spinner label="Chargement des tickets…" />;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Support</h1>

      <Tabs tabs={["Tous", "Ouverts", "Résolus"]} active={tab} onChange={setTab} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <ul className="divide-y divide-gray-100">
            {filtered.map((raw) => {
              const t = mapTicket(raw);
              return (
                <li key={t.id}>
                  <button
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full px-5 py-4 text-left transition hover:bg-gray-50 ${selectedId === t.id ? "bg-primary-50/50" : ""}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-gray-900">{t.subject}</p>
                      <Badge variant={t.statusVariant} dot>{t.statusLabel}</Badge>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-600">{t.restaurant}</span>
                      <span>•</span>
                      <span>{t.date}</span>
                      <span>•</span>
                      <span>{t.count} message(s)</span>
                    </div>
                    <div className="mt-2">
                      <Badge variant={t.priorityVariant}>Priorité {t.priority}</Badge>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 && <EmptyState icon={LifeBuoy} title="Aucun ticket" description="Aucun ticket dans cette catégorie." />}
        </Card>

        {sel ? (
          <Card className="flex flex-col lg:col-span-3">
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{sel.subject}</h3>
                <p className="mt-0.5 text-xs text-gray-500">{sel.restaurant} · {sel.author}</p>
              </div>
              {isOpen(selected) && <Button variant="success" className="!px-3 !py-1.5 !text-xs" onClick={resolveTicket}>Marquer résolu</Button>}
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: 420 }}>
              {loadingThread ? (
                <Spinner label="Chargement de la conversation…" />
              ) : thread.length === 0 ? (
                <p className="text-center text-sm text-gray-400">Aucun message.</p>
              ) : (
                thread.map((m) => {
                  const mine = m.sender === "agent";
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                        <p className={`mb-0.5 text-xs font-semibold ${mine ? "text-primary-100" : "text-gray-500"}`}>
                          {mine ? (m.author || "Support") : (m.author || sel.author)} · {fmt(m.created_at)}
                        </p>
                        <p>{m.body}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="border-t border-gray-100 p-5">
              <Textarea label="Répondre" rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Écrivez votre réponse…" />
              <Button className="mt-3" onClick={sendReply} disabled={!reply.trim() || sending}>
                <Send size={16} /> Envoyer
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="lg:col-span-3">
            <EmptyState icon={LifeBuoy} title="Sélectionnez un ticket" description="Choisissez un ticket dans la liste pour voir la conversation." />
          </Card>
        )}
      </div>
    </div>
  );
}