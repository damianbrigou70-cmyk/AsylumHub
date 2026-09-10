import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NITRADO_API_BASE = "https://api.nitrado.net";

export type NitradoServerStatus = {
  serviceId: string;
  status: "started" | "stopped" | "restarting" | "unknown";
  serverName: string;
  game: string;
  map: string | null;
  ip: string | null;
  port: number | null;
  queryPort: number | null;
  rconPort: number | null;
  players: { current: number; max: number };
  updatedAt: string;
};

async function nitradoFetch(path: string) {
  const token = process.env.NITRADO_API_TOKEN;
  if (!token) throw new Error("NITRADO_API_TOKEN not configured");
  const res = await fetch(`${NITRADO_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new Error(`Nitrado API error (${res.status}): ${await res.text().catch(() => res.statusText)}`);
  }
  return res.json();
}

/** Fetch live status for a single Nitrado gameserver service. */
export const getNitradoServerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { serviceId: string }) => d)
  .handler(async ({ data }): Promise<NitradoServerStatus> => {
    const json = (await nitradoFetch(`/services/${data.serviceId}/gameservers`)) as {
      data?: {
        gameserver?: {
          status?: string;
          query?: {
            server_name?: string;
            game_human?: string;
            map?: string;
            player_current?: number;
            player_max?: number;
          };
          ip?: string;
          port?: number;
          query_port?: number;
          rcon_port?: number;
        };
      };
    };
    const gs = json.data?.gameserver;
    if (!gs) throw new Error("Nitrado response missing gameserver data");
    return {
      serviceId: data.serviceId,
      status: (gs.status as NitradoServerStatus["status"]) ?? "unknown",
      serverName: gs.query?.server_name ?? "Unknown server",
      game: gs.query?.game_human ?? "DayZ",
      map: gs.query?.map ?? null,
      ip: gs.ip ?? null,
      port: gs.port ?? null,
      queryPort: gs.query_port ?? null,
      rconPort: gs.rcon_port ?? null,
      players: { current: gs.query?.player_current ?? 0, max: gs.query?.player_max ?? 0 },
      updatedAt: new Date().toISOString(),
    };
  });
