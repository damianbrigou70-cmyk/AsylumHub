# AsylumSpawnBridge — isolated test (no Command Center, no Nitrado, no player lookup)

Goal: prove or disprove that `GetGame().CreateObject("SurvivorM_Boris", ...)` runs
from inside `AsylumSpawnBridge` on a real running server, with zero restart,
using one manually-written request file. Nothing else is involved.

## 1. Server

Use a **local or test PC DayZ dedicated server you already control** — not the
Xbox/PS4 Nitrado server. Any vanilla DayZ dedicated server binary + a normal
mission (e.g. `dayzOffline.chernarusplus`) works.

## 2. Load the mod

Two options — pick whichever your setup supports:

- **Loose/unpacked (fastest for this test)**: copy the folder
  `dayz-mod/AsylumSpawnBridge/` as-is into your server's mod directory (e.g.
  next to your other `@Mods`), then start the server with
  `-mod=AsylumSpawnBridge` (or your launcher's mod list) alongside your usual
  `-config=`, `-port=`, `-profiles=` params.
- **Packed PBO**: if your workflow requires it, pack
  `dayz-mod/AsylumSpawnBridge/` with DayZ Tools/AddonBuilder the same way you'd
  pack any other server mod, then load it the same way.

Do not add any other mods for this test.

## 3. Enable RPT logging

Start the server with your usual RPT-producing flags, e.g. `-dologs -adminlog
-freezecheck` (whatever combination your setup already uses is fine — RPT
files are written by default under the server's `-profiles=` folder as
`DayZServer_x64_*.RPT`).

## 4. Drop in the manual test request

1. Let the server fully start once, normally (no mod yet is fine, or with the
   mod — either way).
2. In the **mission folder** the server is actually running (e.g.
   `.../mpmissions/dayzOffline.chernarusplus/`), create a folder named
   `AsylumSpawnBridge` if it doesn't already exist.
3. Copy [`dayz-mod/test-fixtures/requests.json`](test-fixtures/requests.json)
   into it, so the path is:
   `.../dayzOffline.chernarusplus/AsylumSpawnBridge/requests.json`
4. Do **not** restart the server — the mod polls this file every ~2 seconds
   while the server keeps running.
5. Note the test coordinate baked into the fixture: **x=7000, y=0, z=7500**
   (adjust in the file first if that's not a safe/reachable spot on your map
   — any open, non-underground location is fine, `y` gets corrected to
   terrain height automatically).

## 5. What to check afterward

**In the mission folder**, under `AsylumSpawnBridge/`:
- `heartbeat.json` should appear within ~10s of server start, and its
  modified-time should keep updating every ~2s — this is your proof the
  `Tick()` loop is alive at all, independent of whether spawning works.
- `results.json` should appear after you drop in `requests.json`, containing
  one entry with `"id":"test-0001"` and either `"ok":true` or `"ok":false` +
  a `"reason"`.

**In the RPT log**, search for the literal string `[AsylumSpawnBridge]`. You
should see one line per attempt, either:
```
[AsylumSpawnBridge] spawned SurvivorM_Boris (test-0001) at <vector>
```
or
```
[AsylumSpawnBridge] request test-0001 failed: <reason>
```
Also scan the RPT from server start for any script error mentioning
`AsylumSpawnBridge` — there should be none.

**In-game**: connect a DayZ client to this server and go to the test
coordinate. This is the only way to actually confirm Boris exists — files and
logs alone don't prove it rendered/exists as a live entity.

## 6. Report back exactly this

```
SERVER START
Bridge initialized: YES/NO        (heartbeat.json appeared and is updating?)

REQUEST DETECTED: YES/NO          (results.json appeared with id "test-0001"?)
REQUEST PARSED: YES/NO            (no JSON/script errors in RPT for AsylumSpawnBridge?)
POSITION VALID: YES/NO            (reason field, if any, does NOT say "position missing or out of bounds"?)
CreateObject RESULT: <paste the exact [AsylumSpawnBridge] RPT line(s)>
RESULT WRITTEN: YES/NO            (results.json contains the test-0001 entry?)

IN-GAME CHECK: Boris visible at the test coordinate? YES/NO
SERVER RESTARTED: YES/NO          (should be NO the whole time)
```

Paste the RPT excerpt (the lines containing `AsylumSpawnBridge`, plus any
errors near server start) along with that report. No code changes should be
made to the bridge until this comes back.
