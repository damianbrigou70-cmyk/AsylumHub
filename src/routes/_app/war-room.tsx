import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FactionHubContent } from "@/routes/_app/tools/event-intake";
import { IconCampaign, IconArrowRight } from "@/components/ui-custom/CustomIcon";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/war-room")({
  component: WarRoomPage,
  head: () => ({
    meta: [
      { title: `War Room — ${BRAND.name}` },
      { name: "description", content: "Create or join a faction, declare wars, and manage your roster." },
    ],
  }),
});

function WarRoomPage() {
  const [entered, setEntered] = useState(false);

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <motion.div
          key="gate"
          className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center overflow-hidden bg-black px-4"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.5, ease: [0.4, 0, 1, 1] } }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_60%)]"
            animate={{ opacity: [0.28, 0.48, 0.28] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_0%,transparent_48%,color-mix(in_oklab,var(--primary)_18%,transparent)_49%,transparent_50%)] [background-size:46px_46px]" />
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: 24 }, (_, index) => (
              <motion.span
                key={index}
                className="absolute bottom-0 rounded-full bg-primary/70"
                style={{
                  left: `${(index * 17.3) % 100}%`,
                  width: 2 + (index % 3),
                  height: 2 + (index % 3),
                  boxShadow: "0 0 10px color-mix(in oklab, var(--primary) 80%, transparent)",
                }}
                animate={{ y: [0, -420 - (index % 5) * 40], opacity: [0, 1, 0] }}
                transition={{ duration: 5 + (index % 6), repeat: Infinity, delay: (index % 9) * 0.4, ease: "easeOut" }}
              />
            ))}
          </div>

          <motion.div
            className="relative max-w-lg text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary"
              initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.span
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <IconCampaign size={30} />
              </motion.span>
            </motion.div>
            <motion.div
              className="mt-5 text-[11px] uppercase tracking-[0.3em] text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              {BRAND.name} · Command hall
            </motion.div>
            <motion.h1
              className="font-display mt-2 text-5xl text-primary sm:text-6xl"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              War Room
            </motion.h1>
            <motion.p
              className="mt-4 text-sm text-zinc-400 sm:text-base"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5 }}
            >
              Faction rosters, standing wars, and territory contracts. Step inside to manage your crew.
            </motion.p>
            <motion.button
              type="button"
              onClick={() => setEntered(true)}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 32px color-mix(in oklab, var(--primary) 55%, transparent)" }}
              whileTap={{ scale: 0.96 }}
            >
              Enter War Room
              <motion.span animate={{ x: [0, 4, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}>
                <IconArrowRight size={16} />
              </motion.span>
            </motion.button>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="hall"
          className="relative min-h-[calc(100vh-3rem)] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%)]"
            animate={{ opacity: [0.16, 0.28, 0.16] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-8">
            <motion.button
              type="button"
              onClick={() => setEntered(false)}
              className="mb-5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <span aria-hidden="true">←</span> Leave War Room
            </motion.button>
            <motion.div
              className="rounded-2xl border border-primary/25 bg-white/[0.02] p-5 sm:p-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <FactionHubContent />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
