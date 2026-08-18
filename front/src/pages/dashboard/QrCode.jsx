import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, FileText, Lightbulb, Printer, QrCode as QrIcon } from "lucide-react";
import { Button, Card, CardHeader, Select, Spinner, useToast } from "../../components/ui";
import { downloadQrPdf } from "../../lib/documents";
import { restaurantApi } from "../../api/restaurant";

const PX = { S: 168, M: 224, L: 288 };

export default function QrCode() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [resto, setResto] = useState(null);
  const [size, setSize] = useState("M");
  const [color, setColor] = useState("primary");
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await restaurantApi.settings();
        const s = res.data || res;
        if (!cancelled) setResto({ name: s.name || "Ma boutique", slug: s.slug || "" });
      } catch {
        if (!cancelled) setResto({ name: "Ma boutique", slug: "" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const url = resto ? `${window.location.origin}/store/${resto.slug}` : "";

  useEffect(() => {
    if (!url) return;
    const ink = color === "primary" ? "#14b8a6" : "#111827";
    QRCode.toDataURL(url, { width: PX[size], margin: 1, color: { dark: ink, light: "#ffffff" } })
      .then(setDataUrl)
      .catch(() => setDataUrl(""));
  }, [url, size, color]);

  const download = (label) => {
    if (!dataUrl) return toast("QR Code pas encore prêt", "error");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-code-${resto?.slug || "boutique"}.png`;
    a.click();
    toast(label);
  };

  const downloadPdf = () => {
    if (!dataUrl || !url) return toast("QR Code pas encore prêt", "error");
    const err = downloadQrPdf({
      restaurantName: resto?.name || "Ma boutique",
      url,
      qrDataUrl: dataUrl,
    });
    if (err) toast(err, "error");
  };

  if (loading) return <Spinner label="Chargement du QR Code…" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">QR Code du menu</h1>
        <p className="mt-1 text-sm text-gray-500">Faites scanner votre menu digital par vos clients.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader title="Votre QR Code" subtitle={url} />
          <div className="flex flex-col items-center gap-6 p-8">
            {dataUrl ? (
              <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm" style={{ width: PX[size] + 32 }}>
                <img src={dataUrl} alt={`QR Code ${resto?.name}`} className="block h-auto w-full" />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center"><Spinner label="Génération…" /></div>
            )}
            <div className="text-center">
              <p className="font-bold text-gray-900">{resto?.name}</p>
              <p className="text-xs text-gray-500">{url}</p>
            </div>
            <div className="flex flex-wrap items-end justify-center gap-3">
              <Select label="Taille" value={size} onChange={(e) => setSize(e.target.value)} className="w-28">
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
              </Select>
              <Select label="Couleur" value={color} onChange={(e) => setColor(e.target.value)} className="w-32">
                <option value="primary">Corail</option>
                <option value="black">Noir</option>
              </Select>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <Button onClick={() => download("QR Code téléchargé en PNG")}><Download size={16} /> Télécharger PNG</Button>
              <Button variant="secondary" onClick={downloadPdf}><FileText size={16} /> Télécharger PDF</Button>
              <Button variant="secondary" onClick={() => { window.print(); }}><Printer size={16} /> Imprimer</Button>
            </div>
          </div>
        </Card>

        <Card className="h-fit">
          <CardHeader title="Où l'afficher ?" subtitle="Bonnes pratiques" />
          <ul className="space-y-4 p-5">
            {[
              "Sur les tables, dans un porte-menu ou en sticker",
              "Sur vos emballages et sacs de livraison",
              "Sur la vitrine ou la porte d'entrée",
              "Dans vos publications Facebook et Instagram",
              "Sur vos flyers et cartes de visite",
            ].map((tip) => (
              <li key={tip} className="flex gap-3 text-sm text-gray-600">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-primary-500" />
                {tip}
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 p-5 text-xs text-gray-500">
            <QrIcon size={14} className="mr-1 inline" /> Le QR Code pointe toujours vers votre menu à jour.
          </div>
        </Card>
      </div>
    </div>
  );
}