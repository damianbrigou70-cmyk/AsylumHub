import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useDraft } from "@/hooks/use-draft";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import {
  IconTrophy,
  IconChevronLeft,
  IconArrowRight,
  IconCampaign,
} from "@/components/ui-custom/CustomIcon";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useOrgId } from "@/hooks/use-org";
import { toast } from "sonner";
import { z } from "zod";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/tools/event-intake")({
  component: () => <HackathonRequestContent />,
  head: () => ({
    meta: [
      { title: `Event request — ${BRAND.name}` },
      {
        name: "description",
        content:
          "Submit an event sponsorship or hosting request. Marketing will follow up.",
      },
    ],
  }),
});

const EVENT_TYPES = [
  { value: "conference", label: "Conference" },
  { value: "hackathon", label: "Hackathon" },
  { value: "meetup", label: "Meetup" },
  { value: "webinar", label: "Webinar" },
  { value: "other", label: "Other" },
] as const;

const schema = z.object({
  requesterEmail: z.string().trim().email("Valid email required").max(255),
  company: z.string().trim().min(1).max(120),
  eventType: z.enum(["conference", "hackathon", "meetup", "webinar", "other"]).optional(),
  eventName: z.string().trim().min(1).max(160),
  eventDate: z.string().trim().min(1, "Date required"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

// Export name kept for import compatibility across the tools registry.
export function HackathonRequestContent({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const orgId = useOrgId();
  const [form, setForm, { clearDraft }] = useDraft("tools/hackathon-request:form", {
    requesterEmail: "",
    company: "",
    eventType: "" as "" | (typeof EVENT_TYPES)[number]["value"],
    eventName: "",
    eventDate: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set =
    (k: "requesterEmail" | "company" | "eventName" | "eventDate" | "notes") =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, eventType: form.eventType === "" ? undefined : form.eventType };
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (!orgId) {
      toast.error("Workspace not ready yet");
      return;
    }
    setSubmitting(true);
    const typeLabel = parsed.data.eventType
      ? EVENT_TYPES.find((t) => t.value === parsed.data.eventType)?.label ?? "Event"
      : "Event";
    const brief = `${typeLabel}: ${parsed.data.eventName}\nCompany: ${parsed.data.company}\nDate: ${parsed.data.eventDate}\n\n${parsed.data.notes ?? ""}`;
    const { error } = await supabase.from("campaign_requests").insert({
      org_id: orgId,
      requestor_email: parsed.data.requesterEmail,
      brief,
      status: "new",
      desired_due_date: parsed.data.eventDate,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't submit. Try again.");
      return;
    }
    setDone(true);
    clearDraft();
  };

  if (done) {
    return (
      <div className="space-y-6">
        {!hideHeader && (
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft size={14} /> Back to tools
          </Link>
        )}
        <GlassPanel className="p-10 text-center">
          <div className="font-display text-3xl">Request received</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            We've added it to the requests queue. Marketing will follow up shortly.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              to="/requests"
              className="rounded-full border border-glass-border px-4 py-2 text-sm hover:bg-glass"
            >
              View requests
            </Link>
            <Link
              to="/tools"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground hover:opacity-90"
            >
              Back to tools <IconArrowRight size={14} />
            </Link>
          </div>
        </GlassPanel>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      {!hideHeader && (
        <>
          <Link
            to="/tools"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <IconChevronLeft size={14} /> Back to tools
          </Link>

          <header className="flex items-start gap-4">
            <PageHexBadge hue={340} icon={<IconTrophy size={26} />} aria-label="Event request" />
            <div>
              <h1 className="font-display text-3xl md:text-4xl">Event request</h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Submit an event sponsorship or hosting request — conference, hackathon,
                meetup, webinar, or something else. The marketing team will triage it from
                your Requests queue.
              </p>
            </div>
          </header>
        </>
      )}
      <p className="-mt-3 text-sm text-muted-foreground">
        Submitted requests land in your{" "}
        <Link to="/requests" className="text-primary hover:underline">Requests queue</Link>{" "}
        for triage, and appear on the{" "}
        <Link to="/calendar" className="text-primary hover:underline">Calendar</Link>{" "}
        on their due date.
      </p>

      <GlassPanel className="p-6">
        <form onSubmit={submit} className="space-y-7">
          <fieldset className="space-y-4">
            <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Your contact
            </legend>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Your email *</Label>
              <Input
                type="email"
                value={form.requesterEmail}
                onChange={set("requesterEmail")}
                className="glass border-glass-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Company / organization *</Label>
              <Input
                value={form.company}
                onChange={set("company")}
                className="glass border-glass-border"
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Event details
            </legend>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Event type</Label>
              <Select
                value={form.eventType || undefined}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, eventType: v as typeof f.eventType }))
                }
              >
                <SelectTrigger className="glass border-glass-border">
                  <SelectValue placeholder="Select an event type" />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground/85">Event name *</Label>
                <Input
                  value={form.eventName}
                  onChange={set("eventName")}
                  className="glass border-glass-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground/85">Event date *</Label>
                <Input
                  type="date"
                  value={form.eventDate}
                  onChange={set("eventDate")}
                  className="glass border-glass-border"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground/85">Notes</Label>
              <Textarea
                rows={4}
                placeholder="Format, audience size, what you're asking for, etc."
                value={form.notes}
                onChange={set("notes")}
                className="glass border-glass-border"
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit request"}
            <IconArrowRight size={14} />
          </button>
        </form>
      </GlassPanel>
    </div>
  );
}

function LegacyFactionHubContent() {
  const [factionName, setFactionName] = useState("Ashfall Syndicate");
  const [flag, setFlag] = useState("◆");
  const [members, setMembers] = useState(["Rook", "Mara", "Ghost"]);
  const [newMember, setNewMember] = useState("");
  const [created, setCreated] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const addMember = () => {
    const name = newMember.trim();
    if (!name || members.includes(name)) return;
    setMembers((current) => [...current, name]);
    setNewMember("");
  };

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
    >
      <motion.header className="flex items-start gap-4" variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}>
        <PageHexBadge hue={145} icon={<IconCampaign size={26} />} aria-label="Faction Hub" />
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Faction Hub</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Create your faction, shape its identity, and manage the people fighting beside you.</p>
        </div>
      </motion.header>

      {!created ? (
        <GlassPanel className="p-6">
          {!createOpen ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="grid size-20 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-4xl text-primary">{flag}</div>
              <h2 className="mt-5 font-display text-2xl">No faction yet</h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">Build your crew, choose your banner, and take control of your own faction.</p>
              <button type="button" onClick={() => setCreateOpen(true)} className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">Create faction</button>
            </div>
          ) : (
            <div className="space-y-4">
              <button type="button" onClick={() => setCreateOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
              <div>
                <h2 className="font-display text-xl">Create your faction</h2>
                <p className="mt-1 text-sm text-muted-foreground">Choose the identity your crew will carry.</p>
              </div>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Faction name</div>
              <Input value={factionName} onChange={(e) => setFactionName(e.target.value)} placeholder="Enter faction name" />
            </div>
            <div>
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">Choose a flag</div>
              <div className="flex gap-2">
                {["◆", "☠", "✦", "⬟"].map((choice) => (
                  <button key={choice} type="button" onClick={() => setFlag(choice)} className={`grid size-11 place-items-center rounded-lg border text-xl ${flag === choice ? "border-primary bg-primary/20 text-primary" : "border-glass-border text-muted-foreground hover:bg-glass/50"}`}>{choice}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3">
              <span className="text-sm">Creation cost</span>
              <span className="font-mono text-sm text-amber-200">10,000 credits</span>
            </div>
            <button
              type="button"
              disabled={!factionName.trim()}
              onClick={() => setCreated(true)}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create faction · 10,000 credits
            </button>
            </div>
          )}
        </GlassPanel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <GlassPanel className="p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded-xl border border-primary/40 bg-primary/10 text-3xl text-primary">{flag}</div>
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your faction</div>
                <h2 className="font-display text-2xl">{factionName}</h2>
                <p className="text-xs text-muted-foreground">{members.length} members · Active</p>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-glass-border bg-glass/20 p-4">
                <div className="text-xs text-muted-foreground">Faction name</div>
                <Input className="mt-2" value={factionName} onChange={(e) => setFactionName(e.target.value)} />
              </div>
              <div className="rounded-lg border border-glass-border bg-glass/20 p-4">
                <div className="text-xs text-muted-foreground">Change flag</div>
                <div className="mt-2 flex gap-2">
                  {["◆", "☠", "✦", "⬟"].map((choice) => (
                    <button key={choice} type="button" onClick={() => setFlag(choice)} className={`grid size-9 place-items-center rounded-lg border text-lg ${flag === choice ? "border-primary bg-primary/20 text-primary" : "border-glass-border text-muted-foreground"}`}>{choice}</button>
                  ))}
                </div>
              </div>
            </div>
          </GlassPanel>

          <GlassPanel className="p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Manage faction</div>
                <h2 className="font-display text-xl">Members</h2>
              </div>
              <span className="text-xs text-primary">{members.length} active</span>
            </div>
            <div className="mt-4 space-y-2">
              {members.map((member) => (
                <div key={member} className="flex items-center justify-between rounded-lg border border-glass-border bg-glass/20 px-3 py-2 text-sm">
                  <span>{member}</span>
                  <button type="button" onClick={() => setMembers((current) => current.filter((name) => name !== member))} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Input value={newMember} onChange={(e) => setNewMember(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addMember()} placeholder="Player name" />
              <button type="button" onClick={addMember} className="rounded-lg border border-glass-border px-3 text-xs hover:bg-glass/50">Add</button>
            </div>
          </GlassPanel>
        </div>
      )}
    </motion.div>
  );
}

type FactionProfile = {
  name: string;
  flag: string;
  map: "101x" | "102x";
  members: string[];
  credits: number;
  reputation: number;
};

const FACTION_STORAGE_KEY = "asylumhub:faction-profile";
const FACTION_FLAGS = [
  ["dayz", "DayZ", "Flag_DayZ.png"], ["white", "White", "Flag_White.png"], ["bohemia", "Bohemia Interactive", "Flag_Bohemia.png"], ["pirates", "Pirates", "Flag_Pirates.png"],
  ["cannibals", "Cannibals", "Flag_Cannibals.png"], ["baby-deer", "Baby Deer", "Flag_BabyDeer.png"], ["refuge", "Refuge", "Flag_Refuge.png"], ["rsta", "RSTA", "Flag_RSTA.png"],
  ["snake", "Snake", "Flag_Snake.png"], ["cdf", "Chernarussian Defence Forces", "Flag_CDF.png"], ["chel", "CHEL", "Flag_CHEL.png"], ["cmc", "Chernarus Mining Corporation", "Flag_CMC.png"],
  ["chedaki", "Chernarussian Movement of the Red Star", "Flag_Chedaki.png"], ["chernarus", "Republic of Chernarus", "Flag_Chernarus.png"], ["hunterz", "Zombie Hunters", "Flag_HunterZ.png"], ["napa", "National Party (NAPA)", "Flag_NAPA.png"],
  ["rooster", "Rooster", "Flag_Rooster.png"], ["tec", "TEC", "Flag_TEC.png"], ["uec", "United Earth Coalition", "Flag_UEC.png"], ["wolf", "Wolf", "Flag_Wolf.png"], ["zenit", "Zenit Radio Station", "Flag_Zenit.png"],
  ["apa", "Asian Pacific Alliance", "Flag_APA.png"], ["altis", "Republic of Altis and Stratis", "Flag_Altis.png"], ["bear", "Bear", "Flag_Bear.png"], ["brainz", "BrainZ", "Flag_BrainZ.png"], ["crook", "Crook", "Flag_Crook.png"],
  ["livonia", "Livonia", "Flag_Livonia.png"], ["ldf", "Livonian Defense Force", "Flag_LivoniaArmy.png"], ["livonia-police", "Livonia Police", "Flag_LivoniaPolice.png"], ["north-sahrani", "Democratic Republic of Sahrani", "Flag_NSahrani.png"],
  ["rex", "Rex", "Flag_Rex.png"], ["south-sahrani", "Kingdom of Sahrani", "Flag_SSahrani.png"], ["zagorky", "Zagorky", "Flag_Zagorky.png"], ["sakhal", "Sakhal", "Sakhal_flag.PNG"],
] as const;
type FactionFlagId = (typeof FACTION_FLAGS)[number][0];
const flagImage = (file: string) => `https://dayz.fandom.com/wiki/Special:FilePath/${encodeURIComponent(file)}`;
const SERVER_FACTIONS = [
  { name: "Ashfall Syndicate", flag: "dayz", members: 24, standing: "Territory holders" },
  { name: "Black Meridian", flag: "wolf", members: 17, standing: "Contract runners" },
  { name: "The Lanterns", flag: "zenit", members: 11, standing: "Scouts and traders" },
  { name: "Iron Wolves", flag: "bear", members: 31, standing: "Heavy response" },
];
type FactionWar = { id: string; target: string; status: "active" | "ceasefire"; startedAt: string };

const legacyFlagIds: Record<string, FactionFlagId> = { "◆": "dayz", "☠": "wolf", "✦": "zenit", "⬟": "bear", "◈": "snake", "✚": "cdf" };
const getFactionFlag = (id: string) => FACTION_FLAGS.find(([flagId]) => flagId === id || legacyFlagIds[id] === flagId) ?? FACTION_FLAGS[0];

export function FactionHubContent() {
  const [faction, setFaction] = useState<FactionProfile | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [flag, setFlag] = useState(FACTION_FLAGS[0][0] as FactionFlagId);
  const [map, setMap] = useState<"101x" | "102x">("102x");
  const [newMember, setNewMember] = useState("");
  const [joinRequests, setJoinRequests] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [warTarget, setWarTarget] = useState(SERVER_FACTIONS[0].name);
  const [wars, setWars] = useState<FactionWar[]>([]);
  const selectedFlag = getFactionFlag(flag);
  const takenFlags = new Set(SERVER_FACTIONS.map((serverFaction) => getFactionFlag(serverFaction.flag)[0]));
  if (faction) takenFlags.add(getFactionFlag(faction.flag)[0]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(FACTION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<FactionProfile>;
        setFaction({ name: parsed.name ?? "", flag: parsed.flag ?? FACTION_FLAGS[0][0], map: parsed.map ?? "102x", members: parsed.members ?? [], credits: parsed.credits ?? 10_000, reputation: parsed.reputation ?? 0 });
      }
    } catch {
      setFaction(null);
    }
  }, []);

  const saveFaction = (next: FactionProfile) => {
    setFaction(next);
    window.localStorage.setItem(FACTION_STORAGE_KEY, JSON.stringify(next));
  };

  const createFaction = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    saveFaction({ name: cleanName, flag, map, members: [], credits: 10_000, reputation: 0 });
    setCreateOpen(false);
  };

  const addMember = () => {
    const cleanName = newMember.trim();
    if (!faction || !cleanName || faction.members.includes(cleanName)) return;
    saveFaction({ ...faction, members: [...faction.members, cleanName] });
    setNewMember("");
  };

  const declareWar = () => {
    if (!faction || wars.some((war) => war.target === warTarget && war.status === "active")) return;
    setWars((current) => [...current, { id: `${warTarget}-${Date.now()}`, target: warTarget, status: "active", startedAt: new Date().toLocaleDateString() }]);
    toast.success("War declared", { description: `${faction.name} is now hostile with ${warTarget}.` });
  };

  const earnReputation = (amount: number, reason: string) => {
    if (!faction) return;
    saveFaction({ ...faction, reputation: faction.reputation + amount });
    toast.success(`+${amount} reputation`, { description: reason });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-4">
        <PageHexBadge hue={145} icon={<IconCampaign size={26} />} aria-label="Faction Hub" />
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Faction command</div>
          <h1 className="mt-1 font-display text-3xl md:text-4xl">Faction Hub</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Build your crew, define its identity, and manage every member from one place.</p>
        </div>
      </header>

      {!faction ? (
        <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
        <GlassPanel className="p-8 text-center">
          <img src={flagImage(selectedFlag[2])} alt={selectedFlag[1]} className="mx-auto size-20 rounded-2xl border border-primary/30 bg-primary/10 p-2 object-contain" />
          <h2 className="mt-5 font-display text-2xl">No faction created</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">Create a faction to unlock your banner, roster, contracts, and territory tools.</p>
          {!createOpen ? (
            <button type="button" onClick={() => setCreateOpen(true)} className="mt-6 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:opacity-90">Create faction</button>
          ) : (
            <div className="mx-auto mt-6 max-w-md space-y-4 text-left">
              <div>
                <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Choose your map</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["101x", "102x"] as const).map((mapId) => (
                    <button key={mapId} type="button" onClick={() => setMap(mapId)} className={`rounded-lg border px-3 py-3 text-left transition ${map === mapId ? "border-primary bg-primary/20 text-foreground" : "border-glass-border text-muted-foreground hover:bg-glass/40"}`}><span className="block font-mono text-sm">{mapId}</span><span className="mt-1 block text-[10px]">{mapId === "101x" ? "Livonia" : "Chernarus"}</span></button>
                  ))}
                </div>
              </div>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Faction name" autoFocus />
              <div>
                <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Choose your flag</div>
                <div className="flex flex-wrap gap-2">
                  {FACTION_FLAGS.map(([choiceId, choiceName, choiceFile]) => {
                    const locked = takenFlags.has(choiceId);
                    return <button key={choiceId} type="button" disabled={locked} title={locked ? `${choiceName} is already taken` : choiceName} onClick={() => setFlag(choiceId)} className={`relative grid size-12 place-items-center overflow-hidden rounded-lg border ${flag === choiceId ? "border-primary bg-primary/20" : "border-glass-border hover:bg-glass/40"} ${locked ? "cursor-not-allowed opacity-35 grayscale" : ""}`}><img src={flagImage(choiceFile)} alt={choiceName} className="size-full bg-black/20 p-1 object-contain" />{locked && <span className="absolute inset-x-0 bottom-0 bg-black/75 py-0.5 text-[8px] uppercase text-white">Locked</span>}</button>;
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm">
                <span>Faction creation</span>
                <strong className="font-mono text-amber-200">10,000 credits</strong>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCreateOpen(false)} className="flex-1 rounded-lg border border-glass-border px-4 py-3 text-sm text-muted-foreground hover:bg-glass/40">Cancel</button>
                <button type="button" disabled={!name.trim()} onClick={createFaction} className="flex-1 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-40">Create faction</button>
              </div>
            </div>
          )}
        </GlassPanel>
        <GlassPanel className="mt-4 border-0 p-6 opacity-75">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-red-200/70">Faction operations</div>
              <h2 className="mt-1 font-display text-2xl">War Room</h2>
              <p className="mt-1 text-sm text-muted-foreground">Create a faction to declare wars, track conflicts, and call ceasefires.</p>
            </div>
            <span className="rounded-lg border border-red-300/30 bg-red-400/10 px-3 py-2 text-xs uppercase tracking-wider text-red-100/70">Locked</span>
          </div>
        </GlassPanel>
        </motion.div>
      ) : (
        <motion.div className="space-y-4" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
          <motion.div layout>
          <GlassPanel className="flex flex-wrap items-center justify-between gap-5 p-6">
            <div className="flex items-center gap-4">
              <img src={flagImage(getFactionFlag(faction.flag)[2])} alt={getFactionFlag(faction.flag)[1]} className="size-16 rounded-2xl border border-primary/40 bg-primary/10 p-2 object-contain" />
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Active faction</div>
                <h2 className="font-display text-2xl">{faction.name}</h2>
                <p className="text-xs text-muted-foreground">{faction.members.length} members · {faction.credits.toLocaleString()} credits · {faction.reputation.toLocaleString()} reputation · Map {faction.map}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setEditOpen((current) => !current)} className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-glass/40 hover:text-foreground">{editOpen ? "Close settings" : "Edit faction"}</button>
              <button type="button" onClick={() => { window.localStorage.removeItem(FACTION_STORAGE_KEY); setFaction(null); setName(""); }} className="text-xs text-muted-foreground hover:text-destructive">Disband faction</button>
            </div>
          </GlassPanel>
          </motion.div>

          <AnimatePresence initial={false}>
          {editOpen && (
            <motion.div initial={{ opacity: 0, height: 0, y: -8 }} animate={{ opacity: 1, height: "auto", y: 0 }} exit={{ opacity: 0, height: 0, y: -8 }} transition={{ duration: 0.22 }}>
            <GlassPanel className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Identity</div>
                  <h3 className="mt-1 font-display text-xl">Faction settings</h3>
                </div>
                <button type="button" onClick={() => setEditOpen(false)} className="text-xs text-muted-foreground hover:text-foreground">Done</button>
              </div>
              <label className="mt-4 block text-xs text-muted-foreground">Name</label>
              <Input className="mt-1.5 max-w-md" value={faction.name} onChange={(event) => saveFaction({ ...faction, name: event.target.value })} />
              <div className="mt-4 text-xs text-muted-foreground">Flag</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {FACTION_FLAGS.map(([choiceId, choiceName, choiceFile]) => {
                  const locked = takenFlags.has(choiceId) && getFactionFlag(faction.flag)[0] !== choiceId;
                  return <button key={choiceId} type="button" disabled={locked} title={locked ? `${choiceName} is already taken` : choiceName} onClick={() => saveFaction({ ...faction, flag: choiceId })} className={`relative grid size-12 place-items-center overflow-hidden rounded-lg border ${faction.flag === choiceId ? "border-primary bg-primary/20" : "border-glass-border hover:bg-glass/40"} ${locked ? "cursor-not-allowed opacity-35 grayscale" : ""}`}><img src={flagImage(choiceFile)} alt={choiceName} className="size-full object-cover" />{locked && <span className="absolute inset-x-0 bottom-0 bg-black/75 py-0.5 text-[8px] uppercase text-white">Locked</span>}</button>;
                })}
              </div>
            </GlassPanel>
            </motion.div>
          )}
          </AnimatePresence>

          <motion.div className="grid gap-4 lg:grid-cols-2" layout>
            <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.18 }}>
            <GlassPanel className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Roster</div>
                  <h3 className="mt-1 font-display text-xl">Manage members</h3>
                </div>
                <span className="text-xs text-primary">{faction.members.length} active</span>
              </div>
              <div className="mt-4 space-y-2">
                {faction.members.length === 0 && <p className="rounded-lg border border-dashed border-glass-border p-4 text-sm text-muted-foreground">No members yet. Add your first survivor below.</p>}
                {faction.members.map((member) => (
                  <div key={member} className="flex items-center justify-between rounded-lg border border-glass-border bg-glass/20 px-3 py-2 text-sm">
                    <span>{member}</span>
                    <button type="button" onClick={() => saveFaction({ ...faction, members: faction.members.filter((entry) => entry !== member) })} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <Input value={newMember} onChange={(event) => setNewMember(event.target.value)} onKeyDown={(event) => event.key === "Enter" && addMember()} placeholder="Player name" />
                <button type="button" onClick={addMember} className="rounded-lg bg-primary px-4 text-xs font-medium text-primary-foreground">Add member</button>
              </div>
            </GlassPanel>
            </motion.div>
          </motion.div>

          <GlassPanel className="border-0 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-red-200/70">Faction operations</div>
                <h3 className="mt-1 font-display text-2xl">War Room</h3>
                <p className="mt-1 max-w-xl text-sm text-muted-foreground">Declare hostilities, track active conflicts, and call a ceasefire when the line goes quiet.</p>
              </div>
              <div className="rounded-lg bg-red-400/10 px-3 py-2 text-right"><div className="text-[10px] uppercase tracking-wider text-red-200/70">Active conflicts</div><div className="font-mono text-xl text-red-100">{wars.filter((war) => war.status === "active").length}</div></div>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(220px,.7fr)]">
              <div className="space-y-2">
                {wars.length === 0 && <div className="rounded-xl border border-dashed border-red-300/25 bg-black/15 p-5 text-sm text-muted-foreground">No conflicts on the board. Choose a faction to open hostilities.</div>}
                {wars.map((war) => (
                  <div key={war.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300/20 bg-red-950/15 px-4 py-3">
                    <div><div className="text-sm font-medium text-foreground">{faction.name} <span className="text-red-300">vs.</span> {war.target}</div><div className="mt-1 text-[11px] text-muted-foreground">Declared {war.startedAt} · {war.status === "active" ? "Hostilities active" : "Ceasefire signed"}</div></div>
                    {war.status === "active" && <button type="button" onClick={() => { setWars((current) => current.map((entry) => entry.id === war.id ? { ...entry, status: "ceasefire" } : entry)); toast.success("Ceasefire signed", { description: `The conflict with ${war.target} is paused.` }); }} className="rounded-lg border border-glass-border px-3 py-1.5 text-xs text-muted-foreground hover:border-emerald-300/50 hover:text-emerald-200">Call ceasefire</button>}
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-glass-border bg-black/20 p-4">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Choose target</label>
                <select value={warTarget} onChange={(event) => setWarTarget(event.target.value)} className="mt-2 w-full rounded-lg border border-glass-border bg-black/50 px-3 py-2.5 text-sm text-foreground outline-none">
                  {SERVER_FACTIONS.filter((serverFaction) => serverFaction.name !== faction.name).map((serverFaction) => <option key={serverFaction.name} value={serverFaction.name}>{serverFaction.name}</option>)}
                </select>
                <button type="button" onClick={declareWar} disabled={wars.some((war) => war.target === warTarget && war.status === "active")} className="mt-3 w-full rounded-lg border border-red-300/60 bg-red-400/15 px-4 py-2.5 text-sm font-medium text-red-100 hover:bg-red-400/25 disabled:cursor-not-allowed disabled:opacity-40">Declare war</button>
              </div>
            </div>
            <div className="mt-5 border-t border-white/5 pt-5">
              <div className="flex flex-wrap items-end justify-between gap-3"><div><div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Faction reputation</div><div className="mt-1 font-display text-3xl text-amber-100">{faction.reputation.toLocaleString()}</div></div><span className="text-xs text-muted-foreground">Earned by actions across the server</span></div>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <button type="button" onClick={() => earnReputation(25, "Player kill recorded")} className="rounded-lg bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"><span className="block text-sm text-foreground">Record a kill</span><span className="mt-1 block text-xs text-amber-200">+25 reputation</span></button>
                <button type="button" onClick={() => earnReputation(100, "Contract completed")} className="rounded-lg bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"><span className="block text-sm text-foreground">Complete contract</span><span className="mt-1 block text-xs text-amber-200">+100 reputation</span></button>
                <button type="button" onClick={() => earnReputation(150, "Territory defense logged")} className="rounded-lg bg-white/5 px-3 py-3 text-left transition hover:bg-white/10"><span className="block text-sm text-foreground">Defend territory</span><span className="mt-1 block text-xs text-amber-200">+150 reputation</span></button>
              </div>
            </div>
          </GlassPanel>
        </motion.div>
      )}

      <motion.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}>
      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Server directory</div>
            <h2 className="mt-1 font-display text-2xl">Find a faction</h2>
            <p className="mt-1 text-sm text-muted-foreground">Join an existing faction or create one for your whole crew.</p>
          </div>
          <span className="text-xs text-muted-foreground">{SERVER_FACTIONS.length} active factions</span>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {SERVER_FACTIONS.map((serverFaction, index) => {
            const requested = joinRequests.includes(serverFaction.name);
            return (
              <motion.div key={serverFaction.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }} className="flex items-center gap-3 rounded-xl border border-glass-border bg-glass/20 p-3">
                <img src={flagImage(getFactionFlag(serverFaction.flag)[2])} alt={getFactionFlag(serverFaction.flag)[1]} className="size-11 shrink-0 rounded-lg border border-primary/30 bg-primary/10 p-1 object-contain" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{serverFaction.name}</div>
                  <div className="text-xs text-muted-foreground">{serverFaction.members} members · {serverFaction.standing}</div>
                </div>
                <button type="button" disabled={requested} onClick={() => setJoinRequests((current) => [...current, serverFaction.name])} className="shrink-0 rounded-lg border border-glass-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-glass/50 disabled:cursor-default disabled:text-emerald-300">
                  {requested ? "Requested" : "Request to join"}
                </button>
              </motion.div>
            );
          })}
        </div>
      </GlassPanel>
      </motion.div>
    </div>
  );
}
