import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { IconBot, IconSearch } from "@/components/ui-custom/CustomIcon";
import { toast } from "sonner";
import { spawnNpc } from "@/lib/dayz-spawn.functions";

// Test server (see /servers) — no per-player coordinate telemetry yet, so
// "Spawn at my location" targets this fixed point until that's wired up.
const TEST_SERVICE_ID = "19773616";
const FALLBACK_SPAWN_POS = { x: 7500, z: 7500, a: 0 };


export const Route = createFileRoute("/_app/tools/npc-shop")({ component: NPCShopContent });

type NPC = { id: string; name: string; role: string; category: string; price: number; description: string };

const NPCS: NPC[] = [
  ["scavenger", "Wasteland Scavenger", "Trader", "Civilian", 2000, "A sharp-eyed scavenger who trades salvage and rumors."],
  ["medic", "Field Medic", "Medic", "Support", 2500, "Keeps your crew alive when the fighting gets close."],
  ["mechanic", "Roadside Mechanic", "Mechanic", "Support", 3000, "Repairs vehicles and keeps your convoy moving."],
  ["hunter", "Silent Hunter", "Scout", "Combat", 3500, "Tracks movement and watches the tree line."],
  ["guard", "Gate Guard", "Guard", "Combat", 4000, "Holds a position and challenges unknown players."],
  ["farmer", "Greenhouse Keeper", "Farmer", "Civilian", 4200, "Maintains crops and protects your food supply."],
  ["radio", "Radio Operator", "Intel", "Support", 4500, "Broadcasts faction messages and monitors channels."],
  ["quartermaster", "Quartermaster", "Logistics", "Support", 4800, "Organizes supplies, ammunition, and storage."],
  ["sniper", "Overwatch Sniper", "Overwatch", "Combat", 5200, "Provides long-range cover from elevated positions."],
  ["engineer", "Combat Engineer", "Engineer", "Combat", 5500, "Builds defenses and reinforces your perimeter."],
  ["smuggler", "Black Market Smuggler", "Dealer", "Civilian", 5800, "Moves restricted goods through dangerous routes."],
  ["tracker", "Bloodhound Tracker", "Tracker", "Combat", 6100, "Follows trails and identifies recent movement."],
  ["pilot", "Helicopter Pilot", "Pilot", "Support", 6500, "Coordinates transport and aerial resupply."],
  ["commander", "Faction Commander", "Commander", "Faction", 7000, "Coordinates squads and issues faction orders."],
  ["armorer", "Arms Dealer", "Armorer", "Civilian", 7200, "Maintains weapon stock and manages crate deliveries."],
  ["recon", "Recon Specialist", "Recon", "Combat", 7500, "Maps hostile positions and marks points of interest."],
  ["bunker", "Bunker Warden", "Warden", "Combat", 7800, "Guards high-value locations and secured storage."],
  ["diplomat", "Faction Diplomat", "Diplomat", "Faction", 8200, "Handles negotiations, alliances, and ceasefires."],
  ["commando", "Wasteland Commando", "Elite", "Combat", 8600, "A veteran operator for high-risk deployments."],
  ["ai", "Tactical AI Core", "Coordinator", "Faction", 9000, "Plans patrols, alerts, and coordinated defenses."],
].map(([id, name, role, category, price, description]) => ({ id, name, role, category, price, description }));

