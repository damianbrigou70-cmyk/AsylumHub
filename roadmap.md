# Asylum++ DayZ platform — build roadmap

Approach: build backend AND the missing screens, in phases. Log source = Nitrado file API.
Existing marketing template pages/routes stay untouched; DayZ work lands in new tables/files.

## Phase 1 — Foundation (in progress)
- [ ] Secrets: Discord client id/secret, bot token, Nitrado token, credential encryption key
- [ ] Core schema: discord_servers, discord_memberships, discord_channels, game_servers,
      server_settings, integration_credentials (encrypted), audit_logs, system_errors
- [ ] Discord OAuth login (server routes, secure session, guild membership sync)
- [ ] Per-server RBAC + RLS helpers
- [ ] `/console` shell + server picker screens

## Phase 2 — Nitrado + logs
- [ ] Nitrado credential save/test, status + player sync
- [ ] Nitrado file-API log fetch with offset tracking (idempotent)
- [ ] Log parser: kills, connects/disconnects, build/dismantle/raid
- [ ] Scheduled tasks table + job runner + manual run
- [ ] Sync status screens

## Phase 3 — Killfeed, players, leaderboards
- [ ] players, player_accounts, kill_events, player_stats
- [ ] Live killfeed (realtime), filters, search, pagination
- [ ] Player profiles + leaderboards (daily/weekly/monthly/all-time)

## Phase 4 — Moderation
- [ ] Bans (temp/perm, evidence, Nitrado sync, Discord alerts)
- [ ] Anti-cheat alerts + review workflow
- [ ] Tickets + raid investigations with evidence and confidence scoring

## Phase 5 — Economy, factions, bounties
- [ ] Economy accounts + transactions (server-side, transactional, idempotent)
- [ ] Factions + members + roles
- [ ] Bounties + claim/payout protection

## Phase 6 — Content + automation
- [ ] NPCs, shop items, spawnables, events, spawn jobs
- [ ] Automation settings screen, job execution history
- [ ] Notifications, audit log viewer, user/role management
- [ ] Health check endpoint, env var docs, deployment notes

## Blocked / needs user
- Discord bot must be invited to each guild before channels can be listed.
