import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { FactionHubContent } from "@/routes/_app/tools/event-intake";
import { IconCampaign, IconArrowRight } from "@/components/ui-custom/CustomIcon";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/war-room")({
  component: WarRoomPage,
  head: () => ({
    meta: [
      { title: `War Room — ${BRAND.name}` },
      { name: "description", content: "Create or join a faction, declare wars, and manage your roster." },
    ],
  }),
});

function WarRoomPage() {
  const [entered, setEntered] = useState(false);

  if (!entered) {
    return (
      <div className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center overflow-hidden bg-black px-4">
        <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_0%,transparent_48%,color-mix(in_oklab,var(--primary)_18%,transparent)_49%,transparent_50%)] [background-size:46px_46px]" />
        <div className="relative max-w-lg text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary">
            <IconCampaign size={30} />
          </div>
          <div className="mt-5 text-[11px] uppercase tracking-[0.3em] text-primary">{BRAND.name} · Command hall</div>
          <h1 className="font-display mt-2 text-5xl text-primary sm:text-6xl">War Room</h1>
          <p className="mt-4 text-sm text-zinc-400 sm:text-base">
            Faction rosters, standing wars, and territory contracts. Step inside to manage your crew.
          </p>
          <button
            type="button"
            onClick={() => setEntered(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground transition hover:brightness-110"
          >
            Enter War Room <IconArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-3rem)] bg-black">
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%)]" />
      <div className="relative mx-auto max-w-5xl px-4 py-8">
        <button
          type="button"
          onClick={() => setEntered(false)}
          className="mb-5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
        >
          <span aria-hidden="true">←</span> Leave War Room
        </button>
        <div className="rounded-2xl border border-primary/25 bg-white/[0.02] p-5 sm:p-8">
          <FactionHubContent />
        </div>
      </div>
    </div>
  );
}
