import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { DayZPageHeader } from "@/components/dayz/DayZPageHeader";
import { IconBolt, IconChart, IconSpark, IconWorkspace, IconImport, IconAudience, IconCampaign } from "@/components/ui-custom/CustomIcon";
import { getEconomyBalance } from "@/lib/economy.functions";
import { getKillfeed } from "@/lib/killfeed.functions";
import { getAsylumServerStatus } from "@/lib/dayz/server-status.functions";
import { DAYZ_SERVERS } from "@/lib/dayz/servers";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

const QUICK = [
  { to: "/servers", label: "Servers", desc: "Nitrado status & online", Icon: IconBolt, hue: 55 },
  { to: "/economy", label: "Economy", desc: "Balance, pay, XP", Icon: IconChart, hue: 45 },
  { to: "/operations", label: "Operations", desc: "Contracts", Icon: IconCampaign, hue: 12 },
  { to: "/stats", label: "Leaderboards", desc: "Kills, K/D & server ranks", Icon: IconChart, hue: 200 },
  { to: "/live", label: "Live", desc: "Online + kills + events", Icon: IconSpark, hue: 12 },
  { to: "/factions", label: "Factions", desc: "Wars & bounties", Icon: IconWorkspace, hue: 280 },
  { to: "/tools/npc-shop", label: "NPC Shop", desc: "Buy & spawn NPCs", Icon: IconImport, hue: 160 },
  { to: "/account", label: "Account", desc: "Discord â†’ PSN", Icon: IconAudience, hue: 260 },
] as const;

function Dashboard() {
  const balanceQ = useQuery({
    queryKey: ["economy-balance"],
    queryFn: () => getEconomyBalance({ data: {} }),
  });
  const killsQ = useQuery({
    queryKey: ["live-preview"],
    queryFn: () => getKillfeed({ data: { server: "all", limit: 5 } }),
  });
  const statusQ = useQuery({
    queryKey: ["nitrado-status-lobby", DAYZ_SERVERS[0].id],
    queryFn: () => getAsylumServerStatus({ data: { serverId: DAYZ_SERVERS[0].id } }),
    retry: 0,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <section className="relative mb-8 overflow-hidden rounded-[2rem] border border-primary/30 bg-black px-6 py-10 shadow-[0_0_70px_-25px_color-mix(in_oklab,var(--primary)_45%,transparent)] sm:px-10">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(135deg,transparent_0%,transparent_48%,color-mix(in_oklab,var(--primary)_20%,transparent)_49%,transparent_50%),linear-gradient(45deg,transparent_0%,transparent_48%,color-mix(in_oklab,var(--primary)_12%,transparent)_49%,transparent_50%)] [background-size:42px_42px]" />
        <div className="relative max-w-2xl">
          <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
            <span className="h-px w-10 bg-primary" /> Asylum command hall
          </div>
          <h1 className="font-display text-5xl leading-none text-primary sm:text-7xl">{BRAND.name}</h1>
          <p className="mt-4 max-w-lg text-sm text-zinc-300 sm:text-base">{BRAND.tagline}</p>
          <div className="mt-7 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
            <IconBolt size={14} className="text-primary" /> Live operational board
          </div>
        </div>
      </section>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <GlassPanel className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Credits</div>
          <div className="mt-1 font-display text-2xl text-primary">
            {balanceQ.data ? balanceQ.data.balance.toLocaleString() : "â€”"}
          </div>
        </GlassPanel>
        <GlassPanel className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{DAYZ_SERVERS[0].label}</div>
          <div className="mt-1 text-lg font-medium">
            {statusQ.data
              ? statusQ.data.status === "started"
                ? `Online Â· ${statusQ.data.players.current}/${statusQ.data.players.max}`
                : statusQ.data.status
              : statusQ.error
                ? "Configure Nitrado"
                : "â€”"}
          </div>
        </GlassPanel>
        <GlassPanel className="p-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Live kills</div>
          <div className="mt-1 text-lg font-medium">{killsQ.data?.events.length ?? 0} loaded</div>
        </GlassPanel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {QUICK.map((q) => (
          <Link
            key={q.to}
            to={q.to as "/servers"}
            className="rounded-2xl border border-glass-border bg-glass/30 p-4 transition hover:border-primary/40 hover:bg-glass/50"
          >
            <q.Icon size={18} className="text-primary" />
            <div className="mt-3 font-medium">{q.label}</div>
            <div className="text-xs text-muted-foreground">{q.desc}</div>
          </Link>
        ))}
      </div>

      <GlassPanel className="mt-6 p-5">
        <h2 className="mb-3 text-sm font-medium">Latest live kills</h2>
        {(killsQ.data?.events.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground">
            No events yet — configure FTP log paths or open Live for setup details.
          </p>
        )}
        <ul className="space-y-2">
          {killsQ.data?.events.map((e) => (
            <li key={e.id} className="text-sm">
              <span className="text-emerald-300">{e.killer}</span>
              <span className="text-muted-foreground"> â†’ </span>
              <span className="text-red-300">{e.victim}</span>
              <span className="ml-2 text-[11px] text-muted-foreground">{e.server}</span>
            </li>
          ))}
        </ul>
      </GlassPanel>
    </div>
  );
}