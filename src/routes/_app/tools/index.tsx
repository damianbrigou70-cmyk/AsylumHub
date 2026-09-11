import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { z } from "zod";
import {
  IconArrowRight,
  IconBolt,
  IconClose,
  IconCalendar,
  IconCampaign,
  IconChart,
  IconFunnel,
  IconImport,
  IconScroll,
  IconSpark,
  IconUtm,
  IconSearch,
} from "@/components/ui-custom/CustomIcon";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { FocusedToolPanel } from "@/components/tools/FocusedToolPanel";
import { FadeInUp } from "@/components/motion/WordStagger";
import { BRAND } from "@/lib/brand";
import { toast } from "sonner";
import { DAYZ_SERVERS, type DayZServerId } from "@/lib/dayz/servers";


import {
  FOCUSED_TOOLS,
  SATELLITE_TO_FOCUS_SLUG,
  getFocusedTool,
} from "@/components/tools/focused-tools";

const searchSchema = z.object({
  focus: z.string().optional(),
  workspace: z.string().optional(),
});

const SERVICE_GROUPS: { name: string; description: string; hue: number; icon: ReactNode; items: { label: string; focus: string; icon: ReactNode }[] }[] = [
  {
    name: "Combat & Intel",
    description: "Track movement, bounties, killfeed, and server intelligence.",
    hue: 205,
    icon: <IconUtm size={20} />,
    items: [
      { label: "Combat & Intel", focus: "utm", icon: <IconUtm size={16} /> },
      { label: "UAV Tracking", focus: "utm-all", icon: <IconScroll size={16} /> },
      { label: "PVP Killfeed", focus: "utm", icon: <IconSpark size={16} /> },
      { label: "Bounties", focus: "utm-taxonomy", icon: <IconSpark size={16} /> },
      { label: "Leaderboards", focus: "funnel-performance", icon: <IconChart size={16} /> },
    ],
  },
  {
    name: "Air Support",
    description: "Call in strikes and coordinate precision operations.",
    hue: 190,
    icon: <IconFunnel size={20} />,
    items: [
      { label: "Air Support", focus: "funnel-targets", icon: <IconFunnel size={16} /> },
      { label: "Precision Strikes", focus: "funnel-targets", icon: <IconSpark size={16} /> },
      { label: "Strafe Runs", focus: "funnel-performance", icon: <IconChart size={16} /> },
    ],
  },
  {
    name: "Base Ops",
    description: "Protect bases, manage territory, and broadcast raid events.",
    hue: 35,
    icon: <IconCampaign size={20} />,
    items: [
      { label: "Base Ops", focus: "campaign", icon: <IconCampaign size={16} /> },
      { label: "Raid Announcements", focus: "campaign-events", icon: <IconCalendar size={16} /> },
      { label: "Custom Bases", focus: "campaign", icon: <IconCampaign size={16} /> },
    ],
  },
  {
    name: "NPC Shop",
    description: "Build NPCs, vehicles, items, and custom server content.",
    hue: 285,
    icon: <IconImport size={20} />,
    items: [
      { label: "NPC Shop", focus: "campaign-import", icon: <IconImport size={16} /> },
      { label: "Custom Vehicles", focus: "campaign-events", icon: <IconSpark size={16} /> },
            { label: "Item Shop", focus: "campaign-import", icon: <IconScroll size={16} /> },
    ],
  },
  {
    name: "Faction Hub",
    description: "Coordinate factions, contracts, wars, and standings.",
    hue: 145,
    icon: <IconSpark size={20} />,
    items: [
      { label: "Create or Join", focus: "faction-hub", icon: <IconSpark size={16} /> },
      { label: "Wars & Contracts", focus: "campaign", icon: <IconCampaign size={16} /> },
      { label: "Faction Leaderboard", focus: "funnel-performance", icon: <IconChart size={16} /> },
    ],
  },
  {
    name: "Zombie Hordes",
    description: "Survive outbreaks, claim horde rewards, and support the fight.",
    hue: 52,
    icon: <IconChart size={20} />,
    items: [{ label: "Zombie Hordes", focus: "zombie-hordes", icon: <IconSpark size={16} /> }],
  },
];

type ItemCategory = "Handgun" | "Rifle" | "Sniper Rifle" | "SMG" | "Shotgun" | "Ammo" | "Medical" | "Food" | "Clothing" | "Backpack" | "Attachments" | "Explosives" | "Tools" | "Vehicle" | "Survival";
type ShopItem = { id: string; name: string; category: ItemCategory; price: number; detail: string; image: string };

const wikiImage = (file: string) => `https://dayz.fandom.com/wiki/Special:FilePath/${encodeURIComponent(file)}`;
const item = (id: string, name: string, category: ItemCategory, price: number, detail: string, file: string): ShopItem => ({ id, name, category, price, detail, image: wikiImage(file) });

