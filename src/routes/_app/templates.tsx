import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgId } from "@/hooks/use-org";
import { useServerFn } from "@tanstack/react-start";
import { instantiateTemplate } from "@/lib/templates.functions";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import {
  IconTemplate,
  IconCampaign,
  IconAudience,
  IconImport,
  IconUtm,
  IconArrowRight,
} from "@/components/ui-custom/CustomIcon";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/templates")({
  component: TemplatesPage,
});

type Template = {
  slug: string;
  name: string;
  description: string;
  channel: string;
  goal: string;
  Icon: typeof IconCampaign;
  tags: string[];
};

const TEMPLATES: Template[] = [
  {
    slug: "product-launch",
    name: "Skins",
    description: "Multi-week skin drop with teaser, launch day, and follow-up. Pre-wires names, audience, UTMs, and a launch checklist.",
    channel: "paid-social",
    goal: "Drive signups and demo requests for a new product release.",
    Icon: IconCampaign,
    tags: ["launch", "paid-social", "email"],
  },
  {
    slug: "webinar",
    name: "Webinar",
    description: "Promotion → registration → live → replay. Includes invite list import and post-event nurture.",
    channel: "email",
    goal: "Maximize qualified registrations and on-day attendance.",
    Icon: IconAudience,
    tags: ["event", "email", "linkedin"],
  },
  {
    slug: "newsletter",
    name: "Cassetes",
    description: "Single-send recurring cassette template. Pre-wires found tape archives, labels, and playback notes.",
    channel: "email",
    goal: "Lift open rate and click-through on the next send.",
    Icon: IconImport,
    tags: ["recurring", "email"],
  },
  {
    slug: "paid-acquisition",
    name: "Paid acquisition",
    description: "Always-on paid sprint with weekly creative rotation, UTM hygiene, and per-channel budget tracking.",
    channel: "paid-search",
    goal: "Drive low-CPA acquisitions across paid search and social.",
    Icon: IconUtm,
    tags: ["paid-search", "paid-social", "always-on"],
  },
];

const MY_SKINS = [
  { category: "Car skins", name: "Ash Runner", detail: "Armored sedan · Equipped", Icon: IconCampaign },
  { category: "Weapon skins", name: "Redline AK", detail: "Assault rifle · Equipped", Icon: IconUtm },
  { category: "Clothing skins", name: "Wasteland Ghost", detail: "Tactical outfit · Equipped", Icon: IconImport },
];
const MY_CASSETTES = [
  { name: "Dead Air", detail: "Found tape · Archive 01" },
  { name: "Static on Channel 9", detail: "Found tape · Archive 02" },
  { name: "The Last Broadcast", detail: "Found tape · Archive 03" },
];

function TemplatesPage() {
  const orgId = useOrgId();
  const { user } = useAuth();
  const nav = useNavigate();
  const instantiate = useServerFn(instantiateTemplate);
  const [creating, setCreating] = useState<string | null>(null);
  const [skinsOpen, setSkinsOpen] = useState(false);
  const [cassettesOpen, setCassettesOpen] = useState(false);

  const useTemplate = async (t: Template) => {
    if (t.slug === "product-launch") {
      setSkinsOpen(true);
      return;
    }
    if (t.slug === "newsletter") {
      setCassettesOpen(true);
      return;
    }
    if (!orgId || !user) return;
    setCreating(t.slug);
    try {
      const res = await instantiate({ data: { slug: t.slug } });
      toast.success(`${t.name} loaded — workspace, checklist, and KPI seeded`);
      nav({ to: "/campaigns/$id", params: { id: res.id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create campaign");
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <PageHexBadge hue={88} size={26} icon={<IconTemplate size={22} />} aria-label="Templates" />
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Templates</div>
          <h1 className="mt-1 font-display text-4xl tracking-tight">Start from a playbook</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Skip the blank page. Each template creates a workspace with a goal, suggested channel, starter checklist, and KPI so you can dive straight in. Edit anything once you're inside.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {TEMPLATES.map((t) => (
          <GlassPanel key={t.slug} className="flex flex-col gap-4 p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <t.Icon size={20} />
              </span>
              <div className="min-w-0">
                <div className="font-display text-lg">{t.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {t.tags.map((tag) => (
                <span key={tag} className="rounded-full border border-glass-border bg-glass/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
            <button
              onClick={() => useTemplate(t)}
              disabled={creating === t.slug}
              className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {t.slug === "product-launch"
                ? "View my skins"
                : t.slug === "newsletter"
                  ? "View my cassettes"
                  : creating === t.slug
                    ? "Creating…"
                    : "Use this template"}
              <IconArrowRight size={14} />
            </button>
          </GlassPanel>
        ))}
      </div>

      {skinsOpen && (
        <GlassPanel tier="strong" className="space-y-4 border-white/10 bg-black/90 p-6 shadow-[0_20px_80px_-24px_rgba(0,0,0,0.9)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-white/60">Locker</div>
              <h2 className="mt-1 font-display text-2xl">My skins</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your equipped DayZ cosmetics, ready for the next deployment.</p>
            </div>
            <button
              type="button"
              onClick={() => setSkinsOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {MY_SKINS.map((skin) => (
              <div key={skin.category} className="rounded-xl border border-white/10 bg-black/70 p-4">
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-white/10 text-white/80">
                  <skin.Icon size={18} />
                </span>
                <div className="mt-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{skin.category}</div>
                <div className="mt-1 font-display text-lg">{skin.name}</div>
                <div className="mt-1 text-xs text-white/60">{skin.detail}</div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {cassettesOpen && (
        <GlassPanel tier="strong" className="space-y-4 border-primary/40 p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-primary">Found tapes</div>
              <h2 className="mt-1 font-display text-2xl">My cassettes</h2>
              <p className="mt-1 text-sm text-muted-foreground">Recovered recordings from across the server.</p>
            </div>
            <button
              type="button"
              onClick={() => setCassettesOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Close
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {MY_CASSETTES.map((cassette) => (
              <div key={cassette.name} className="rounded-xl border border-glass-border bg-glass/30 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 font-mono text-xs text-primary">TAPE</span>
                  <div className="min-w-0">
                    <div className="truncate font-display text-lg">{cassette.name}</div>
                    <div className="mt-1 text-xs text-primary">{cassette.detail}</div>
                  </div>
                </div>
                <button type="button" className="mt-4 text-xs text-muted-foreground hover:text-foreground">
                  Inspect tape →
                </button>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      <GlassPanel className="p-5 text-xs text-muted-foreground">
        Each template creates a workspace with a goal, channel, starter checklist, and KPI so you can start editing immediately.{" "}
        <Link to="/campaigns" className="text-primary underline-offset-4 hover:underline">Browse campaigns →</Link>
      </GlassPanel>
    </div>
  );
}
