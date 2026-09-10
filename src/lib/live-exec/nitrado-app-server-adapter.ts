import type { LiveExecAvailability, LiveExecResult, LiveExecutionAdapter, SpawnAtPlayerParams } from "@/lib/live-exec/types";

const NITRADO_API_BASE = "https://api.nitrado.net";

function headers() {
  const token = process.env.NITRADO_API_TOKEN;
  if (!token) throw new Error("NITRADO_API_TOKEN not configured");
  return { Authorization: `Bearer ${token}` };
}

async function post(path: string, body: URLSearchParams) {
  const res = await fetch(`${NITRADO_API_BASE}${path}`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string } | null;
  return { ok: res.ok, status: res.status, message: json?.message };
}

async function get(path: string) {
  const res = await fetch(`${NITRADO_API_BASE}${path}`, { headers: headers() });
  const json = (await res.json().catch(() => null)) as { status?: string; message?: string } | null;
  return { ok: res.ok, status: res.status, message: json?.message };
}

/**
 * Nitrado's generic `app_server` / `app_server/command` endpoints — the only
 * documented mechanism resembling a live console channel into a gameserver
 * process. Empirically tested 2026-09-10 against a live DayZ (Xbox) service:
 * both the read ping and a harmless command probe returned
 * "Application Server non è raggiungibile" / "can not be send" — Nitrado
 * itself confirms no application-server process is provisioned for this
 * game/platform. checkAvailability() re-runs that same probe so this
 * adapter self-corrects if that ever changes.
 */
export const nitradoAppServerAdapter: LiveExecutionAdapter = {
  id: "nitrado-app-server",
  label: "Nitrado App Server console",
  // Generic text-console channel, not a scripting API — if it were reachable
  // it could at best forward a spawn-style admin command, nothing scripted.
  capabilities: { spawnEntity: true, spawnAtPlayer: true, teleport: false, executeServerScript: false },

  async checkAvailability(serviceId): Promise<LiveExecAvailability> {
    const res = await get(`/services/${serviceId}/gameservers/app_server`);
    if (res.ok) return { available: true };
    return { available: false, reason: res.message ?? `HTTP ${res.status}` };
  },

  async spawnEntityAtPlayer(serviceId, params: SpawnAtPlayerParams): Promise<LiveExecResult> {
    // Best-effort — no documented DayZ console command syntax exists for this;
    // this only matters if checkAvailability() ever reports the channel open.
    const command = `spawn ${params.classname} ${params.x} ${params.y} ${params.z}`;
    const res = await post(`/services/${serviceId}/gameservers/app_server/command`, new URLSearchParams({ command }));
    if (res.ok) return { ok: true, via: nitradoAppServerAdapter.id };
    return { ok: false, via: nitradoAppServerAdapter.id, reason: res.message ?? `HTTP ${res.status}` };
  },
};
