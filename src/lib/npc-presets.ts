/**
 * Maps AsylumHub NPC Shop presets to real DayZ Central Economy survivor
 * classnames, plus the event tuning used to generate events.xml /
 * cfgeventspawns.xml nodes. See roadmap Phase 6 + the console dynamic-event
 * research: only `Boris`, `Cyril`, `Denis`, `Elias` are confirmed usable
 * `SurvivorM_*` event children — every preset reuses one of those four until
 * more classnames are verified against the live server.
 */

export type NpcSpawnPreset = {
  /** Matches the `id` in src/routes/_app/tools/npc-shop.tsx NPCS. */
  id: string;
  classname: string;
  /** Seconds the spawned NPC persists before CE removes it. */
  lifetime: number;
  /** Seconds after removal before CE restocks it — 0 disables auto-respawn. */
  restock: number;
};

const CONFIRMED_CLASSNAMES = ["SurvivorM_Boris", "SurvivorM_Cyril", "SurvivorM_Denis", "SurvivorM_Elias"] as const;

const PRESET_IDS = [
  "scavenger", "medic", "mechanic", "hunter", "guard", "farmer", "radio",
  "quartermaster", "sniper", "engineer", "smuggler", "tracker", "pilot",
  "commander", "armorer", "recon", "bunker", "diplomat", "commando", "ai",
] as const;

export const NPC_SPAWN_PRESETS: Record<string, NpcSpawnPreset> = Object.fromEntries(
  PRESET_IDS.map((id, i) => [
    id,
    {
      id,
      classname: CONFIRMED_CLASSNAMES[i % CONFIRMED_CLASSNAMES.length],
      lifetime: 2500,
      // Combat/guard roles respawn on their own; support/civilian roles are one-shot until re-bought.
      restock: id === "guard" || id === "bunker" || id === "sniper" || id === "commando" ? 300 : 0,
    },
  ]),
);

export function getNpcSpawnPreset(id: string): NpcSpawnPreset {
  const preset = NPC_SPAWN_PRESETS[id];
  if (!preset) throw new Error(`No spawn preset configured for NPC "${id}"`);
  return preset;
}
