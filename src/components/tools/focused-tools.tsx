/**
 * Registry of tools that can open INLINE inside the Tools hub as a focused
 * side panel (driven by ?focus=<slug>) instead of routing to a full page.
 *
 * Each entry maps to a primary hex's `id` in HexToolsTree so the click on a
 * primary opens its panel and the same hex stays highlighted on the left.
 *
 * Satellite tools share their parent's primaryId so the hex tree keeps the
 * parent hex highlighted, and they expose a `parentTitle` so the page
 * header can show the parent name big with the satellite name as a
 * subtitle below it.
 */

import type { ComponentType, MouseEvent, ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import { UtmBuilderContent } from "@/routes/_app/tools/utm";

import { AllUtmsContent } from "@/routes/_app/tools/all-utms";
import { TaxonomyContent } from "@/routes/_app/tools/taxonomy";
import { FunnelPageContent } from "@/routes/_app/funnel";
import { FunnelTargetsContent } from "@/routes/_app/tools/funnel-targets";
import { CampaignInABoxContent } from "@/routes/_app/tools/campaign-in-a-box";
import { CampaignCreatorContent } from "@/routes/_app/tools/campaign-creator";
import { NPCShopContent } from "@/routes/_app/tools/npc-shop";
import { CampaignPerformanceContent, CampaignPerformanceSummary } from "@/routes/_app/tools/campaign-performance";
import { EventsContent } from "@/routes/_app/tools/events";
import { FactionHubContent } from "@/routes/_app/tools/event-intake";
import { ListCleanerContent } from "@/routes/_app/tools/list-cleaner";
import {
  IconUtm,
  IconSpark,
  IconScroll,
  IconCampaign,
  IconFunnel,
  IconChart,
  IconImport,
  IconCalendar,
} from "@/components/ui-custom/CustomIcon";


export type FocusedTool = {
  /** URL search-param slug. Also the canonical key. */
  slug: string;
  /** Must match a `Primary.id` in HexToolsTree so the parent hex stays bright. */
  primaryId: string;
  title: string;
  /** Same hue scale as the hex tree primary (oklch hue 0..360). */
  hue: number;
  icon: ReactNode;
  /** Full-route fallback for "open in full page" link. */
  fullRouteTo: string;
  /** Body component, rendered headerless inside the panel. */
  Component: ComponentType<{ hideHeader?: boolean; hideSummary?: boolean }>;
  /** Optional full-width "summary band" rendered above the hex+panel split. */
  Summary?: ComponentType;
  /** Optional desktop width override (any CSS width value). */
  width?: string;
  /** When set, header renders parent big and this tool's title as subtitle. */
  parentTitle?: string;
  /** Parent hue for the badge when this is a sub-tool. */
  parentHue?: number;
  /** Parent icon for the badge when this is a sub-tool. */
  parentIcon?: ReactNode;
};

const ZOMBIE_TYPES = [
  { id: "military", label: "Military infected", detail: "Barracks, checkpoints, and armed zones" },
  { id: "civilian", label: "Civilian infected", detail: "Towns, homes, and roadside settlements" },
  { id: "industrial", label: "Industrial infected", detail: "Factories, warehouses, and rail yards" },
  { id: "special", label: "Special infected", detail: "Elite outbreak variants for high-risk zones" },
] as const;

const HORDE_PACKS = [
  { amount: 15, price: 10_000 },
  { amount: 25, price: 30_000 },
  { amount: 35, price: 40_000 },
] as const;

function ZombieHordesContent() {
  const [map, setMap] = useState<"chernarus" | "livonia">("chernarus");
  const [zombieType, setZombieType] = useState<(typeof ZOMBIE_TYPES)[number]["id"]>("military");
  const [amount, setAmount] = useState<15 | 25 | 35>(15);
  const [location, setLocation] = useState<{ x: number; y: number } | null>(null);

  const selectedPack = HORDE_PACKS.find((pack) => pack.amount === amount) ?? HORDE_PACKS[0];
  const selectedType = ZOMBIE_TYPES.find((type) => type.id === zombieType) ?? ZOMBIE_TYPES[0];

  const pickLocation = (event: MouseEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setLocation({
      x: Math.round(((event.clientX - bounds.left) / bounds.width) * 1000),
      y: Math.round(((event.clientY - bounds.top) / bounds.height) * 1000),
    });
  };

  const deployHorde = () => {
    if (!location) {
      toast.error("Choose a location on the map first");
      return;
    }
    toast.success("Horde deployment queued", {
      description: `${amount} ${selectedType.label.toLowerCase()} on ${map === "chernarus" ? "Chernarus" : "Livonia"} at ${location.x} × ${location.y}. Cost: ${selectedPack.price.toLocaleString()} credits.`,
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Zombie Hordes</div>
          <h1 className="mt-1 font-display text-3xl">Deploy an outbreak</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Choose an infected type, pick the horde size, then click the DayZ map where the outbreak should begin.</p>
        </div>
        <div className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-right"><div className="text-[10px] uppercase tracking-[0.18em] text-orange-200/70">Deployment cost</div><div className="mt-1 font-mono text-xl text-orange-100">{selectedPack.price.toLocaleString()} cr</div></div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(260px,.65fr)]">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(["chernarus", "livonia"] as const).map((mapId) => (
              <button key={mapId} type="button" onClick={() => { setMap(mapId); setLocation(null); }} className={`rounded-lg border px-4 py-2 text-xs uppercase tracking-[0.14em] transition ${map === mapId ? "border-orange-300/70 bg-orange-300/20 text-orange-100" : "border-glass-border text-muted-foreground hover:bg-white/5"}`}>
                {mapId === "chernarus" ? "Chernarus" : "Livonia"}
              </button>
            ))}
          </div>
          <button type="button" onClick={pickLocation} className="relative block aspect-[16/9] w-full overflow-hidden rounded-2xl border border-orange-300/30 bg-[#25342f] text-left shadow-2xl">
            <span className="absolute inset-0 opacity-50" style={{ backgroundImage: "linear-gradient(rgba(224,163,77,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(224,163,77,.18) 1px, transparent 1px), radial-gradient(circle at 24% 35%, rgba(196,128,50,.55), transparent 18%), radial-gradient(circle at 76% 65%, rgba(59,102,77,.75), transparent 28%)", backgroundSize: "44px 44px, 44px 44px, auto, auto" }} />
            <span className="absolute left-[12%] top-[24%] h-1/2 w-1/3 rotate-12 rounded-[45%] border border-emerald-200/25 bg-emerald-900/20" />
            <span className="absolute bottom-[16%] right-[12%] h-1/3 w-2/5 -rotate-6 rounded-[45%] border border-amber-200/20 bg-amber-900/20" />
            <span className="absolute left-4 top-4 rounded bg-black/50 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-orange-100/80">{map} // map clicker</span>
            {!location && <span className="absolute inset-0 grid place-items-center text-sm text-white/70">Click anywhere to set outbreak location</span>}
            {location && <span className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${location.x / 10}%`, top: `${location.y / 10}%` }}><span className="block size-5 animate-ping rounded-full bg-red-400/50" /><span className="absolute left-1/2 top-1/2 block size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-500 shadow-[0_0_18px_rgba(248,113,113,.9)]" /></span>}
          </button>
          {location && <div className="text-xs text-muted-foreground">Selected coordinates: <span className="font-mono text-orange-200">{location.x} × {location.y}</span></div>}
        </div>

        <div className="space-y-4 rounded-2xl border border-glass-border bg-black/25 p-4">
          <div><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">1. Infected type</div><div className="mt-2 space-y-2">{ZOMBIE_TYPES.map((type) => <button key={type.id} type="button" onClick={() => setZombieType(type.id)} className={`w-full rounded-xl border p-3 text-left transition ${zombieType === type.id ? "border-orange-300/60 bg-orange-300/15" : "border-glass-border hover:bg-white/5"}`}><span className="block text-sm text-foreground">{type.label}</span><span className="mt-1 block text-[11px] text-muted-foreground">{type.detail}</span></button>)}</div></div>
          <div><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">2. Horde size</div><div className="mt-2 grid grid-cols-3 gap-2">{HORDE_PACKS.map((pack) => <button key={pack.amount} type="button" onClick={() => setAmount(pack.amount)} className={`rounded-xl border p-3 text-center transition ${amount === pack.amount ? "border-orange-300/60 bg-orange-300/15" : "border-glass-border hover:bg-white/5"}`}><span className="block font-display text-lg text-foreground">{pack.amount}</span><span className="mt-1 block text-[10px] text-muted-foreground">{(pack.price / 1000).toFixed(0)}k cr</span></button>)}</div></div>
          <button type="button" onClick={deployHorde} className="w-full rounded-xl border border-orange-300/70 bg-orange-300/20 px-4 py-3 text-sm font-semibold text-orange-50 transition hover:bg-orange-300/35">Deploy {amount} zombies</button>
        </div>
      </div>
    </div>
  );
}

export const FOCUSED_TOOLS: Record<string, FocusedTool> = {
  "zombie-hordes": {
    slug: "zombie-hordes",
    primaryId: "server-events",
    title: "Zombie Hordes",
    hue: 52,
    icon: <IconSpark size={22} />,
    fullRouteTo: "/tools",
    Component: ZombieHordesContent,
  },
  utm: {
    slug: "utm",
    primaryId: "utm",
    title: "Combat & Intel",
    hue: 275,
    icon: <IconUtm size={22} />,
    fullRouteTo: "/tools/utm",
    Component: UtmBuilderContent,
  },
  // Satellites of the UTM Builder — open in the same right-side panel
  // and read as part of the UTM Builder family in the header.
  // Legacy alias — "New UTM" now opens the main UTM Builder.
  "utm-campaign-name": {
    slug: "utm-campaign-name",
    primaryId: "utm",
    title: "Combat & Intel",
    hue: 275,
    icon: <IconUtm size={22} />,
    fullRouteTo: "/tools/utm",
    Component: UtmBuilderContent,
  },
  "utm-taxonomy": {
    slug: "utm-taxonomy",
    primaryId: "utm",
    title: "Bounties",
    hue: 275,
    icon: <IconSpark size={22} />,
    fullRouteTo: "/tools/taxonomy",
    Component: TaxonomyContent,
    parentTitle: "Combat & Intel",
    parentHue: 275,
    parentIcon: <IconUtm size={22} />,
  },
  "utm-all": {
    slug: "utm-all",
    primaryId: "utm",
    title: "UAV Tracking",
    hue: 275,
    icon: <IconScroll size={22} />,
    fullRouteTo: "/tools/all-utms",
    Component: AllUtmsContent,
    parentTitle: "Combat & Intel",
    parentHue: 275,
    parentIcon: <IconUtm size={22} />,
  },
  funnel: {
    slug: "funnel",
    primaryId: "funnel",
    title: "Air Support",
    hue: 200,
    icon: <IconFunnel size={22} />,
    fullRouteTo: "/tools/funnel-targets",
    Component: FunnelPageContent,
  },
  campaign: {
    slug: "campaign",
    primaryId: "campaign",
    title: "Base Ops",
    hue: 150,
    icon: <IconCampaign size={22} />,
    fullRouteTo: "/tools/campaign-in-a-box",
    Component: CampaignInABoxContent,
  },
  "funnel-performance": {
    slug: "funnel-performance",
    primaryId: "funnel",
    title: "Strafe Runs",
    hue: 200,
    icon: <IconChart size={22} />,
    fullRouteTo: "/tools/campaign-performance",
    Component: CampaignPerformanceContent,
    Summary: CampaignPerformanceSummary,
    parentTitle: "Air Support",
    parentHue: 200,
    parentIcon: <IconFunnel size={22} />,
  },
  "funnel-targets": {
    slug: "funnel-targets",
    primaryId: "funnel",
    title: "Precision Strikes",
    hue: 200,
    icon: <IconSpark size={22} />,
    fullRouteTo: "/tools/funnel-targets",
    Component: FunnelTargetsContent,
    parentTitle: "Air Support",
    parentHue: 200,
    parentIcon: <IconFunnel size={22} />,
  },
  "campaign-creator": {
    slug: "campaign-creator",
    primaryId: "campaign",
    title: "Base Protection",
    hue: 150,
    icon: <IconCampaign size={22} />,
    fullRouteTo: "/tools/campaign-creator",
    Component: CampaignCreatorContent,
    parentTitle: "Base Ops",
    parentHue: 150,
    parentIcon: <IconCampaign size={22} />,
  },
  "campaign-import": {
    slug: "campaign-import",
    primaryId: "campaign",
    title: "NPC Maker",
    hue: 150,
    icon: <IconImport size={22} />,
    fullRouteTo: "/tools/import",
    Component: NPCShopContent,
    parentTitle: "Base Ops",
    parentHue: 150,
    parentIcon: <IconCampaign size={22} />,
  },
  "campaign-events": {
    slug: "campaign-events",
    primaryId: "campaign",
    title: "Battlepass",
    hue: 150,
    icon: <IconCalendar size={22} />,
    fullRouteTo: "/tools/events",
    Component: EventsContent,
    parentTitle: "Base Ops",
    parentHue: 150,
    parentIcon: <IconCampaign size={22} />,
  },
  "campaign-performance": {
    slug: "campaign-performance",
    primaryId: "campaign",
    title: "Strafe Runs",
    hue: 150,
    icon: <IconChart size={22} />,
    fullRouteTo: "/tools/campaign-performance",
    Component: CampaignPerformanceContent,
    Summary: CampaignPerformanceSummary,
    parentTitle: "Base Ops",
    parentHue: 150,
    parentIcon: <IconCampaign size={22} />,
  },
  "faction-hub": {
    slug: "faction-hub",
    primaryId: "campaign",
    title: "Faction Hub",
    hue: 145,
    icon: <IconCampaign size={22} />,
    fullRouteTo: "/tools/event-intake",
    Component: FactionHubContent,
  },
  "campaign-list-cleaner": {
    slug: "campaign-list-cleaner",
    primaryId: "campaign",
    title: "Counter-UAV",
    hue: 150,
    icon: <IconSpark size={22} />,
    fullRouteTo: "/tools/list-cleaner",
    Component: ListCleanerContent,
    parentTitle: "Base Ops",
    parentHue: 150,
    parentIcon: <IconCampaign size={22} />,
  },
};

export function getFocusedTool(slug: string | undefined | null): FocusedTool | null {
  if (!slug) return null;
  if (slug === "campaign-hackathon") return FOCUSED_TOOLS["faction-hub"] ?? null;
  return FOCUSED_TOOLS[slug] ?? null;
}

/** Map of satellite hex id (from HexToolsTree) → focused-tool slug. */
export const SATELLITE_TO_FOCUS_SLUG: Record<string, string> = {
  name: "utm",
  "utm-all": "utm-all",
  tax: "utm-taxonomy",
  counter: "campaign-list-cleaner",
  board: "funnel-performance",
  perf2: "funnel-performance",
  gas: "funnel-performance",
  targeting: "funnel",
  targets: "funnel-targets",
  events: "campaign-events",
  bases: "campaign",
  creator: "campaign-creator",
  import: "campaign-import",
};


/** Set of primary hex ids that should open in panel instead of navigating. */
export const FOCUSED_PRIMARY_IDS = new Set(
  Object.values(FOCUSED_TOOLS).map((t) => t.primaryId),
);
