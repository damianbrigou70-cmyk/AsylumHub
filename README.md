# Campaign Canvas

A marketing command center for building, managing, and tracking campaigns —
built as a Lovable template you can remix in one click.

Campaigns and workspaces, a shared calendar, UTM builder with taxonomy
enforcement, funnel targets, a lead-referral flow, an AI agent responder,
and a tools hub that ties it all together. Multi-org, RLS-scoped, and
ready to rebrand.

## Main features

- **Campaign workspaces** — brief → plan → ship, with checklists, budget,
  assets, results, retros, and a Gantt-style timeline per workspace.
- **UTM builder** — enforced taxonomy, saved templates, and an audit log
  of every link generated.
- **Calendar** — every launch, event, and send in one filterable view.
- **Funnel targets** — org-wide MQL/SQO targets with optional per-workspace
  overrides and pacing snapshots.
- **Lead referral** — public referral intake, partner referrals, and a
  performance dashboard.
- **Event request** — generic event intake (conference, hackathon, meetup,
  webinar, other) that lands in the marketing requests queue.
- **Campaign-in-a-box** — audience → creator → import → events → cards →
  performance, all in one flow.
- **Agent responder** — AI-drafted email replies with rules and a review
  inbox (Gmail integration optional).
- **Team & multi-org** — invites, roles, and per-org settings.

## First-run experience

1. Sign up — the auth flow provisions a profile, an org, sensible
   taxonomy/UTM defaults, and an example workspace (status `planning`).
2. The `/welcome` route walks you through the workspace lifecycle,
   sample campaigns, and where to find each tool.
3. A guided tour is available from the app shell; the onboarding
   checklist tracks setup progress.
4. Demo data (CRM gateway, sample inbox) is clearly labeled and linked
   to the integrations page so you can replace it when ready.

## Setup checklist for remixers

Do these once after remixing:

### 1. Rebrand

Edit `src/lib/brand.ts` — that single file drives the app name, short
name, tagline, description, placeholder domain, and support email
across the sidebar, login, head meta, email templates, and onboarding.
Don't hardcode brand strings in components.

### 2. Set your org's public URL

In-app → **Settings** → set the org public URL. Share tokens, referral
links, and the intake pages generate absolute links from this value.

### 3. Override the cron target URL

Cron jobs (daily digest, weekly cluster retros) read their target URL
from the `CRON_TARGET_URL` Vault secret so remixes point at their own
deployment. Set it to your published URL:

```
CRON_TARGET_URL = https://<your-app>.lovable.app
```

`CRON_SECRET` is generated automatically per project and rotated in
Vault — you don't need to set it. Both cron endpoints validate the
bearer token against the Vault secret at runtime.

### 4. Optional integrations

Add these in **Project Settings → Secrets** only if you want the
matching feature:

| Secret | Enables |
| --- | --- |
| `HUBSPOT_API_KEY` | Real CRM sync (without it, the CRM gateway returns clearly labeled demo data) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Gmail agent responder OAuth |

The CRM layer is abstracted behind `src/lib/crm/*` — swap the adapter
if you use a different CRM.

### 5. Enable the Commander AI copilot (optional)

The Commander AI copilot (LLM with scoped DB-write capability) is
off by default. Turn it on with:

```
VITE_COMMANDER_ENABLED = true
```

Commander proposals only write through column allow-lists — never
arbitrary patches — so it's safe to enable in production.

### 6. Enable PSN server verification (optional)

The setup checklist can verify a player's PSN name against Nitrado logs for
the selected `101x` and `102x` servers. Configure these server-side secrets:

```text
NITRADO_API_TOKEN
NITRADO_MISSION_PATH
NITRADO_SERVICE_101X
NITRADO_SERVICE_102X
NITRADO_MISSION_PATH_101X=/dayzps/config
NITRADO_MISSION_PATH_102X=/dayzps/config
NITRADO_LOG_PATHS_101X=DayZServer_x64.ADM,DayZServer_x64.RPT
NITRADO_LOG_PATHS_102X=DayZServer_x64.ADM,DayZServer_x64.RPT
```

The service IDs must be the Nitrado IDs for the two servers. Log paths are
comma-separated paths relative to the configured mission path. The checker
downloads each configured log on the server, searches case-insensitively for
the submitted PSN name, and only then marks the Discord/PSN link as verified.

For PS4 logs, FTP is preferred because Nitrado's file API does not expose the
same directory paths as the web file browser. The verifier follows the same
strategy as the companion DayZ bot: it lists `/dayzps/config`, selects recent
`.RPT` and `.ADM` files, downloads them, and searches their contents.

Configure either shared FTP variables or per-server overrides:

```text
FTP_HOST=...
FTP_PORT=21
FTP_USER=...
FTP_PASS=...
FTP_LOGS_PATH=/dayzps/config
FTP_101X_HOST=...
FTP_101X_USER=...
FTP_101X_PASS=...
FTP_101X_PORT=21
FTP_101X_LOGS_PATH=/dayzps/config
FTP_102X_HOST=...
FTP_102X_USER=...
FTP_102X_PASS=...
FTP_102X_PORT=21
FTP_102X_LOGS_PATH=/dayzps/config
```

## Workspace status vocabulary

`workspaces.status` is a strict enum:

- `draft` — not started
- `planning` — being scoped
- `live` — active in market
- `complete` — finished
- `archived` — hidden from default views

The dashboard's "In flight" counter = `planning` + `live`. Don't
introduce new status values in UI, seeds, or migrations — the enum is
enforced end-to-end.

## Tech stack

TanStack Start (React 19, Vite 7), Tailwind v4, shadcn/ui, TanStack
Query, framer-motion. Backend on Lovable Cloud (Postgres + Auth +
Storage + Edge). All tables are org-scoped with RLS via
`is_org_member()` / `has_org_role_any()` / `shares_org_with()` helpers.
