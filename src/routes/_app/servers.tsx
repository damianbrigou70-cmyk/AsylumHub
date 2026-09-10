import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { GlassSkeleton } from "@/components/ui-custom/GlassSkeleton";
import { PanelError } from "@/components/ui-custom/PanelError";
import { PageHexBadge } from "@/components/app/PageHexBadge";
import { IconBolt, IconCheck } from "@/components/ui-custom/CustomIcon";
import { Button } from "@/components/ui/button";
import { getNitradoServerStatus } from "@/lib/nitrado.functions";
import { postDiscordServerStatus } from "@/lib/discord.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/servers")({
  component: ServersPage,
});

// Default server status panel: 101x PlayStation server.
const TEST_SERVER = { id: "17656048", label: "101x | ASYLUM" };

function ServersPage() {
  const [posting, setPosting] = useState(false);

  const { data: status, isLoading, error, refetch } = useQuery({
    queryKey: ["nitrado-status", TEST_SERVER.id],
    queryFn: () => getNitradoServerStatus({ data: { serviceId: TEST_SERVER.id } }),
    refetchInterval: 30_000,
  });

  const postToDiscord = useMutation({
    mutationFn: async () => {
      if (!status) throw new Error("No status loaded yet");
      return postDiscordServerStatus({ data: { status } });
    },
    onSuccess: () => toast.success("Posted server status to Discord"),
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to post to Discord"),
    onSettled: () => setPosting(false),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <PageHexBadge icon={<IconBolt size={16} />} hue={55} aria-label="Servers" />
        <h1 className="text-xl font-semibold">Game servers</h1>
      </div>

      <GlassPanel className="p-6">
        {isLoading && <GlassSkeleton className="h-40" />}
        {error && (
          <PanelError
            bare
            message={error instanceof Error ? error.message : "Couldn't load Nitrado status"}
            onRetry={() => refetch()}
          />
        )}
        {status && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-medium">{status.serverName || TEST_SERVER.label}</div>
                <div className="text-sm text-muted-foreground">{status.game} · {status.map ?? "unknown map"}</div>
              </div>
              <span
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium " +
                  (status.status === "started"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400")
                }
              >
                <IconCheck size={12} />
                {status.status === "started" ? "Online" : "Offline"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <Stat label="Players" value={`${status.players.current} / ${status.players.max}`} />
              <Stat label="Connect" value={status.ip ? `${status.ip}:${status.port}` : "—"} />
              <Stat label="Query port" value={status.queryPort ?? "—"} />
              <Stat label="RCON port" value={status.rconPort ?? "—"} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
              <Button
                disabled={posting || postToDiscord.isPending}
                onClick={() => {
                  setPosting(true);
                  postToDiscord.mutate();
                }}
              >
                Post to Discord
              </Button>
            </div>
          </div>
        )}
      </GlassPanel>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-glass-border bg-glass/30 px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}
