// AsylumSpawnBridge — server-side mod, DayZ Enforce Script.
// Polls a JSON file dropped into the mission folder for spawn requests and
// creates the entity directly via GetGame().CreateObject() — no CE/XML
// reload, no restart. Pair with src/lib/live-exec/dayz-server-executor-adapter.ts.
//
// SECURITY: this mod does NOT verify the `sig` field on incoming requests —
// Enforce Script has no built-in crypto primitive to check an HMAC. The only
// real access control is that requests.json can only be written by whoever
// holds the Nitrado API token (the same credential already protecting this
// whole app). Do not describe `sig` as authentication anywhere downstream.
//
// NOT verified/compiled against a live DayZ Tools build — review before
// packing into a PBO and installing. Only tested for logical correctness
// against documented Enforce Script APIs (JsonFileLoader, GetCallQueue,
// GetGame().CreateObject, PlayerBase.GetPosition), plus a manual trace of
// malformed-input paths (bad JSON, missing fields, out-of-range coordinates,
// unknown classname, duplicate IDs) — none of which should crash the server
// or spawn anything. Actual in-game/RPT verification is still required.

class AsylumSpawnBridgeHeartbeat
{
	int ts;
};

class AsylumSpawnBridgeRequest
{
	string id;
	float ts;
	string classname;
	float x;
	float y;
	float z;
	string sig;
};

class AsylumSpawnBridgeRequests
{
	ref array<ref AsylumSpawnBridgeRequest> items;
};

class AsylumSpawnBridgeResult
{
	string id;
	bool ok;
	float ts;
	string reason;
};

class AsylumSpawnBridgeResults
{
	ref array<ref AsylumSpawnBridgeResult> items = new array<ref AsylumSpawnBridgeResult>();
};

class AsylumSpawnBridge
{
	// Only classnames explicitly allowed here can ever be spawned by a request.
	static ref array<string> s_allowedClassnames = { "SurvivorM_Boris" };
	// Grows for the lifetime of the process (dedup only) — prune periodically in production.
	static ref array<string> s_processedIds = new array<string>();

	static const string REQUESTS_PATH = "$mission:AsylumSpawnBridge/requests.json";
	static const string RESULTS_PATH = "$mission:AsylumSpawnBridge/results.json";
	static const string HEARTBEAT_PATH = "$mission:AsylumSpawnBridge/heartbeat.json";
	static const int POLL_INTERVAL_MS = 2000;
	// Chernarus/Livonia/Sakhal all fit comfortably inside these bounds; used only
	// to reject obviously-missing (0,0,0) or garbage coordinates, not real validation.
	static const float MAX_XZ = 20000;
	static const float MIN_Y = -100;
	static const float MAX_Y = 2000;

	static void Tick()
	{
		WriteHeartbeat();
		ProcessRequests();
		GetGame().GetCallQueue(CALL_CATEGORY_SYSTEM).CallLater(AsylumSpawnBridge.Tick, POLL_INTERVAL_MS, false);
	}

	static void WriteHeartbeat()
	{
		AsylumSpawnBridgeHeartbeat hb = new AsylumSpawnBridgeHeartbeat();
		// Freshness is judged by the Command Center off the file's own
		// modified_at (via Nitrado's file stat API), not this field.
		hb.ts = GetGame().GetTickTime();
		JsonFileLoader<AsylumSpawnBridgeHeartbeat>.JsonSaveFile(HEARTBEAT_PATH, hb);
	}

	static bool IsValidPosition(float x, float y, float z)
	{
		if (x == 0 && y == 0 && z == 0) return false; // treat as "missing", not a real map location
		if (Math.AbsFloat(x) > MAX_XZ || Math.AbsFloat(z) > MAX_XZ) return false;
		if (y < MIN_Y || y > MAX_Y) return false;
		return true;
	}

	static void ProcessRequests()
	{
		if (!FileExist(REQUESTS_PATH)) return;

		AsylumSpawnBridgeRequests requests = new AsylumSpawnBridgeRequests();
		JsonFileLoader<AsylumSpawnBridgeRequests>.JsonLoadFile(REQUESTS_PATH, requests);
		if (!requests || !requests.items) return;

		AsylumSpawnBridgeResults results = new AsylumSpawnBridgeResults();
		if (FileExist(RESULTS_PATH))
		{
			JsonFileLoader<AsylumSpawnBridgeResults>.JsonLoadFile(RESULTS_PATH, results);
			if (!results.items) return;
		}

		bool wroteAny = false;
		foreach (AsylumSpawnBridgeRequest req : requests.items)
		{
			if (!req || req.id == "" || s_processedIds.Find(req.id) != -1) continue;
			s_processedIds.Insert(req.id);
			wroteAny = true;

			AsylumSpawnBridgeResult result = new AsylumSpawnBridgeResult();
			result.id = req.id;
			result.ts = req.ts;

			if (req.classname == "" || s_allowedClassnames.Find(req.classname) == -1)
			{
				result.ok = false;
				result.reason = "classname missing or not allowed";
			}
			else if (!IsValidPosition(req.x, req.y, req.z))
			{
				result.ok = false;
				result.reason = "position missing or out of bounds";
			}
			else
			{
				vector pos = Vector(req.x, req.y, req.z);
				Object spawned = GetGame().CreateObjectEx(req.classname, pos, ECE_PLACE_ON_SURFACE);
				result.ok = (spawned != null);
				if (result.ok)
					Print("[AsylumSpawnBridge] spawned " + req.classname + " (" + req.id + ") at " + pos);
				else
					result.reason = "CreateObject returned null";
			}

			if (!result.ok)
				Print("[AsylumSpawnBridge] request " + req.id + " failed: " + result.reason);

			results.items.Insert(result);
		}

		if (wroteAny)
		{
			JsonFileLoader<AsylumSpawnBridgeResults>.JsonSaveFile(RESULTS_PATH, results);
		}
	}
};

// Hooks the mission lifecycle without touching the mission's own init.c —
// this file lives entirely inside the mod PBO.
modded class MissionServer
{
	override void OnInit()
	{
		super.OnInit();
		AsylumSpawnBridge.Tick();
	}
};