const ITEM_CATALOG: ShopItem[] = [
  item("glock19", "Glock 19", "Handgun", 1800, "Compact 9mm sidearm for close quarters.", "Glock 19.png"),
  item("deagle", "Desert Eagle", "Handgun", 4200, "Heavy pistol with serious stopping power.", "Deagle.png"),
  item("fnx45", "FNX45", "Handgun", 3600, "Reliable .45 sidearm with a strong report.", "FNX45.png"),
  item("mk-ii", "MK II", "Handgun", 2400, "Quiet .22 pistol for discreet work.", "MK II.png"),
  item("m4a1", "M4-A1", "Rifle", 12500, "Modular assault rifle for faction operations.", "M4-A1.png"),
  item("akm", "AKM", "Rifle", 10800, "Hard-hitting 7.62 rifle built for the wasteland.", "AKM.png"),
  item("ak74", "AK-74", "Rifle", 9400, "Controllable 5.45 assault rifle.", "AK-74.png"),
  item("aug", "AUG A1", "Rifle", 11400, "Bullpup rifle with a fast handling profile.", "AUG A1.png"),
  item("lar", "FAL", "Rifle", 15200, "Battle rifle for players who want reach and force.", "FAL.png"),
  item("mosin", "Mosin 9130", "Sniper Rifle", 8500, "Classic bolt-action rifle with long-range reach.", "Mosin 9130.png"),
  item("svd", "SVD", "Sniper Rifle", 17800, "Semi-automatic marksman rifle for overwatch.", "SVD.png"),
  item("vss", "VSS", "Sniper Rifle", 16400, "Suppressed marksman platform for covert teams.", "VSS.png"),
  item("win70", "Winchester 70", "Sniper Rifle", 9800, "Precise hunting rifle with a clean sight picture.", "Winchester 70.png"),
  item("mp5", "USG-45", "SMG", 7200, "Compact submachine gun for urban fights.", "USG-45.png"),
  item("scorpion", "Scorpion EVO 3", "SMG", 7600, "Fast-firing SMG with a large magazine.", "Scorpion EVO 3.png"),
  item("mp133", "BK-133", "Shotgun", 4600, "Pump shotgun that keeps doorways honest.", "BK-133.png"),
  item("doublebarrel", "BK-43", "Shotgun", 3900, "Break-action double barrel for brutal close work.", "BK-43.png"),
  item("ij70", "IJ-70", "Handgun", 1300, "Common sidearm and dependable last resort.", "IJ-70.png"),
  item("ammo-556", "5.56x45mm Box", "Ammo", 900, "Box of rifle ammunition.", "5.56x45mm.png"),
  item("ammo-762", "7.62x39mm Box", "Ammo", 1100, "Box of intermediate rifle ammunition.", "7.62x39mm.png"),
  item("ammo-308", ".308 Winchester Box", "Ammo", 1400, "Box of full-power marksman rounds.", ".308 Winchester.png"),
  item("ammo-9mm", "9x19mm Box", "Ammo", 700, "Box of compact pistol and SMG rounds.", "9x19mm.png"),
  item("bandage", "Bandage", "Medical", 350, "Stop bleeding before the next push.", "Bandage.png"),
  item("saline", "Saline Bag", "Medical", 1200, "Restore blood volume after treatment.", "Saline Bag.png"),
  item("morphine", "Morphine Auto-Injector", "Medical", 950, "Treat a broken leg and keep moving.", "Morphine Auto-Injector.png"),
  item("charcoal", "Charcoal Tablets", "Medical", 500, "Clean up a bad stomach situation.", "Charcoal Tabs.png"),
  item("canned", "Canned Bacon", "Food", 260, "Long-life food for a long night.", "Canned Bacon.png"),
  item("water", "Canteen", "Food", 450, "Carry clean water between safehouses.", "Canteen.png"),
  item("rice", "Rice", "Food", 380, "A reliable dry food staple.", "Rice.png"),
  item("plate", "Plate Carrier", "Clothing", 6800, "Extra protection for high-risk raids.", "Plate Carrier.png"),
  item("ghillie", "Ghillie Suit", "Clothing", 5900, "Blend into the tree line.", "Ghillie Suit.png"),
  item("helmet", "Assault Helmet", "Clothing", 3200, "Protect your head during contact.", "Assault Helmet.png"),
  item("knife", "Combat Knife", "Tools", 900, "A field blade for work and defense.", "Combat Knife.png"),
  item("hatchet", "Hatchet", "Tools", 1250, "Harvest wood and open difficult crates.", "Hatchet.png"),
  item("lockpick", "Lockpick", "Tools", 2100, "A quiet answer to locked storage.", "Lockpick.png"),
  item("repair", "Weapon Cleaning Kit", "Tools", 1800, "Keep your weapon reliable in the field.", "Weapon Cleaning Kit.png"),
  item("bicycle", "Bicycle", "Vehicle", 6200, "Quiet transport for supply runs.", "Bicycle.png"),
  item("tent", "Medium Tent", "Survival", 2800, "Create a temporary faction cache.", "Medium Tent.png"),
  item("cooking", "Cooking Pot", "Survival", 800, "Turn raw finds into a hot meal.", "Cooking Pot.png"),
  item("radio", "Field Transceiver", "Survival", 1700, "Stay connected when the grid goes dark.", "Field Transceiver.png"),
  item("m79", "M79", "Rifle", 13200, "Single-shot launcher for specialist squads.", "M79.png"),
  item("bizon", "PP-19 Bizon", "SMG", 6900, "High-capacity SMG for close-range pressure.", "PP-19 Bizon.png"),
  item("repeater", "Repeater Carbine", "Rifle", 5200, "Fast lever action for mobile hunters.", "Repeater.png"),
  item("cr527", "CR-527", "Rifle", 6100, "Compact bolt-action rifle with a useful magazine.", "CR-527.png"),
  item("sks", "SK 59/66", "Rifle", 7300, "Rugged semi-automatic rifle for the frontier.", "SK 59-66.png"),
  item("saiga", "Vaiga", "Shotgun", 8800, "Magazine-fed shotgun for clearing rooms.", "Vaiga.png"),
  item("pioneer", "Pioneer", "Sniper Rifle", 7600, "Modern bolt-action rifle for quiet overwatch.", "Pioneer.png"),
  item("bk18", "BK-18", "Rifle", 2800, "Simple single-shot hunting rifle.", "BK-18.png"),
  item("ammo-12", "12ga Buckshot Box", "Ammo", 850, "Close-range shotgun shells.", "12ga Buckshot.png"),
  item("ammo-45", ".45 ACP Box", "Ammo", 650, "Subsonic pistol and SMG ammunition.", ".45 ACP.png"),
  item("ammo-380", ".380 ACP Box", "Ammo", 500, "Compact handgun ammunition.", ".380 ACP.png"),
  item("ammo-545", "5.45x39mm Box", "Ammo", 950, "Soviet-pattern assault rifle ammunition.", "5.45x39mm.png"),
  item("ammo-76254", "7.62x54mmR Box", "Ammo", 1500, "Full-power marksman ammunition.", "7.62x54mmR.png"),
  item("hunter-scope", "Hunting Scope", "Attachments", 2600, "Magnify targets at hunting distance.", "Hunting Scope.png"),
  item("pu-scope", "PU Scope", "Attachments", 2200, "Classic optic for the Mosin platform.", "PU Scope.png"),
  item("kashtan", "KASHTAN Scope", "Attachments", 3900, "Mid-range optic for AK platforms.", "KASHTAN.png"),
  item("suppressor", "Normalized Suppressor", "Attachments", 4400, "Reduce report and muzzle flash.", "Normalized Suppressor.png"),
  item("mag-m4", "M4 60-Round Mag", "Attachments", 2300, "Extended magazine for M4 operations.", "M4 60Rnd Mag.png"),
  item("mag-ak", "AK-M 30-Round Mag", "Attachments", 1200, "Spare magazine for AK platforms.", "AKM 30Rnd Mag.png"),
  item("grenade", "M67 Grenade", "Explosives", 2800, "Fragmentation grenade for fortified positions.", "M67 Grenade.png"),
  item("smoke", "Smoke Grenade", "Explosives", 1400, "Create concealment for a squad move.", "Smoke Grenade.png"),
  item("flashbang", "Flashbang", "Explosives", 1800, "Disorient a room before entry.", "Flashbang.png"),
  item("stabvest", "Stab Vest", "Clothing", 2100, "Light protection without slowing you down.", "Stab Vest.png"),
  item("fieldjacket", "Field Jacket", "Clothing", 900, "Durable storage for the road.", "Field Jacket.png"),
  item("militaryboots", "Combat Boots", "Clothing", 1200, "Keep your feet protected on long runs.", "Combat Boots.png"),
  item("tacticalhelmet", "Tactical Helmet", "Clothing", 4100, "Military head protection with attachment rails.", "Tactical Helmet.png"),
  item("tacticalbag", "Tactical Backpack", "Backpack", 4800, "Carry more supplies without losing mobility.", "Tactical Backpack.png"),
  item("assaultbag", "Assault Backpack", "Backpack", 3600, "Balanced faction pack for patrols.", "Assault Backpack.png"),
  item("drybag", "Drybag Backpack", "Backpack", 2400, "Keep your supplies protected from rain.", "Drybag.png"),
  item("splint", "Splint", "Medical", 420, "Set a broken leg and get back to base.", "Splint.png"),
  item("epipen", "Epinephrine Auto-Injector", "Medical", 1000, "Bring an unconscious survivor back around.", "Epinephrine Auto-Injector.png"),
  item("vitamins", "Vitamins", "Medical", 480, "Support recovery when supplies are scarce.", "Tetracycline Pills.png"),
  item("tacticalbacon", "Tactical Bacon", "Food", 520, "High-energy field ration.", "Tactical Bacon.png"),
  item("peaches", "Canned Spaghetti", "Food", 300, "A warm meal from a cold can.", "Canned Spaghetti.png"),
  item("fishingrod", "Fishing Rod", "Survival", 1300, "Find food away from the roads.", "Fishing Rod.png"),
  item("fishinghook", "Fishing Hook", "Survival", 180, "A small tool for a reliable catch.", "Fishing Hook.png"),
  item("shovel", "Shovel", "Tools", 1100, "Dig, build, and prepare a hidden cache.", "Shovel.png"),
  item("saw", "Hacksaw", "Tools", 760, "Cut through metal and salvage components.", "Hacksaw.png"),
  item("gascan", "Jerry Can", "Vehicle", 1800, "Carry fuel for a long-distance run.", "Jerry Can.png"),
  item("carbattery", "Car Battery", "Vehicle", 2600, "Restore power to a stranded vehicle.", "Car Battery.png"),
  item("radiator", "Radiator", "Vehicle", 2300, "Keep a faction vehicle running cool.", "Radiator.png"),
];

