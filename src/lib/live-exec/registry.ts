import type { LiveExecutionAdapter, LiveExecutionCapabilities } from "@/lib/live-exec/types";
import { nitradoAppServerAdapter } from "@/lib/live-exec/nitrado-app-server-adapter";
import { dayzServerExecutorAdapter } from "@/lib/live-exec/dayz-server-executor-adapter";

/** Add new adapters here as they become available — call sites never change. */
export const LIVE_EXEC_ADAPTERS: LiveExecutionAdapter[] = [dayzServerExecutorAdapter, nitradoAppServerAdapter];

export type CheckedAdapter = { id: string; available: boolean; reason?: string; capabilities: LiveExecutionCapabilities };

export async function findAvailableLiveExecAdapter(
  serviceId: string,
): Promise<{ adapter: LiveExecutionAdapter | null; checked: CheckedAdapter[] }> {
  const checked: CheckedAdapter[] = [];
  for (const adapter of LIVE_EXEC_ADAPTERS) {
    const availability = await adapter.checkAvailability(serviceId);
    checked.push({ id: adapter.id, capabilities: adapter.capabilities, ...availability });
    if (availability.available && adapter.capabilities.spawnAtPlayer) return { adapter, checked };
  }
  return { adapter: null, checked };
}
