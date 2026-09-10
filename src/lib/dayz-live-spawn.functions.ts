import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { findAvailableLiveExecAdapter, type CheckedAdapter } from "@/lib/live-exec/registry";
import type { SpawnAtPlayerParams } from "@/lib/live-exec/types";

export type AttemptLiveSpawnResult =
  | { ok: true; via: string }
  | { ok: false; checked: CheckedAdapter[] };

/** Tries every registered live-execution adapter before any restart-based fallback is used. */
export const attemptLiveSpawn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string } & SpawnAtPlayerParams) => d)
  .handler(async ({ data }): Promise<AttemptLiveSpawnResult> => {
    const { adapter, checked } = await findAvailableLiveExecAdapter(data.serviceId);
    if (!adapter) return { ok: false, checked };
    const result = await adapter.spawnEntityAtPlayer(data.serviceId, data);
    return result.ok
      ? { ok: true, via: result.via }
      : { ok: false, checked: [...checked, { id: result.via, available: false, reason: result.reason, capabilities: adapter.capabilities }] };
  });
