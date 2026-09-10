import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { NitradoServerStatus } from "@/lib/nitrado.functions";

const DISCORD_API_BASE = "https://discord.com/api/v10";

async function discordFetch(path: string, init?: RequestInit) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) throw new Error("DISCORD_BOT_TOKEN not configured");
  const res = await fetch(`${DISCORD_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`Discord API error (${res.status}): ${await res.text().catch(() => res.statusText)}`);
  }
  return res.status === 204 ? null : res.json();
}

/** List text channels in the configured guild, for picking a status channel. */
export const listDiscordChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const guildId = process.env.DISCORD_GUILD_ID;
    if (!guildId) throw new Error("DISCORD_GUILD_ID not configured");
    const channels = (await discordFetch(`/guilds/${guildId}/channels`)) as Array<{
      id: string;
      name: string;
      type: number;
    }>;
    // type 0 = GUILD_TEXT
    return channels.filter((c) => c.type === 0).map((c) => ({ id: c.id, name: c.name }));
  });

/** Post a live DayZ server status embed to the configured Discord status channel. */
export const postDiscordServerStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status: NitradoServerStatus; channelId?: string }) => d)
  .handler(async ({ data }) => {
    const channelId = data.channelId || process.env.DISCORD_STATUS_CHANNEL_ID;
    if (!channelId) throw new Error("No Discord channel configured (DISCORD_STATUS_CHANNEL_ID)");
    const { status } = data;
    const online = status.status === "started";
    await discordFetch(`/channels/${channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({
        embeds: [
          {
            title: status.serverName,
            color: online ? 0x22c55e : 0xef4444,
            fields: [
              { name: "Status", value: online ? "🟢 Online" : "🔴 Offline", inline: true },
              { name: "Players", value: `${status.players.current} / ${status.players.max}`, inline: true },
              { name: "Map", value: status.map ?? "unknown", inline: true },
              ...(status.ip ? [{ name: "Connect", value: `${status.ip}:${status.port}`, inline: false }] : []),
            ],
            timestamp: status.updatedAt,
          },
        ],
      }),
    });
    return { ok: true };
  });
