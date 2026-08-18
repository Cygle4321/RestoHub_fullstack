import { useEffect, useState } from "react";
import { LifeBuoy, Plus, Send } from "lucide-react";
import { Badge, Button, Card, EmptyState, Input, Modal, Select, Spinner, Tabs, Textarea, useToast } from "../../components/ui";
import { restaurantApi } from "../../api/restaurant";

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

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "";

export default function Support() {
  const toast = useToast();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("Tous");
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", priority: "medium", body: "" });
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const list = await restaurantApi.support();
      const ts = Array.isArray(list) ? list : [];
      setTickets(ts);
      if (!selectedId && ts.length) {
        setSelectedId(ts[0].id);
        setThread(ts[0].messages || []);
      }
    } catch {
      toast("Erreur de chargement du support", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setLoadingThread(true);
    restaurantApi
      .supportTicket(selectedId)
      .then((t) => {
        if (cancelled) return;
        setThread(t.messages || []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingThread(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const msg = await restaurantApi.replySupportTicket(selectedId, { body: reply.trim() });
      setThread((m) => [...m, msg]);
      setTickets((ts) =>
        ts.map((t) =>
          t.id === selectedId
            ? { ...t, status: isOpen(t) ? t.status : "open", messages: [...(t.messages || []), msg] }
            : t
        )
      );
      setReply("");
    } catch {
      toast("Erreur lors de l'envoi", "error");
    } finally {
      setSending(false);
    }
  };

  const createTicket = async () => {
    if (!form.subject.trim() || !form.body.trim()) return;
    setCreating(true);
    try {
      const t = await restaurantApi.createSupportTicket({
        subject: form.subject.trim(),
        body: form.body.trim(),
        priority: form.priority,
      });
      setTickets((ts) => [t, ...ts]);
      setSelectedId(t.id);
      setThread(t.messages || []);
      setNewOpen(false);
      setForm({ subject: "", priority: "medium", body: "" });
      toast("Ticket créé, notre équipe va vous répondre");
    } catch {
      toast("Erreur lors de la création du ticket", "error");
    } finally {
      setCreating(false);
    }
  };

  const filtered = tickets.filter((t) => (tab === "Tous" ? true : tab === "Ouverts" ? isOpen(t) : !isOpen(t)));
  const selected = tickets.find((t) => t.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Support</h1>
        <Button onClick={() => setNewOpen(true)}>
          <Plus size={16} /> Nouveau ticket
        </Button>
      </div>

      <Tabs tabs={["Tous", "Ouverts", "Résolus"]} active={tab} onChange={setTab} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          {loading ? (
            <div className="p-6"><Spinner label="Chargement des tickets…" /></div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filtered.map((t) => {
                const st = STATUS_UI[t.status] || { label: t.status, variant: "neutral" };
                const pr = PRIORITY_UI[t.priority] || { label: t.priority, variant: "neutral" };
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full px-5 py-4 text-left transition hover:bg-gray-50 ${selectedId === t.id ? "bg-primary-50/50" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-gray-900">{t.subject}</p>
                        <Badge variant={st.variant} dot>{st.label}</Badge>
                      </div>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant={pr.variant}>Priorité {pr.label}</Badge>
                        <span>•</span>
                        <span>{fmt(t.created_at)}</span>
                        <span>•</span>
                        <span>{(t.messages || []).length} message(s)</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {!loading && filtered.length === 0 && (
            <EmptyState icon={LifeBuoy} title="Aucun ticket" description="Ouvrez un ticket pour contacter notre équipe." />
          )}
        </Card>

        <Card className="flex flex-col lg:col-span-3">
          {selected ? (
            <>
              <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{selected.subject}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {(STATUS_UI[selected.status] || {}).label || selected.status} · ouvert le {fmt(selected.created_at)}
                  </p>
                </div>
                <Badge variant={(PRIORITY_UI[selected.priority] || {}).variant}>
                  Priorité {(PRIORITY_UI[selected.priority] || {}).label || selected.priority}
                </Badge>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: 420 }}>
                {loadingThread ? (
                  <Spinner label="Chargement de la conversation…" />
                ) : thread.length === 0 ? (
                  <p className="text-center text-sm text-gray-400">Aucun message.</p>
                ) : (
                  thread.map((m) => {
                    const mine = m.sender === "client";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-800"}`}>
                          <p className={`mb-0.5 text-xs font-semibold ${mine ? "text-primary-100" : "text-gray-500"}`}>
                            {mine ? "Vous" : "Support RestoHub"} · {fmt(m.created_at)}
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
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10">
              <EmptyState icon={LifeBuoy} title="Sélectionnez un ticket" description="Choisissez un ticket dans la liste pour voir la conversation." />
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Nouveau ticket de support"
        footer={
          <>
            <Button variant="secondary" onClick={() => setNewOpen(false)}>Annuler</Button>
            <Button onClick={createTicket} disabled={!form.subject.trim() || !form.body.trim() || creating}>Envoyer le ticket</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Sujet" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex : Problème de paiement Mobile Money" />
          <Select label="Priorité" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Basse</option>
            <option value="medium">Moyenne</option>
            <option value="high">Haute</option>
          </Select>
          <Textarea label="Message" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Décrivez votre problème…" />
        </div>
      </Modal>
    </div>
  );
}