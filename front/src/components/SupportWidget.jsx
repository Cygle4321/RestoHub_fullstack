import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, LifeBuoy, Send, ArrowLeft, Loader2, CheckCircle2, Headphones } from "lucide-react";
import { Badge, Button, Input, Select, Textarea } from "./ui";
import { restaurantApi } from "../api/restaurant";

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

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("list");
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ subject: "", priority: "medium", body: "" });
  const bodyRef = useRef(null);

  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  useEffect(() => {
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await restaurantApi.support();
      const ts = Array.isArray(list) ? list : [];
      setTickets(ts);
      if (ts.length && !selectedId) {
        setSelectedId(ts[0].id);
        setThread(ts[0].messages || []);
        setView("thread");
      }
    } catch {
      /* silencieux */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedId || !open) return;
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
  }, [selectedId, open]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [thread, loadingThread]);

  const sendReply = async () => {
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try {
      const msg = await restaurantApi.replySupportTicket(selectedId, { body: reply.trim() });
      setThread((m) => [...m, msg]);
      setTickets((ts) =>
        ts.map((t) =>
          t.id === selectedId ? { ...t, status: t.status === "open" || t.status === "in_progress" ? t.status : "open", messages: [...(t.messages || []), msg] } : t
        )
      );
      setReply("");
    } catch {
      /* silencieux */
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
      setForm({ subject: "", priority: "medium", body: "" });
      setView("thread");
    } catch {
      /* silencieux */
    } finally {
      setCreating(false);
    }
  };

  const selected = tickets.find((t) => t.id === selectedId);

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Support"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-elevated transition hover:scale-105 hover:from-primary-600 hover:to-primary-700 active:scale-95"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
        {!open && openTickets > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger-500 px-1.5 text-[11px] font-bold text-white ring-2 ring-white">
            {openTickets}
          </span>
        )}
      </button>

      {/* Panneau de chat */}
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[540px] w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-3xl border border-zinc-200/80 bg-white shadow-2xl">
          {/* En-tête */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-primary-500 to-primary-600 px-4 py-3.5 text-white">
            {view !== "list" && (
              <button onClick={() => setView("list")} className="rounded-full p-1.5 hover:bg-white/15" aria-label="Retour">
                <ArrowLeft size={18} />
              </button>
            )}
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
              <Headphones size={18} />
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-bold">Support RestoHub</p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="h-1.5 w-1.5 rounded-full bg-success-300" /> En ligne — réponse sous 24 h
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/15" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>

          {/* Liste des tickets */}
          {view === "list" && (
            <>
              <div className="flex-1 overflow-y-auto p-3">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-zinc-400"><Loader2 size={22} className="animate-spin" /></div>
                ) : tickets.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-zinc-400">
                    <LifeBuoy size={36} className="opacity-40" />
                    <p className="text-sm font-medium text-zinc-500">Aucun ticket pour le moment</p>
                    <p className="text-xs">Un souci ? Écrivez-nous, on s'en occupe.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tickets.map((t) => {
                      const pr = PRIORITY_UI[t.priority] || { label: t.priority, variant: "neutral" };
                      const st = STATUS_UI[t.status] || { label: t.status, variant: "neutral" };
                      const lastMsg = t.messages?.[t.messages.length - 1];
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedId(t.id);
                            setView("thread");
                          }}
                          className="w-full rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 text-left transition hover:border-primary-200 hover:bg-primary-50/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-[13px] font-semibold text-zinc-900">{t.subject}</p>
                            <Badge variant={st.variant} dot>{st.label}</Badge>
                          </div>
                          <p className="mt-1 line-clamp-1 text-xs text-zinc-500">
                            {lastMsg ? (lastMsg.sender === "client" ? "Vous : " : "Support : ") + lastMsg.body : "Aucun message"}
                          </p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <Badge variant={pr.variant}>Priorité {pr.label}</Badge>
                            <span className="text-[11px] text-zinc-400">{fmt(t.created_at)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="border-t border-zinc-100 p-3">
                <Button className="w-full" onClick={() => setView("new")}>
                  <Send size={15} /> Nouveau message
                </Button>
              </div>
            </>
          )}

          {/* Conversation */}
          {view === "thread" && selected && (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-zinc-100 px-4 py-2.5">
                <p className="truncate text-[13px] font-semibold text-zinc-900">{selected.subject}</p>
                <Badge variant={(PRIORITY_UI[selected.priority] || {}).variant}>
                  {(PRIORITY_UI[selected.priority] || {}).label || selected.priority}
                </Badge>
              </div>
              <div ref={bodyRef} className="flex-1 space-y-3 overflow-y-auto bg-zinc-50/50 p-4">
                {loadingThread ? (
                  <div className="flex justify-center py-6 text-zinc-400"><Loader2 size={20} className="animate-spin" /></div>
                ) : thread.length === 0 ? (
                  <p className="py-6 text-center text-xs text-zinc-400">Démarrez la conversation.</p>
                ) : (
                  thread.map((m) => {
                    const mine = m.sender === "client";
                    return (
                      <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] shadow-sm ${mine ? "rounded-br-sm bg-primary-500 text-white" : "rounded-bl-sm bg-white text-zinc-800 ring-1 ring-zinc-100"}`}>
                          <p className={`mb-0.5 text-[10px] font-semibold ${mine ? "text-primary-100" : "text-zinc-400"}`}>
                            {mine ? "Vous" : "Support RestoHub"} · {fmt(m.created_at)}
                          </p>
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="border-t border-zinc-100 bg-white p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    rows={1}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    placeholder="Écrivez votre message…"
                    className="max-h-24 flex-1 resize-none"
                  />
                  <button
                    onClick={sendReply}
                    disabled={!reply.trim() || sending}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500 text-white transition hover:bg-primary-600 disabled:opacity-40"
                    aria-label="Envoyer"
                  >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Nouveau message */}
          {view === "new" && (
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              <div>
                <p className="text-sm font-semibold text-zinc-900">Nouveau message</p>
                <p className="text-xs text-zinc-500">Décrivez votre problème, notre équipe vous répondra.</p>
              </div>
              <Input label="Sujet" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Ex : Problème de paiement" />
              <Select label="Priorité" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
              </Select>
              <Textarea label="Message" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Écrivez votre message…" />
              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1" onClick={() => setView("list")}>Annuler</Button>
                <Button className="flex-1" onClick={createTicket} disabled={!form.subject.trim() || !form.body.trim() || creating}>
                  {creating ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />} Envoyer
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}