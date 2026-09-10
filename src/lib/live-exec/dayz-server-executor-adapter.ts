import type { LiveExecAvailability, LiveExecResult, LiveExecutionAdapter, SpawnAtPlayerParams } from "@/lib/live-exec/types";
import { downloadNitradoFile, uploadNitradoFile, statNitradoFileModifiedAt } from "@/lib/nitrado-files.functions";

/**
 * Talks to the `AsylumSpawnBridge` DayZ server mod (see /dayz-mod in the repo
 * root) over a shared JSON file, written/read through the Nitrado file
 * manager. The mod polls `requests.json` every ~2s from inside the running
 * server process and calls `GetGame().CreateObject()` directly — the
 * standard, always-available Enforce Script runtime entity-spawn API — so no
 * restart, no CE/XML reload, no diag-only function is involved.
 *
 * Requires server-side scripting (mod support) on the target DayZ server —
 * this does NOT apply to console (Xbox/PlayStation), see nitrado-app-server-adapter.ts.
 *
 * Security: authentication is NOT provided by the `sig`/HMAC field — the mod
 * has no crypto primitive to verify it and does not check it. The real (and
 * only) access control today is that only holders of NITRADO_API_TOKEN can
 * write requests.json. Treat `sig` as an audit/idempotency tag only, never
 * as a security boundary, until the mod can actually verify a signature.
 */

const BRIDGE_DIR = "AsylumSpawnBridge";
const REQUESTS_FILE = `${BRIDGE_DIR}/requests.json`;
const RESULTS_FILE = `${BRIDGE_DIR}/results.json`;
const HEARTBEAT_FILE = `${BRIDGE_DIR}/heartbeat.json`;
const HEARTBEAT_STALE_SECONDS = 30;
const RESULT_POLL_TIMEOUT_MS = 12_000;
const RESULT_POLL_INTERVAL_MS = 1500;
const ALLOWED_CLASSNAMES = ["SurvivorM_Boris"];

type RequestEntry = { id: string; ts: number; classname: string; x: number; y: number; z: number; sig: string };
type ResultEntry = { id: string; ok: boolean; ts: number; reason?: string };

async function hmacHex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readJson<T>(serviceId: string, path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await downloadNitradoFile(serviceId, path)) as T;
  } catch {
    return fallback;
  }
}

export const dayzServerExecutorAdapter: LiveExecutionAdapter = {
  id: "dayz-server-executor",
  label: "DayZ server-side spawn bridge (mod)",
  capabilities: { spawnEntity: true, spawnAtPlayer: true, teleport: false, executeServerScript: false },

  async checkAvailability(serviceId): Promise<LiveExecAvailability> {
    if (!process.env.DAYZ_SPAWN_BRIDGE_SECRET) {
      return { available: false, reason: "DAYZ_SPAWN_BRIDGE_SECRET not configured" };
    }
    const modifiedAt = await statNitradoFileModifiedAt(serviceId, HEARTBEAT_FILE);
    if (modifiedAt == null) return { available: false, reason: "No heartbeat from AsylumSpawnBridge mod (not installed?)" };
    const ageSeconds = Date.now() / 1000 - modifiedAt;
    if (ageSeconds > HEARTBEAT_STALE_SECONDS) {
      return { available: false, reason: `Mod heartbeat stale (${Math.round(ageSeconds)}s old)` };
    }
    return { available: true };
  },

  async spawnEntityAtPlayer(serviceId, params: SpawnAtPlayerParams): Promise<LiveExecResult> {
    const secret = process.env.DAYZ_SPAWN_BRIDGE_SECRET;
    if (!secret) return { ok: false, via: dayzServerExecutorAdapter.id, reason: "DAYZ_SPAWN_BRIDGE_SECRET not configured" };
    if (!ALLOWED_CLASSNAMES.includes(params.classname)) {
      return { ok: false, via: dayzServerExecutorAdapter.id, reason: `Classname "${params.classname}" not on the allowlist` };
    }

    const id = crypto.randomUUID();
    const ts = Date.now();
    const sig = await hmacHex(secret, `${id}:${ts}:${params.classname}:${params.x}:${params.y}:${params.z}`);
    const entry: RequestEntry = { id, ts, classname: params.classname, x: params.x, y: params.y, z: params.z, sig };

    const requests = await readJson<RequestEntry[]>(serviceId, REQUESTS_FILE, []);
    requests.push(entry);
    await uploadNitradoFile(serviceId, REQUESTS_FILE, JSON.stringify(requests));

    const deadline = Date.now() + RESULT_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, RESULT_POLL_INTERVAL_MS));
      const results = await readJson<ResultEntry[]>(serviceId, RESULTS_FILE, []);
      const match = results.find((r) => r.id === id);
      if (match) {
        return match.ok
          ? { ok: true, via: dayzServerExecutorAdapter.id }
          : { ok: false, via: dayzServerExecutorAdapter.id, reason: match.reason ?? "Mod reported failure" };
      }
    }
    return { ok: false, via: dayzServerExecutorAdapter.id, reason: "Timed out waiting for the mod to process the request" };
  },
};
