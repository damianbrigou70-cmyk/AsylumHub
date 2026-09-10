/**
 * Pluggable interface for a live (no-restart) execution channel into a
 * running DayZ server process. As of 2026-09-10 no such channel is known to
 * exist for Xbox/PlayStation Nitrado DayZ servers (see nitrado-app-server.ts
 * for the empirically-tested candidate). Adapters register here so the
 * Command Center can start using a real one the moment Nitrado/Bohemia
 * ships an authorized execution API, without changing call sites.
 */

export type SpawnAtPlayerParams = {
  classname: string;
  x: number;
  y: number;
  z: number;
};

export type LiveExecResult =
  | { ok: true; via: string }
  | { ok: false; via: string; reason: string };

/** What an adapter's underlying channel is actually capable of, independent of whether it's reachable right now. */
export type LiveExecutionCapabilities = {
  spawnEntity: boolean;
  spawnAtPlayer: boolean;
  teleport: boolean;
  executeServerScript: boolean;
};

export type LiveExecAvailability = { available: boolean; reason?: string };

export interface LiveExecutionAdapter {
  id: string;
  label: string;
  /** Declared independent of reachability — what this transport could do if it were available. */
  capabilities: LiveExecutionCapabilities;
  /** Cheap probe — must not spawn or mutate anything. */
  checkAvailability(serviceId: string): Promise<LiveExecAvailability>;
  spawnEntityAtPlayer(serviceId: string, params: SpawnAtPlayerParams): Promise<LiveExecResult>;
}
