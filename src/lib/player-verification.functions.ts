import { createServerFn } from "@tanstack/react-start";
import { Client } from "basic-ftp";
import { Writable } from "node:stream";
import { downloadNitradoFile } from "@/lib/nitrado-files.functions";

const SERVER_ENV_KEYS = {
  "101x": "NITRADO_SERVICE_101X",
  "102x": "NITRADO_SERVICE_102X",
} as const;

const LOG_ENV_KEYS = {
  "101x": "NITRADO_LOG_PATHS_101X",
  "102x": "NITRADO_LOG_PATHS_102X",
} as const;

const PATH_ENV_KEYS = {
  "101x": "NITRADO_MISSION_PATH_101X",
  "102x": "NITRADO_MISSION_PATH_102X",
} as const;

const FTP_ENV_KEYS = {
  "101x": { host: "FTP_101X_HOST", user: "FTP_101X_USER", password: "FTP_101X_PASS", port: "FTP_101X_PORT" },
  "102x": { host: "FTP_102X_HOST", user: "FTP_102X_USER", password: "FTP_102X_PASS", port: "FTP_102X_PORT" },
} as const;

const FTP_PATH_ENV_KEYS = {
  "101x": "FTP_101X_LOGS_PATH",
  "102x": "FTP_102X_LOGS_PATH",
} as const;

type ServerMap = keyof typeof SERVER_ENV_KEYS;

function normalizePsnName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function logPathsFor(server: ServerMap) {
  return (process.env[LOG_ENV_KEYS[server]] ?? "")
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean);
}

async function readLatestFtpLogs(server: ServerMap) {
  const env = FTP_ENV_KEYS[server];
  const host = process.env[env.host] ?? process.env.FTP_HOST;
  const user = process.env[env.user] ?? process.env.FTP_USER;
  const password = process.env[env.password] ?? process.env.FTP_PASS;
  if (!host || !user || !password) return null;
  const logsPath = process.env[FTP_PATH_ENV_KEYS[server]] ?? process.env.FTP_LOGS_PATH ?? "/dayzps/config";

  const client = new Client();
  client.ftp.timeout = 20_000;
  try {
    await client.access({ host, user, password, port: Number(process.env[env.port] ?? process.env.FTP_PORT ?? 21) });
    const files = (await client.list(logsPath))
      .filter((file) => /\.(RPT|ADM)$/i.test(file.name))
      .sort((left, right) => right.modifiedAt - left.modifiedAt)
      .slice(0, 12);
    if (!files.length) return { configured: true, logsRead: false, error: `No .RPT or .ADM files found in ${logsPath}.` };

    const contents: string[] = [];
    for (const file of files) {
      let text = "";
      const sink = new Writable({
        write(chunk, _encoding, callback) {
          text += chunk.toString();
          callback();
        },
      });
      await client.downloadTo(sink, `${logsPath.replace(/\/$/, "")}/${file.name}`);
      contents.push(text);
    }
    return { configured: true, logsRead: true, contents };
  } catch (error) {
    return { configured: true, logsRead: false, error: error instanceof Error ? error.message : "FTP log read failed" };
  } finally {
    client.close();
  }
}

export const verifyPlayerOnServers = createServerFn({ method: "POST" })
  .inputValidator((data: { psnName: string; servers: ServerMap[]; accessToken?: string }) => data)
  .handler(async ({ data }) => {
    const accessToken = data.accessToken;
    const isDemo = accessToken === "demo-access-token" || accessToken === "discord-access-token";
    if (!isDemo && !accessToken) {
      throw new Error("Unauthorized: Sign in again before verifying your PSN.");
    }

    const psnName = normalizePsnName(data.psnName);
    const servers = [...new Set(data.servers)];
    if (!psnName || !/^[a-z0-9 _-]{2,32}$/i.test(psnName)) {
      throw new Error("Enter a valid PSN name (2-32 letters, numbers, spaces, - or _). ");
    }
    if (!servers.length) throw new Error("Select at least one server.");

    const results = await Promise.all(
      servers.map(async (server) => {
        const ftpLogs = await readLatestFtpLogs(server);
        if (ftpLogs?.logsRead) {
          return {
            server,
            played: ftpLogs.contents.some((log) => normalizePsnName(log).includes(psnName)),
            configured: true,
            logsRead: true,
          };
        }

        // Prefer the configured FTP account. If it connected but cannot see
        // the log directory, do not hide that useful error behind API fallback.
        if (ftpLogs) {
          return {
            server,
            played: false,
            configured: true,
            logsRead: false,
            error: ftpLogs.error ?? "FTP log directory could not be read.",
          };
        }

        const serviceId = process.env[SERVER_ENV_KEYS[server]];
        const missionPath = process.env[PATH_ENV_KEYS[server]];
        const paths = logPathsFor(server);
        if (!serviceId || !missionPath || !paths.length) {
          return { server, played: false, configured: false, error: ftpLogs?.error };
        }

        let logsRead = false;
        let lastError: string | null = null;
        for (const path of paths) {
          try {
            const log = await downloadNitradoFile(serviceId, path, missionPath);
            logsRead = true;
            if (normalizePsnName(log).includes(psnName)) {
              return { server, played: true, configured: true, logsRead: true };
            }
          } catch (error) {
            // A missing rotated log should not prevent checking the remaining paths.
            lastError = error instanceof Error ? error.message : "Nitrado log download failed";
          }
        }
        return { server, played: false, configured: true, logsRead, error: lastError ?? ftpLogs?.error };
      }),
    );

    const configured = results.every((result) => result.configured);
    const logsAvailable = results.every((result) => "logsRead" in result && result.logsRead);
    return {
      psnName,
      results,
      verified: configured && logsAvailable && results.some((result) => result.played),
      logsAvailable,
      logErrors: results.filter((result) => "error" in result && result.error).map((result) => `${result.server}: ${result.error}`),
    };
  });