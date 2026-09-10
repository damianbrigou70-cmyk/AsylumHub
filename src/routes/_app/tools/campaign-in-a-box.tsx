import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import {
  IconCampaign,
  IconChevronLeft,
} from "@/components/ui-custom/CustomIcon";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/tools/campaign-in-a-box")({
  component: () => <CampaignInABoxContent />,
  head: () => ({
    meta: [
      { title: `Base Ops — ${BRAND.name}` },
      {
        name: "description",
        content:
          "Create campaigns, import lists, and track performance in one ordered flow.",
      },
    ],
  }),
});

const BASE_MAPS = {
  livonia: { label: "Livonia 101x", path: "livonia" },
  chernarus: { label: "Chernarus 102x", path: "chernarusplus" },
} as const;

const BASE_SIZES = [
  { id: "small", label: "Small base", price: 25_000, detail: "Compact shelter, storage, and one defensive position." },
  { id: "medium", label: "Medium base", price: 35_000, detail: "Expanded compound, storage wing, and two defensive positions." },
  { id: "large", label: "Large base", price: 55_000, detail: "Full compound, vehicle bay, storage wing, and perimeter defenses." },
] as const;

const BASE_EXTRAS = ["Water well", "Greenhouse", "Locked container"] as const;
const BASE_REQUESTS_KEY = "asylumhub:base-requests";
type BaseRequest = { id: string; map: keyof typeof BASE_MAPS; location: { x: number; y: number }; size: string; radar: boolean; radarRange: string };

