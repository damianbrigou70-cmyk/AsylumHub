import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState, type ReactNode } from "react";
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
} from "@/components/ui-custom/CustomIcon";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { FocusedToolPanel } from "@/components/tools/FocusedToolPanel";
import { FadeInUp } from "@/components/motion/WordStagger";
import { BRAND } from "@/lib/brand";


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
            <ServiceDirectory
              onOpen={(focus) => navigate({ to: "/tools", search: { focus, workspace } })}
            />
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
