import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findAvailableLiveExecAdapter } from "@/lib/live-exec/registry";
import { getNpcSpawnPreset } from "@/lib/npc-presets";
import { queueNpcSpawn } from "@/lib/dayz-npc-spawn.functions";
import { restartNitradoServer } from "@/lib/nitrado-files.functions";

/** Discriminated so the UI can never mistake a queued restart-based spawn for a live one. */
export type SpawnResult =
  | { mode: "live"; adapter: string; entity: string }
  | { mode: "restart_required"; reason: string; eventName: string; restockSeconds: number; restarted: boolean };

const LIVE_SPAWN_UNAVAILABLE_REASON =
  "Nitrado does not currently expose a live DayZ console execution channel.";

/**
 * Single orchestration point: Command Center -> LiveExecutionAdapter ->
 * (live spawn | restart-based CE fallback). Never silently upgrades a
 * fallback into something that looks like a live spawn.
 */
export const spawnNpc = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string; npcId: string; x: number; z: number; a: number }) => d)
  .handler(async ({ data }): Promise<SpawnResult> => {
    const preset = getNpcSpawnPreset(data.npcId);

    const { adapter } = await findAvailableLiveExecAdapter(data.serviceId);
    if (adapter) {
      const result = await adapter.spawnEntityAtPlayer(data.serviceId, {
        classname: preset.classname,
        x: data.x,
        y: 0,
        z: data.z,
      });
      if (result.ok) return { mode: "live", adapter: result.via, entity: preset.classname };
    }

    const queued = await queueNpcSpawn({ data });
    if (queued.needsRestartToApply) {
      await restartNitradoServer({ data: { serviceId: data.serviceId } });
    }
    return {
      mode: "restart_required",
      reason: LIVE_SPAWN_UNAVAILABLE_REASON,
      eventName: queued.eventName,
      restockSeconds: queued.restockSeconds,
      restarted: queued.needsRestartToApply,
    };
  });
