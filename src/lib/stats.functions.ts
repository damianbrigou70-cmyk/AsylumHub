import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getKillfeed, type KillEvent } from "@/lib/killfeed.functions";
import { listEconomyLeaderboard } from "@/lib/economy.functions";
import { readJsonFile, writeJsonFile } from "@/lib/dayz/store";

export type PlayerStats = {
  playerId: string;
  displayName: string;
  server: "101x" | "102x" | "Both";
  kills: number;
  deaths: number;
  kd: number;
  playtime: string;
  longRange: number;
  headshots: number;
  balance: number;
  xp: number;
};

export type LeaderboardBoard = {
  kills: PlayerStats[];
  wealth: PlayerStats[];
  playtime: PlayerStats[];
  longRange: PlayerStats[];
  headshots: PlayerStats[];
  source: "killfeed+economy" | "seed";
  generatedAt: string;
};

type StatsOverride = Record<string, { kills?: number; deaths?: number }>;

function accumulate(events: KillEvent[]): Map<string, PlayerStats> {
  const map = new Map<string, PlayerStats>();
  const bump = (name: string) => {
    const key = name.toLocaleLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        playerId: key,
        displayName: name,
        server: e.server,
        kills: 0,
        deaths: 0,
        kd: 0,
        playtime: "--",
        longRange: 0,
        headshots: 0,
        balance: 0,
        xp: 0,
      });
    }
    const player = map.get(key)!;
    if (player.server !== e.server) player.server = "Both";
    return player;
  };
  for (const e of events) {
    const killer = bump(e.killer);
    killer.kills += 1;
    if (typeof e.distance === "number" && e.distance >= 100) killer.longRange += 1;
    if (/headshot/i.test(e.raw)) killer.headshots += 1;
    bump(e.victim).deaths += 1;
  }
  for (const s of map.values()) {
    s.kd = s.deaths === 0 ? s.kills : Number((s.kills / s.deaths).toFixed(2));
  }
  return map;
}

export const getLeaderboards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<LeaderboardBoard> => {
    const [killfeed, wealth, overrides] = await Promise.all([
      getKillfeed({ data: { server: "all", limit: 300 } }),
      listEconomyLeaderboard(),
      readJsonFile<StatsOverride>("stats-overrides.json", {}),
    ]);

    const byName = accumulate(killfeed.events);
    for (const [key, ov] of Object.entries(overrides)) {
      const row = byName.get(key.toLocaleLowerCase()) ?? {
        playerId: key.toLocaleLowerCase(),
        displayName: key,
        server: "Both" as const,
        kills: 0,
        deaths: 0,
        kd: 0,
        playtime: "--",
        longRange: 0,
        headshots: 0,
        balance: 0,
        xp: 0,
      };
      if (typeof ov.kills === "number") row.kills = ov.kills;
      if (typeof ov.deaths === "number") row.deaths = ov.deaths;
      row.kd = row.deaths === 0 ? row.kills : Number((row.kills / row.deaths).toFixed(2));
      byName.set(row.playerId, row);
    }

    for (const account of wealth) {
      const key = account.displayName.toLocaleLowerCase();
      const row = byName.get(key) ?? {
        playerId: account.playerId,
        displayName: account.displayName,
        server: "Both" as const,
        kills: 0,
        deaths: 0,
        kd: 0,
        playtime: "--",
        longRange: 0,
        headshots: 0,
        balance: account.balance,
        xp: account.xp,
      };
      row.balance = account.balance;
      row.xp = account.xp;
      byName.set(key, row);
    }

    const all = Array.from(byName.values());
    const source = killfeed.events.length > 0 || wealth.length > 0 ? "killfeed+economy" : "seed";

    if (all.length === 0) {
      const seed: PlayerStats[] = [
        { playerId: "asylum-demo", displayName: "Asylum Demo", server: "101x", kills: 12, deaths: 4, kd: 3, playtime: "42h", longRange: 8, headshots: 5, balance: 50000, xp: 1250 },
        { playerId: "wasteland-ghost", displayName: "Wasteland Ghost", server: "102x", kills: 9, deaths: 7, kd: 1.29, playtime: "37h", longRange: 6, headshots: 3, balance: 22000, xp: 800 },
        { playerId: "ember-raider", displayName: "Ember Raider", server: "101x", kills: 6, deaths: 2, kd: 3, playtime: "24h", longRange: 4, headshots: 4, balance: 18000, xp: 640 },
      ];
      return { kills: seed, wealth: seed, playtime: seed, longRange: seed, headshots: seed, source: "seed", generatedAt: new Date().toISOString() };
    }

    return {
      kills: [...all].sort((a, b) => b.kills - a.kills || b.kd - a.kd).slice(0, 50),
      wealth: [...all].sort((a, b) => b.balance - a.balance || b.xp - a.xp).slice(0, 50),
      playtime: [...all].sort((a, b) => b.playtime.localeCompare(a.playtime, undefined, { numeric: true })).slice(0, 50),
      longRange: [...all].sort((a, b) => b.longRange - a.longRange || b.kd - a.kd).slice(0, 50),
      headshots: [...all].sort((a, b) => b.headshots - a.headshots || b.kd - a.kd).slice(0, 50),
      source,
      generatedAt: new Date().toISOString(),
    };
  });

export const getPlayerStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string }) => d)
  .handler(async ({ data }) => {
    const board = await getLeaderboards();
    const key = data.name.trim().toLocaleLowerCase();
    const hit =
      board.kills.find((p) => p.displayName.toLocaleLowerCase() === key || p.playerId === key) ||
      board.wealth.find((p) => p.displayName.toLocaleLowerCase() === key || p.playerId === key);
    return hit ?? null;
  });

/** Admin helper — local override store until Supabase DayZ tables land. */
export const adminSetPlayerStats = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { name: string; kills?: number; deaths?: number }) => d)
  .handler(async ({ data }) => {
    const overrides = await readJsonFile<StatsOverride>("stats-overrides.json", {});
    const key = data.name.trim().toLocaleLowerCase();
    overrides[key] = {
      kills: data.kills,
      deaths: data.deaths,
    };
    await writeJsonFile("stats-overrides.json", overrides);
    return { ok: true as const, key };
  });
