import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getNpcSpawnPreset } from "@/lib/npc-presets";
import { buildEventXmlNode, buildSpawnPosXmlNode, upsertEventBlock } from "@/lib/dayz-event-xml";
import { downloadNitradoFile, uploadNitradoFile } from "@/lib/nitrado-files.functions";

const EVENTS_FILE = "db/events.xml";
const SPAWNS_FILE = "cfgeventspawns.xml";

export type QueueNpcSpawnResult = {
  eventName: string;
  restockSeconds: number;
  /** False when the event was already loaded unchanged — CE handles it, no restart needed. */
  needsRestartToApply: boolean;
};

/**
 * Writes an NPC spawn event into events.xml + cfgeventspawns.xml on the
 * Nitrado server. The event name is deterministic per (npcId, position), so
 * re-"buying"/re-spawning the same NPC at the same spot reuses the existing
 * CE event instead of appending a duplicate — if nothing actually changed on
 * disk, no restart is triggered and, when `restock` > 0, CE keeps respawning
 * it on its own indefinitely (roadmap "Solution A"). A restart is only ever
 * needed the first time an event is created or moved, because console
 * builds don't expose a live `DynamicEventSpawn()` trigger.
 */
export const queueNpcSpawn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string; npcId: string; x: number; z: number; a: number }) => d)
  .handler(async ({ data }): Promise<QueueNpcSpawnResult> => {
    const preset = getNpcSpawnPreset(data.npcId);
    const eventName = `Asylum_${data.npcId}_${Math.round(data.x)}_${Math.round(data.z)}`;
    const params = { eventName, classname: preset.classname, lifetime: preset.lifetime, restock: preset.restock, x: data.x, z: data.z, a: data.a };

    const [eventsXml, spawnsXml] = await Promise.all([
      downloadNitradoFile(data.serviceId, EVENTS_FILE),
      downloadNitradoFile(data.serviceId, SPAWNS_FILE),
    ]);

    const nextEventsXml = upsertEventBlock(eventsXml, eventName, buildEventXmlNode(params), "events");
    const nextSpawnsXml = upsertEventBlock(spawnsXml, eventName, buildSpawnPosXmlNode(params), "eventposdef");
    const unchanged = nextEventsXml === eventsXml && nextSpawnsXml === spawnsXml;

    if (unchanged) {
      return { eventName, restockSeconds: preset.restock, needsRestartToApply: false };
    }

    await Promise.all([
      uploadNitradoFile(data.serviceId, EVENTS_FILE, nextEventsXml),
      uploadNitradoFile(data.serviceId, SPAWNS_FILE, nextSpawnsXml),
    ]);

    return { eventName, restockSeconds: preset.restock, needsRestartToApply: true };
  });