export function NPCShopContent() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<"price" | "name">("price");
  const [selected, setSelected] = useState<NPC | null>(null);
  const [openMenu, setOpenMenu] = useState<"category" | "sort" | null>(null);
  const [credits, setCredits] = useState(50_000);
  const [owned, setOwned] = useState<string[]>([]);
  const [spawning, setSpawning] = useState(false);
  const categories = ["All", ...Array.from(new Set(NPCS.map((npc) => npc.category)))];
  const filtered = useMemo(() => NPCS.filter((npc) => (category === "All" || npc.category === category) && `${npc.name} ${npc.role} ${npc.description}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "price" ? a.price - b.price : a.name.localeCompare(b.name)), [category, query, sort]);

  const spawn = async (location: string) => {
    if (!selected || !owned.includes(selected.id)) return toast.error("Buy this NPC first");
    setSpawning(true);
    try {
      const result = await spawnNpc({
        data: { serviceId: TEST_SERVICE_ID, npcId: selected.id, ...FALLBACK_SPAWN_POS },
      });
      if (result.mode === "live") {
        toast.success(`${selected.name} spawned live`, { description: `No restart — via ${result.adapter}.` });
      } else {
        toast.warning("Live spawn unavailable", { description: result.reason });
        toast.success(`${selected.name} queued`, {
          description: !result.restarted
            ? "Already loaded on the server — no restart needed, CE is managing it."
            : result.restockSeconds > 0
              ? `Spawn request set to ${location}. Server is restarting to load it — after that it respawns every ${result.restockSeconds}s on its own.`
              : `Spawn request set to ${location}. Server is restarting to load it.`,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to queue spawn");
    } finally {
      setSpawning(false);
    }
  };


  const buySelected = () => {
    if (!selected || owned.includes(selected.id)) return;
    if (credits < selected.price) return toast.error("Not enough credits");
    setCredits((value) => value - selected.price);
    setOwned((current) => [...current, selected.id]);
    toast.success(`${selected.name} purchased`, { description: "The NPC is now ready to spawn." });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-4"><PageHexBadge hue={285} icon={<IconBot size={26} />} aria-label="NPC Shop" /><div><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Server shop</div><h1 className="mt-1 font-display text-3xl md:text-4xl">NPC Shop</h1><p className="mt-2 max-w-2xl text-muted-foreground">Recruit characters for patrols, bases, factions, and battlepass progression.</p></div></div><div className="rounded-lg border border-glass-border bg-black/30 px-3 py-2 text-right"><div className="text-[10px] uppercase tracking-wider text-muted-foreground">Credits</div><div className="font-mono text-sm text-primary">{credits.toLocaleString()}</div></div></header>
      <div className="flex flex-wrap gap-2 rounded-xl border border-glass-border bg-black/20 p-3"><div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-glass-border bg-black/30 px-3"><IconSearch size={14} className="text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search NPCs..." className="w-full bg-transparent py-2 text-sm outline-none" /></div><div className="relative"><button type="button" onClick={() => setOpenMenu((value) => value === "category" ? null : "category")} className="rounded-lg border border-glass-border bg-black/50 px-3 py-2 text-sm text-foreground">{category} ▾</button>{openMenu === "category" && <div className="absolute right-0 top-11 z-30 min-w-40 rounded-xl border border-white/10 bg-[#101010] p-1.5 shadow-2xl">{categories.map((item) => <button key={item} type="button" onClick={() => { setCategory(item); setOpenMenu(null); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${category === item ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>{item}</button>)}</div>}</div><div className="relative"><button type="button" onClick={() => setOpenMenu((value) => value === "sort" ? null : "sort")} className="rounded-lg border border-glass-border bg-black/50 px-3 py-2 text-sm text-foreground">Sort: {sort === "price" ? "Price" : "Name"} ▾</button>{openMenu === "sort" && <div className="absolute right-0 top-11 z-30 min-w-40 rounded-xl border border-white/10 bg-[#101010] p-1.5 shadow-2xl"><button type="button" onClick={() => { setSort("price"); setOpenMenu(null); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${sort === "price" ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>Price</button><button type="button" onClick={() => { setSort("name"); setOpenMenu(null); }} className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${sort === "name" ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white"}`}>Name</button></div>}</div></div>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((npc) => <button key={npc.id} type="button" onClick={() => setSelected(npc)} className={`overflow-hidden rounded-lg border text-left transition hover:border-primary/60 ${selected?.id === npc.id ? "border-primary bg-primary/10" : "border-glass-border bg-black/25"}`}><img src={`https://picsum.photos/seed/asylum-npc-${npc.id}/320/180`} alt={npc.name} className="aspect-[16/8] w-full object-cover" /><div className="p-2"><div className="flex items-start justify-between gap-1"><span className="truncate text-sm font-medium">{npc.name}</span><span className="shrink-0 font-mono text-[10px] text-primary">{npc.price.toLocaleString()}</span></div><div className="mt-1 text-[10px] text-muted-foreground">{npc.role} · {npc.category}</div>{owned.includes(npc.id) && <div className="mt-1 text-[10px] uppercase tracking-wider text-emerald-300">Owned</div>}</div></button>)}
      </div>
      <div className="lg:sticky lg:top-24">
      {selected ? <GlassPanel className="border-primary/40 bg-black/95 p-5 shadow-xl"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[0.18em] text-primary">Selected NPC</div><h2 className="mt-1 font-display text-2xl">{selected.name}</h2><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{selected.description}</p><div className="mt-3 font-mono text-sm text-primary">{selected.price.toLocaleString()} credits</div></div><button type="button" onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button></div><div className="mt-5 flex flex-col gap-2"><button type="button" onClick={buySelected} disabled={owned.includes(selected.id)} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:bg-emerald-500/20 disabled:text-emerald-300">{owned.includes(selected.id) ? "Owned" : `Buy NPC · ${selected.price.toLocaleString()}`}</button><button type="button" disabled={!owned.includes(selected.id)} onClick={() => window.open("/tools/npc-map-clicker", "_blank", "noopener,noreferrer")} className="w-full rounded-lg border border-glass-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-glass/40 disabled:cursor-not-allowed disabled:opacity-40">Choose on map</button><button type="button" disabled={!owned.includes(selected.id) || spawning} onClick={() => spawn("your current location")} className="w-full rounded-lg border border-primary/40 px-4 py-2.5 text-sm text-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40">{spawning ? "Queuing…" : "Spawn at my location"}</button></div></GlassPanel> : <div className="rounded-xl border border-dashed border-glass-border p-6 text-center text-sm text-muted-foreground">Select an NPC to view purchase and spawn options.</div>}
      </div>
      </div>
    </div>
  );
}