export function CampaignInABoxContent({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const [mapKey, setMapKey] = useState<keyof typeof BASE_MAPS>("chernarus");
  const [size, setSize] = useState<(typeof BASE_SIZES)[number]["id"]>("medium");
  const [location, setLocation] = useState<{ x: number; y: number } | null>(null);
  const [extras, setExtras] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [radarRange, setRadarRange] = useState("500m");
  const [ownedBases, setOwnedBases] = useState<BaseRequest[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState("");
  const [activePanel, setActivePanel] = useState<"base" | "radar" | null>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(BASE_REQUESTS_KEY) ?? "[]") as BaseRequest[];
      setOwnedBases(saved);
      if (saved[0]) setSelectedBaseId(saved[0].id);
    } catch {
      setOwnedBases([]);
    }
  }, []);

  const selectedSize = BASE_SIZES.find((option) => option.id === size) ?? BASE_SIZES[1];
  const totalCost = selectedSize.price + extras.length * 5_000;
  const submitRequest = () => {
    if (!location) return;
    const request: BaseRequest = { id: crypto.randomUUID(), map: mapKey, location, size, radar: false, radarRange };
    const next = [...ownedBases, request];
    window.localStorage.setItem(BASE_REQUESTS_KEY, JSON.stringify(next));
    setOwnedBases(next);
    setSelectedBaseId(request.id);
    setSubmitted(true);
  };
  const toggleExtra = (extra: string) => setExtras((current) => current.includes(extra) ? current.filter((item) => item !== extra) : [...current, extra]);

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <Link
          to="/tools"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <IconChevronLeft size={14} /> Back to tools
        </Link>
      )}

      {!hideHeader && (
        <header className="flex items-start gap-4">
          <PageHexBadge hue={150} icon={<IconCampaign size={26} />} aria-label="Base Ops" />
          <div>
            <h1 className="font-display text-3xl md:text-4xl">Base Ops</h1>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              End-to-end campaign workflow — from creation through list import and performance
              tracking.
            </p>
          </div>
        </header>
      )}

      {submitted ? (
        <GlassPanel className="p-10 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-400/15 text-2xl text-emerald-300">✓</div>
          <h2 className="mt-5 font-display text-2xl">Base request submitted</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Your {selectedSize.label.toLowerCase()} request for {BASE_MAPS[mapKey].label} at grid {location?.x}×{location?.y} is waiting for server review.</p>
          <button type="button" onClick={() => setSubmitted(false)} className="mt-6 rounded-lg border border-glass-border px-4 py-2 text-sm text-muted-foreground hover:bg-glass/40">Submit another request</button>
        </GlassPanel>
      ) : (
        <>
        {!activePanel && <div className="grid gap-4 md:grid-cols-2"><button type="button" onClick={() => setActivePanel("base")} className="rounded-2xl border border-glass-border bg-glass/25 p-6 text-left transition hover:border-primary/50 hover:bg-glass/40"><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base Ops</div><h2 className="mt-2 font-display text-2xl">Request custom base</h2><p className="mt-2 text-sm text-muted-foreground">Choose a map, submit a location request, select a base size, and add features.</p></button><button type="button" onClick={() => setActivePanel("radar")} className="rounded-2xl border border-cyan-400/30 bg-cyan-400/5 p-6 text-left transition hover:border-cyan-300/70 hover:bg-cyan-400/10"><div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Base Radar · 5,000 credits</div><h2 className="mt-2 font-display text-2xl">Track your zone</h2><p className="mt-2 text-sm text-muted-foreground">Equip a player radar zone to one of your owned bases.</p></button></div>}
        {activePanel === "radar" && <GlassPanel className="space-y-5 border-cyan-400/30 p-6"><button type="button" onClick={() => setActivePanel(null)} className="text-xs text-muted-foreground hover:text-foreground">← Back to Base Ops</button><div><div className="text-xs uppercase tracking-[0.18em] text-cyan-200/70">Base Radar · 5,000 credits</div><h2 className="mt-1 font-display text-2xl">Track your zone</h2><p className="mt-2 text-sm text-muted-foreground">Reveal players inside a selected zone around one of your owned bases.</p></div>{ownedBases.length > 0 ? <><label className="block text-xs uppercase tracking-wider text-muted-foreground">Select base</label><select value={selectedBaseId} onChange={(event) => setSelectedBaseId(event.target.value)} className="h-11 w-full rounded-lg border border-glass-border bg-black/40 px-3 text-sm text-foreground">{ownedBases.map((base, index) => <option key={base.id} value={base.id}>Base {index + 1} · {BASE_MAPS[base.map].label} · {base.location.x}×{base.location.y}</option>)}</select><label className="block text-xs uppercase tracking-wider text-muted-foreground">Radar range</label><select value={radarRange} onChange={(event) => setRadarRange(event.target.value)} className="h-11 w-full rounded-lg border border-glass-border bg-black/40 px-3 text-sm text-foreground"><option>250m</option><option>500m</option><option>750m</option><option>1000m</option></select><button type="button" className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground">Purchase Base Radar · 5,000 credits</button></> : <div className="rounded-xl border border-dashed border-glass-border p-5 text-sm text-muted-foreground">No owned bases found. Create a custom base first, then return here to equip radar.</div>}</GlassPanel>}
        {activePanel === "base" && <>
        <button type="button" onClick={() => setActivePanel(null)} className="mb-4 text-xs text-muted-foreground hover:text-foreground">← Back to Base Ops</button>
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <GlassPanel className="overflow-hidden p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-glass-border px-5 py-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Request custom base</div>
                <h2 className="mt-1 font-display text-2xl">Choose your location</h2>
              </div>
              <div className="flex gap-1 rounded-lg border border-glass-border bg-black/20 p-1">
                {(Object.keys(BASE_MAPS) as Array<keyof typeof BASE_MAPS>).map((key) => (
                  <button key={key} type="button" onClick={() => { setMapKey(key); setLocation(null); }} className={`rounded-md px-3 py-1.5 text-xs ${mapKey === key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-glass/50"}`}>{BASE_MAPS[key].label}</button>
                ))}
              </div>
            </div>
            <div className="flex min-h-[420px] flex-col items-center justify-center bg-black/30 p-8 text-center">
              <div className="grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-2xl text-primary">⌖</div>
              <h3 className="mt-5 font-display text-2xl">Map clicker under construction</h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">The location picker for {BASE_MAPS[mapKey].label} is being rebuilt.</p>
              <button type="button" onClick={() => window.open("/tools/base-map-clicker", "_blank", "noopener,noreferrer")} className="mt-6 rounded-lg border border-glass-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-glass/40 hover:text-foreground">Open map clicker</button>
            </div>
          </GlassPanel>

          <GlassPanel className="space-y-5 p-5">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Base package</div>
              <h2 className="mt-1 font-display text-2xl">Choose your size</h2>
            </div>
            <div className="space-y-2">
              {BASE_SIZES.map((option) => <button key={option.id} type="button" onClick={() => setSize(option.id)} className={`w-full rounded-xl border p-3 text-left transition ${size === option.id ? "border-primary/70 bg-primary/10" : "border-glass-border bg-glass/20 hover:bg-glass/40"}`}><div className="flex items-center justify-between gap-2"><span className="font-medium">{option.label}</span><span className="font-mono text-sm text-primary">{option.price.toLocaleString()} credits</span></div><p className="mt-1 text-xs text-muted-foreground">{option.detail}</p></button>)}
            </div>
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">Add-ons</div>
              <div className="grid grid-cols-2 gap-2">{BASE_EXTRAS.map((extra) => <button key={extra} type="button" onClick={() => toggleExtra(extra)} className={`rounded-lg border px-2 py-2 text-xs transition ${extras.includes(extra) ? "border-primary/60 bg-primary/10 text-primary" : "border-glass-border text-muted-foreground hover:bg-glass/40"}`}>{extra}</button>)}</div>
            </div>
            <div className="rounded-xl border border-amber-400/25 bg-amber-400/10 p-3"><div className="flex items-center justify-between text-sm"><span>Estimated cost</span><strong className="font-mono text-amber-200">{totalCost.toLocaleString()} credits</strong></div><p className="mt-1 text-xs text-muted-foreground">Add-ons: {extras.length} · Base Radar is purchased separately.</p></div>
            <button type="button" disabled={!location} onClick={submitRequest} className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Request custom base</button>
          </GlassPanel>
        </div>
        </>}
        </>
      )}
    </div>
  );
}