const ITEM_FILTERS = ["All", "Name A-Z", "Handgun", "Rifle", "Sniper Rifle", "SMG", "Shotgun", "Ammo", "Medical", "Food", "Clothing", "Backpack", "Attachments", "Explosives", "Tools", "Vehicle", "Survival"] as const;

export const Route = createFileRoute("/_app/tools/")({
  component: ToolsHub,
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: `Server shop — ${BRAND.name}` },
      {
        name: "description",
        content:
          "Base Ops, Services, Bounties, Air Support, Faction Hub.",
      },
    ],
  }),
});

function ToolsHub() {
  const { focus, workspace } = Route.useSearch();
  const navigate = useNavigate();
  const [shopTab, setShopTab] = useState<"server" | "items">("server");
  const tool = getFocusedTool(focus);
  const focusedPrimaryId = tool?.primaryId ?? null;
  // Reverse the satellite→slug map to find which satellite is active.
  const focusedSatelliteId =
    Object.entries(SATELLITE_TO_FOCUS_SLUG).find(([, slug]) => slug === focus)?.[0] ?? null;

  const handleFocus = useCallback(
    (primaryId: string) => {
      const entry = Object.values(FOCUSED_TOOLS).find(
        (t) => t.primaryId === primaryId && !t.parentTitle,
      );
      if (!entry) return;
      navigate({ to: "/tools", search: { focus: entry.slug, workspace }, replace: false });
    },
    [navigate, workspace],
  );

  const handleSatelliteFocus = useCallback(
    (_primaryId: string, satelliteId: string) => {
      const slug = SATELLITE_TO_FOCUS_SLUG[satelliteId];
      if (!slug) return false;
      navigate({ to: "/tools", search: { focus: slug, workspace }, replace: false });
      return true;
    },
    [navigate, workspace],
  );

  const handleClose = useCallback(() => {
    navigate({ to: "/tools", search: { workspace }, replace: false });
  }, [navigate, workspace]);


  const badgeHue = tool?.parentHue ?? tool?.hue ?? 88;
  const badgeIcon = tool?.parentIcon ?? tool?.icon;
  const mainTitle = tool?.parentTitle ?? tool?.title;
  const subTitle = tool?.parentTitle ? tool.title : null;

  return (
    <div className={`server-shop-root relative flex min-h-[calc(100vh-3rem)] flex-col overflow-x-hidden pb-10 ${tool ? "space-y-3" : "space-y-8"}`}>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap");
        .server-shop-root {
          position: relative;
          min-height: calc(100vh - 3rem);
          background:
            radial-gradient(circle at 50% 100%, rgba(194, 82, 30, 0.22), transparent 40%),
            linear-gradient(180deg, rgba(9, 7, 6, 0.78), rgba(14, 10, 9, 0.92));
          color: #f5e6c8;
        }
        .shop-atmosphere {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          opacity: 0.95;
        }
        .shop-desert { position: absolute; inset: 0; background: url('/drylands.png') center top / cover no-repeat; opacity: 0.25; filter: saturate(1.1) contrast(1.12); }
        .shop-glow { position: absolute; left: 50%; bottom: -8%; width: 78%; height: 38%; transform: translateX(-50%); background: radial-gradient(ellipse, rgba(255, 123, 52, 0.46), rgba(129, 32, 17, 0.18) 48%, transparent 78%); filter: blur(28px); }
        .shop-smoke { position: absolute; bottom: 0; width: 350px; height: 560px; border-radius: 50%; background: radial-gradient(ellipse at 40% 90%, rgba(94, 60, 35, 0.7), rgba(18, 12, 10, 0.12) 48%, transparent 70%); filter: blur(30px); opacity: 0.38; animation: shop-soar 12s ease-in-out infinite; }
        .shop-smoke-a { left: 4%; }
        .shop-smoke-b { right: 5%; animation-delay: -4s; }
        @keyframes shop-soar { 0%, 100% { transform: translateY(14px) scale(0.92); opacity: 0.22; } 50% { transform: translateY(-30px) scale(1.04); opacity: 0.5; } }
        .shop-ember { position: absolute; bottom: 4%; width: 3px; height: 3px; border-radius: 999px; background: radial-gradient(circle, rgba(255, 216, 130, 1), rgba(255, 137, 58, 0.96) 42%, rgba(126, 28, 18, 0.7)); box-shadow: 0 0 12px rgba(255, 157, 65, 0.9), 0 0 20px rgba(251, 96, 31, 0.4); opacity: 0; animation: shop-ember 5s ease-out infinite; }
        @keyframes shop-ember { 0% { opacity: 0; transform: translate(0, 0) scale(0.4); } 12% { opacity: 1; } 100% { opacity: 0; transform: translate(18px, -560px) scale(0.12); } }
        .shop-medieval-title, .server-shop-root h1, .server-shop-root h2, .server-shop-root h3 { font-family: "MedievalSharp", Georgia, serif; font-weight: 400; }
        .shop-masthead { position: relative; z-index: 1; padding: 28px 24px 0; }
        .shop-badge-row { display: flex; align-items: center; gap: 16px; }
        .shop-kicker { display: inline-block; margin-top: 8px; font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: rgba(244, 189, 96, 0.8); }
        .shop-title { margin-top: 4px; font-size: clamp(3rem, 6vw, 5rem); line-height: 0.9; letter-spacing: 0.04em; color: #fceac9; text-shadow: 0 0 30px rgba(186, 68, 29, 0.5), 0 3px 0 rgba(18, 8, 7, 0.9); }
        .shop-subtitle { max-width: 660px; margin-top: 10px; color: rgba(245, 228, 197, 0.72); font-size: 0.96rem; line-height: 1.6; }
        .shop-hero-bar {
          position: relative; z-index: 1; margin: 22px auto 0; max-width: 1380px; padding: 16px 18px; border: 1px solid rgba(233, 168, 84, 0.3); border-radius: 18px; background: linear-gradient(90deg, rgba(35, 22, 16, 0.82), rgba(18, 13, 11, 0.7)); box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28); display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 16px; align-items: center;
        }
        .shop-hero-meta { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
        .shop-hero-stat { display: grid; gap: 4px; min-width: 140px; }
        .shop-hero-stat span { color: rgba(245, 228, 197, 0.6); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; }
        .shop-hero-stat strong { color: #f4d391; font-size: 1.8rem; font-family: "MedievalSharp", Georgia, serif; }
        .shop-hero-callout { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
        .shop-hero-pill { border: 1px solid rgba(235, 172, 87, 0.28); border-radius: 999px; padding: 7px 12px; background: rgba(88, 46, 24, 0.36); color: #f3d28f; letter-spacing: 0.15em; font-size: 10px; text-transform: uppercase; }
        .shop-directory-wrap { position: relative; z-index: 1; width: min(1380px, calc(100% - 32px)); margin: 26px auto 0; }
        .shop-directory-shell { border: 1px solid rgba(231, 170, 86, 0.22); border-radius: 28px; background: rgba(16, 11, 9, 0.75); box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 188, 112, 0.04); overflow: hidden; }
        .shop-directory-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; padding: 18px; }
        .shop-card {
          position: relative; display: flex; align-items: stretch; gap: 14px; min-height: 145px; width: 100%; border: 1px solid rgba(224, 162, 77, 0.18); border-radius: 18px; background: linear-gradient(180deg, rgba(32, 18, 12, 0.85), rgba(15, 11, 9, 0.92)); padding: 16px; text-align: left; overflow: hidden; cursor: pointer; transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .shop-card:hover { transform: translateY(-1px); border-color: rgba(246, 190, 88, 0.4); box-shadow: 0 14px 30px rgba(0,0,0,0.18); }
        .shop-card::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 4px; background: linear-gradient(180deg, rgba(255, 176, 82, 0.9), rgba(131, 39, 17, 0.8)); }
        .shop-card-art { position: relative; display: grid; place-items: center; width: 78px; height: 78px; border-radius: 16px; overflow: hidden; border: 1px solid rgba(244, 189, 90, 0.18); background: radial-gradient(circle at 50% 28%, rgba(207, 110, 30, 0.38), rgba(32, 16, 11, 0.84)); }
        .shop-card-art img { width: 100%; height: 100%; object-fit: cover; }
        .shop-card-content { display: flex; flex: 1; flex-direction: column; justify-content: center; min-width: 0; }
        .shop-card-title { color: #f5dfb6; font-size: clamp(1.2rem, 2vw, 1.7rem); }
        .shop-card-meta { margin-top: 8px; color: rgba(245, 228, 197, 0.68); font-size: 12px; }
        .shop-card-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .shop-card-pill { padding: 5px 8px; border-radius: 999px; border: 1px solid rgba(235, 168, 88, 0.2); background: rgba(119, 55, 22, 0.2); color: #f3cf8c; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; }
        @media (max-width: 980px) { .shop-directory-grid { grid-template-columns: 1fr 1fr; } .shop-hero-bar { grid-template-columns: 1fr; } }
        @media (max-width: 640px) { .shop-directory-grid { grid-template-columns: 1fr; } .shop-hero-meta { flex-direction: column; align-items: flex-start; } .shop-hero-callout { justify-content: flex-start; } }
        .server-shop-root { background: #000 !important; }
        .server-shop-root .shop-atmosphere { display: none; }
        .server-shop-root .shop-hero-bar,
        .server-shop-root .shop-directory-shell { background: #050505; }
        .server-shop-root .shop-card { background: #090909; }
        .server-shop-root { color: #f2f2f2; }
        .server-shop-root .shop-kicker { color: #ffffff; }
        .server-shop-root .shop-title { color: #ffffff; text-shadow: 0 0 30px rgba(255, 255, 255, 0.16), 0 3px 0 rgba(0, 0, 0, 0.95); }
        .server-shop-root .shop-subtitle { color: rgba(226, 226, 226, 0.68); }
        .server-shop-root .shop-hero-bar { border-color: rgba(255, 255, 255, 0.28); }
        .server-shop-root .shop-hero-stat span { color: rgba(210, 210, 210, 0.58); }
        .server-shop-root .shop-hero-stat strong { color: #ffffff; }
        .server-shop-root .shop-hero-pill { border-color: rgba(255, 255, 255, 0.3); background: rgba(255, 255, 255, 0.06); color: #ffffff; }
        .server-shop-root .shop-directory-shell { border-color: rgba(255, 255, 255, 0.24); box-shadow: 0 25px 80px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.04); }
        .server-shop-root .shop-card { border-color: rgba(255, 255, 255, 0.18); }
        .server-shop-root .shop-card:hover { border-color: rgba(255, 255, 255, 0.58); box-shadow: 0 14px 30px rgba(0, 0, 0, 0.25), 0 0 24px rgba(255, 255, 255, 0.08); }
        .server-shop-root .shop-card::before { background: linear-gradient(180deg, #ffffff, #666666); }
        .server-shop-root .shop-card-art { border-color: rgba(255, 255, 255, 0.22); background: #111111; }
        .item-shop-catalog .shop-card-art { width: 100%; height: 148px; flex-shrink: 0; }
        .item-shop-catalog .shop-card-art img { object-fit: contain; padding: 12px; }
        .server-shop-root .shop-card-title { color: #f5f5f5; }
        .server-shop-root .shop-card-meta { color: rgba(216, 216, 216, 0.62); }
        .server-shop-root .shop-card-pill { border-color: rgba(255, 255, 255, 0.22); background: rgba(255, 255, 255, 0.06); color: #eeeeee; }
      `}</style>
      <div className="shop-atmosphere" aria-hidden>
        <div className="shop-desert" />
        <div className="shop-glow" />
        <div className="shop-smoke shop-smoke-a" />
        <div className="shop-smoke shop-smoke-b" />
        {Array.from({ length: 70 }, (_, index) => (
          <span
            key={index}
            className="shop-ember"
            style={{
              left: `${(index * 13.7) % 100}%`,
              animationDelay: `${(index % 9) * -0.5}s`,
              animationDuration: `${3.2 + (index % 5) * 1.2}s`,
              width: `${2 + (index % 3)}px`,
              height: `${2 + (index % 4)}px`,
            }}
          />
        ))}
      </div>

      <header className="shop-masthead relative z-10">
        {tool && (
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Tools</div>
        )}

        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          {!tool && (
            <div className="shop-badge-row">
              <PageHexBadge hue={88} size={26} icon={<IconBolt size={22} />} aria-label="Server shop" />
              <div>
                <div className="shop-kicker">
                  {BRAND.name} · Tools
                </div>
                <h1 className="shop-title">
                  Server shop.
                </h1>
                <p className="shop-subtitle">
                  Drylands command access. Keep your factions synced, your raids rolling, and your losses patched before the next ember storm hits.
                </p>
              </div>
            </div>
          )}

        </div>

        {!tool && (
          <FadeInUp delay={0.7}>
            <div className="shop-hero-bar">
              <div className="shop-hero-meta">
                <div className="shop-hero-stat">
                  <span>Active services</span>
                  <strong>24</strong>
                </div>
                <div className="shop-hero-stat">
                  <span>Raid status</span>
                  <strong>Online</strong>
                </div>
                <div className="shop-hero-stat">
                  <span>Faction sync</span>
                  <strong>Stable</strong>
                </div>
              </div>
              <div className="shop-hero-callout">
                <span className="shop-hero-pill">Season I // Drylands</span>
                <span className="shop-hero-pill">24/7 ops</span>
              </div>
            </div>
          </FadeInUp>
        )}
        {!tool && <hr className="spectrum-divider mt-8" />}

        {!tool && (
          <div className="mx-auto mt-5 flex w-fit items-center gap-1 rounded-full border border-white/15 bg-black/70 p-1" role="tablist" aria-label="Shop sections">
            {([ ["server", "Server Shop"], ["items", "Item Shop"] ] as const).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={shopTab === id}
                onClick={() => setShopTab(id)}
                className={`rounded-full px-5 py-2 text-xs uppercase tracking-[0.18em] transition ${shopTab === id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {tool && (
          <FadeInUp delay={0.05} className="mt-2">
            <div className="relative flex flex-wrap items-center gap-3 sm:gap-4 pt-3">
              <div className="absolute inset-x-0 top-0 spectrum-divider" />
              <PageHexBadge hue={badgeHue} icon={badgeIcon} size={26} aria-label={mainTitle} />

              <div className="min-w-0 flex-1">
                <div className="text-eyebrow !text-[10px] opacity-70">
                  {subTitle ? (tool.parentTitle ?? "Sub-tool") : "Tool"}
                </div>
                <h2 className="shop-medieval-title text-lg sm:text-xl md:text-2xl leading-tight truncate">
                  {subTitle ? subTitle : mainTitle}
                </h2>
              </div>

              <div className="flex items-center gap-2 pt-1 shrink-0">
                {tool.parentTitle && (() => {
                  const parent = Object.values(FOCUSED_TOOLS).find(
                    (t) => t.primaryId === tool.primaryId && !t.parentTitle,
                  );
                  if (!parent) return null;
                  return (
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/tools", search: { focus: parent.slug, workspace }, replace: false })}
                      title={`Back to ${tool.parentTitle}`}
                      aria-label={`Back to ${tool.parentTitle}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-glass-strong hover:text-foreground"
                    >
                      <IconArrowRight size={12} className="rotate-180" />
                      <span className="hidden sm:inline">Back to {tool.parentTitle}</span>
                      <span className="sm:hidden">Back</span>
                    </button>
                  );
                })()}
                {tool.slug !== "faction-hub" && (
                  <Link
                    to={tool.fullRouteTo}
                    title="Open as full page"
                    className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-glass/40 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-glass-strong hover:text-foreground"
                  >
                    Open full <IconArrowRight size={12} />
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close panel (Esc)"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-glass-border bg-glass/40 text-muted-foreground transition hover:bg-glass-strong hover:text-foreground"
                >
                  <IconClose size={14} />
                </button>
              </div>

            </div>
          </FadeInUp>
        )}
        {tool && (
          <button
            type="button"
            onClick={handleClose}
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground/70 transition hover:text-foreground"
          >
            <span aria-hidden="true">←</span> Marketing Tools
          </button>
        )}
      </header>

      <div className={tool ? "relative flex min-h-[calc(100vh-13rem)] flex-1 flex-col" : "relative"}>
        {!tool && (
          <>
            {shopTab === "server" ? (
              <ServiceDirectory
                onOpen={(focus) => navigate({ to: "/tools", search: { focus, workspace } })}
              />
            ) : (
              <ItemShop />
            )}
          </>
        )}

        {/* Summary band — stays inside the content column, above the panel. */}
        {tool?.Summary && (
          <section className="relative z-20 px-4 sm:px-6">
            <tool.Summary />
          </section>
        )}

        {tool ? (
          <div className="relative z-30 flex min-h-0 min-w-0 flex-1">
            <div className="flex min-h-0 min-w-0 w-full flex-1">
              <FocusedToolPanel tool={tool} onClose={handleClose} />
            </div>
          </div>
        ) : (
          <FocusedToolPanel tool={tool} onClose={handleClose} />
        )}
      </div>




      {!tool && (
        <footer className="mt-auto flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-glass-border/60 px-4 sm:px-6 pt-3 text-[11px] text-muted-foreground/80">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <Link to="/tools" search={{ focus: "campaign-events" }} className="hover:text-foreground">Event request</Link>
            <span className="opacity-30">·</span>
            <Link to="/tools" search={{ focus: "campaign-list-cleaner" }} className="hover:text-foreground">List cleaner</Link>
            <span className="opacity-30">·</span>
            <Link to="/tools" search={{ focus: "utm-taxonomy" }} className="hover:text-foreground">Naming conventions</Link>
            <span className="opacity-30">·</span>
            <Link to="/tools" search={{ focus: "funnel-targets" }} className="hover:text-foreground">MQL / SQO targets</Link>
          </div>
          <Link to="/connectors" className="hover:text-foreground">Manage connectors →</Link>
        </footer>
      )}

    </div>
  );
}

function ServiceDirectory({ onOpen }: { onOpen: (focus: string) => void }) {
  return (
    <section className="shop-directory-wrap" aria-label="Server service directory">
      <div className="shop-directory-shell">
        <div className="shop-directory-grid">
          {SERVICE_GROUPS.map((group) => (
            <button
              key={group.name}
              type="button"
              onClick={() => group.items[0] && onOpen(group.items[0].focus)}
              className="shop-card group"
            >
              <span className="shop-card-art" aria-hidden>
                {group.name === "Faction Hub" && <img src="/factions.jpg" alt="" />}
                {group.name === "Base Ops" && <img src="/baseops.jpg" alt="" />}
                {group.name === "Zombie Hordes" && <img src="/zombie.jpg" alt="" />}
                {group.name !== "Faction Hub" && group.name !== "Base Ops" && group.name !== "Zombie Hordes" && (
                  <span
                    className="inline-flex size-full items-center justify-center"
                    style={{ background: `oklch(0.28 0.12 ${group.hue} / 0.55)`, color: `oklch(0.9 0.12 ${group.hue})` }}
                  >
                    {group.icon}
                  </span>
                )}
              </span>
              <span className="shop-card-content">
                <span className="shop-card-title shop-medieval-title">{group.name}</span>
                <span className="shop-card-meta">{group.items.length} services · {group.description}</span>
                <span className="shop-card-pills">
                  {group.items.slice(0, 2).map((item) => (
                    <span key={item.label} className="shop-card-pill">{item.label}</span>
                  ))}
                </span>
              </span>
              <IconArrowRight size={14} className="ml-auto mt-auto text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function ItemShop() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof ITEM_FILTERS)[number]>("All");
  const [selected, setSelected] = useState<ShopItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [credits, setCredits] = useState(50_000);
  const [owned, setOwned] = useState<string[]>([]);
  const [cart, setCart] = useState<Array<{ item: ShopItem; quantity: number }>>([]);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [deliveryServer, setDeliveryServer] = useState<DayZServerId>(DAYZ_SERVERS[0].id);
  const [coordX, setCoordX] = useState("");
  const [coordZ, setCoordZ] = useState("");
  const markImageFailed = (id: string) => setFailedImages((current) => new Set(current).add(id));
  const useMyLocation = () => {
    setCoordX("7500");
    setCoordZ("7500");
    toast.success("Location captured", { description: "Using your last known in-game position." });
  };
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ITEM_CATALOG
      .filter((entry) => filter === "All" || filter === "Name A-Z" || entry.category === filter)
      .filter((entry) => !normalized || `${entry.name} ${entry.category} ${entry.detail}`.toLowerCase().includes(normalized))
      .sort((a, b) => filter === "Name A-Z" ? a.name.localeCompare(b.name) : 0);
  }, [filter, query]);

  const choose = (entry: ShopItem) => {
    setSelected(entry);
    setQuantity(1);
  };

  const addItemToCart = (entry: ShopItem, count: number) => {
    setCart((current) => {
      const existing = current.find((line) => line.item.id === entry.id);
      if (existing) return current.map((line) => line.item.id === entry.id ? { ...line, quantity: Math.min(10, line.quantity + count) } : line);
      return [...current, { item: entry, quantity: count }];
    });
    toast.success(`${entry.name} added to cart`, { description: `${count} item${count === 1 ? "" : "s"} ready for checkout.` });
  };

  const addToCart = () => {
    if (!selected) return;
    addItemToCart(selected, quantity);
    setSelected(null);
  };

  const cartTotal = cart.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

  const checkout = () => {
    if (!cart.length) return;
    if (!coordX.trim() || !coordZ.trim()) {
      toast.error("Delivery location required", { description: "Enter coordinates or use \"Spawn at my location\"." });
      return;
    }
    if (credits < cartTotal) {
      toast.error("Not enough credits", { description: `You need ${cartTotal.toLocaleString()} credits.` });
      return;
    }
    setCredits((value) => value - cartTotal);
    setOwned((current) => [...new Set([...current, ...cart.map((line) => line.item.id)])]);
    toast.success("Order confirmed", {
      description: `${cart.length} line item${cart.length === 1 ? "" : "s"} routed to ${deliveryServer} at (${coordX}, ${coordZ}).`,
    });
    setCart([]);
    setCoordX("");
    setCoordZ("");
  };

  const removeFromCart = (id: string) => setCart((current) => current.filter((line) => line.item.id !== id));

  const selectedTotal = selected ? selected.price * quantity : 0;

  return (
    <section className="shop-directory-wrap item-shop-catalog" aria-label="Item Shop catalog">
      <div className="shop-directory-shell">
            <div className="border-b border-white/10 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="shop-medieval-title text-2xl text-primary">Item catalogue</h2>
                  <p className="mt-1 text-xs text-muted-foreground">DayZ field gear, weapons, ammunition, and survival stock.</p>
                </div>
                <div className="text-right text-xs text-muted-foreground"><span className="text-primary">{credits.toLocaleString()}</span> credits · {owned.length} owned</div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-lg border border-white/15 bg-black/60 px-3">
                  <IconSearch size={15} className="text-primary" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search every item..." className="w-full bg-transparent py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                </label>
                <select value={filter} onChange={(event) => setFilter(event.target.value as (typeof ITEM_FILTERS)[number])} className="rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-foreground outline-none">
                  {ITEM_FILTERS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>
            </div>
            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filtered.map((entry) => (
                    <article key={entry.id} className={`shop-card min-h-0 flex-col text-left ${selected?.id === entry.id ? "border-primary" : ""}`}>
                      <div className="shop-card-art relative flex h-32 w-full shrink-0 items-center justify-center bg-black">
                        {!failedImages.has(entry.id) ? (
                          <img
                            src={entry.image}
                            alt={entry.name}
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-contain p-3"
                            onError={() => markImageFailed(entry.id)}
                          />
                        ) : (
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">No image</span>
                        )}
                      </div>
                      <button type="button" onClick={() => choose(entry)} className="shop-card-content text-left">
                        <span className="shop-card-title shop-medieval-title">{entry.name}</span>
                        <span className="shop-card-meta">{entry.detail}</span>
                        <div className="mt-3 flex items-center justify-between gap-2"><span className="shop-card-pill">{entry.category}</span><span className="text-xs font-semibold text-primary">{entry.price.toLocaleString()}</span></div>
                        {owned.includes(entry.id) && <span className="mt-2 text-[10px] uppercase tracking-wider text-emerald-300">Owned</span>}
                      </button>
                      <button type="button" onClick={() => addItemToCart(entry, 1)} className="mt-4 rounded-lg border border-primary/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary transition hover:bg-primary hover:text-primary-foreground">Add to cart</button>
                    </article>
                  ))}
                </div>
                {filtered.length === 0 && <p className="p-10 text-center text-sm text-muted-foreground">No items match that search.</p>}
                {selected && (
                  <div className="mt-5 rounded-xl border border-primary/25 bg-black/80 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div><div className="text-[10px] uppercase tracking-[0.2em] text-primary">Purchase review</div><h3 className="shop-medieval-title mt-1 text-2xl">{selected.name}</h3><p className="mt-1 max-w-xl text-sm text-muted-foreground">{selected.detail}</p></div>
                      <button type="button" onClick={() => setSelected(null)} className="text-xs text-muted-foreground hover:text-foreground">Close</button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="text-xs uppercase tracking-wider text-muted-foreground">Quantity <input type="number" min={1} max={10} value={quantity} onChange={(event) => setQuantity(Math.min(10, Math.max(1, Number(event.target.value) || 1)))} className="ml-2 w-16 rounded border border-white/15 bg-black px-2 py-1.5 text-center text-foreground" /></label>
                      <span className="text-sm text-muted-foreground">Total <strong className="text-primary">{selectedTotal.toLocaleString()} credits</strong></span>
                      <button type="button" onClick={addToCart} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110">Add to cart</button>
                    </div>
                  </div>
                )}
              </div>

              <aside className="rounded-xl border border-primary/25 bg-black/90 p-4 lg:sticky lg:top-24 lg:h-fit">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="shop-medieval-title text-xl text-primary">Cart</h3>
                  <span className="text-xs text-muted-foreground">{cart.reduce((sum, line) => sum + line.quantity, 0)} items</span>
                </div>
                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {cart.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Your cart is empty.</p>
                  ) : (
                    cart.map((line) => (
                      <div key={line.item.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs">
                        <span className="truncate">{line.item.name} <span className="text-muted-foreground">× {line.quantity}</span></span>
                        <span className="shrink-0 text-primary">{(line.item.price * line.quantity).toLocaleString()}</span>
                        <button type="button" onClick={() => removeFromCart(line.item.id)} className="shrink-0 text-muted-foreground hover:text-white">✕</button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-primary">Delivery</div>
                  <select value={deliveryServer} onChange={(event) => setDeliveryServer(event.target.value as DayZServerId)} className="mt-2 w-full rounded-lg border border-white/15 bg-black px-3 py-2 text-sm text-foreground outline-none">
                    {DAYZ_SERVERS.map((server) => <option key={server.id} value={server.id}>{server.label}</option>)}
                  </select>
                  <div className="mt-2 flex gap-2">
                    <input value={coordX} onChange={(event) => setCoordX(event.target.value)} placeholder="X" className="w-full rounded-lg border border-white/15 bg-black px-2 py-2 text-center text-sm text-foreground outline-none" />
                    <input value={coordZ} onChange={(event) => setCoordZ(event.target.value)} placeholder="Z" className="w-full rounded-lg border border-white/15 bg-black px-2 py-2 text-center text-sm text-foreground outline-none" />
                  </div>
                  <button type="button" onClick={useMyLocation} className="mt-2 w-full rounded-lg border border-glass-border px-3 py-2 text-xs text-muted-foreground transition hover:bg-glass/40 hover:text-foreground">Spawn at my location</button>
                </div>

                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Total</span><strong className="text-primary">{cartTotal.toLocaleString()} credits</strong></div>
                  <button type="button" onClick={checkout} disabled={!cart.length} className="mt-3 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">Complete checkout</button>
                </div>
              </aside>
            </div>
      </div>
    </section>
  );
}
