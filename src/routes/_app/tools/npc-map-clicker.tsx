import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/tools/npc-map-clicker")({ component: NPCMapClickerPage });

function NPCMapClickerPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-2xl border border-glass-border bg-black/40 p-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-2xl text-primary">⌖</div>
        <div className="mt-6 text-xs uppercase tracking-[0.25em] text-muted-foreground">NPC Shop map clicker</div>
        <h1 className="mt-2 font-display text-3xl">Under construction</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">The interactive NPC placement map is being rebuilt. Use Spawn at my location for now.</p>
      </div>
    </div>
  );
}
