import { createFileRoute } from "@tanstack/react-router";
import { FactionHubContent } from "@/routes/_app/tools/event-intake";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/war-room")({
  component: () => (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <FactionHubContent />
    </div>
  ),
  head: () => ({
    meta: [
      { title: `War Room — ${BRAND.name}` },
      { name: "description", content: "Create or join a faction, declare wars, and manage your roster." },
    ],
  }),
});
