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
  const title = "War Room";

  return (
    <AnimatePresence mode="wait">
      {!entered ? (
        <motion.div
          key="gate"
          className="relative flex min-h-[calc(100vh-3rem)] items-center justify-center overflow-hidden bg-black px-4"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04, transition: { duration: 0.5, ease: [0.4, 0, 1, 1] } }}
        >
          <style>{`
            @keyframes warroom-scan { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
            @keyframes warroom-flicker { 0%, 100% { opacity: 1; } 42% { opacity: 1; } 43% { opacity: 0.72; } 44% { opacity: 1; } 71% { opacity: 1; } 72% { opacity: 0.8; } 73% { opacity: 1; } }
            @keyframes warroom-shine { 0% { transform: translateX(-140%) skewX(-20deg); } 100% { transform: translateX(240%) skewX(-20deg); } }
          `}</style>

          <motion.div
            className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_50%_20%,color-mix(in_oklab,var(--primary)_25%,transparent),transparent_60%)]"
            animate={{ opacity: [0.28, 0.5, 0.28] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute inset-0 opacity-0 [background-image:radial-gradient(circle_at_80%_80%,color-mix(in_oklab,var(--primary)_20%,transparent),transparent_55%)]"
            animate={{ opacity: [0, 0.35, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
          />
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_0%,transparent_48%,color-mix(in_oklab,var(--primary)_18%,transparent)_49%,transparent_50%)] [background-size:46px_46px]" />

          {/* Scanline sweep */}
          <div
            className="pointer-events-none absolute inset-x-0 h-40 opacity-[0.06]"
            style={{
              background: "linear-gradient(180deg, transparent, color-mix(in oklab, var(--primary) 90%, white), transparent)",
              animation: "warroom-scan 6s linear infinite",
            }}
            aria-hidden
          />

          {/* HUD corner brackets */}
          <div className="pointer-events-none absolute inset-6 sm:inset-10" style={{ animation: "warroom-flicker 7s ease-in-out infinite" }} aria-hidden>
            {(["top-4 left-4 border-l border-t", "top-4 right-4 border-r border-t", "bottom-4 left-4 border-l border-b", "bottom-4 right-4 border-r border-b"] as const).map((pos) => (
              <span key={pos} className={`absolute size-8 sm:size-12 border-primary/40 ${pos}`} />
            ))}
          </div>

          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            {Array.from({ length: 34 }, (_, index) => (
              <motion.span
                key={index}
                className="absolute bottom-0 rounded-full bg-primary/70"
                style={{
                  left: `${(index * 12.1) % 100}%`,
                  width: 1.5 + (index % 4),
                  height: 1.5 + (index % 4),
                  boxShadow: "0 0 10px color-mix(in oklab, var(--primary) 80%, transparent)",
                }}
                animate={{ y: [0, -420 - (index % 5) * 60], x: [0, ((index % 3) - 1) * 30], opacity: [0, 1, 0] }}
                transition={{ duration: 5 + (index % 7), repeat: Infinity, delay: (index % 11) * 0.35, ease: "easeOut" }}
              />
            ))}
          </div>

          <motion.div
            className="relative max-w-lg text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="relative mx-auto flex size-20 items-center justify-center">
              <motion.span
                className="absolute inset-0 rounded-full border border-primary/30 border-t-primary"
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              />
              <motion.span
                className="absolute inset-1.5 rounded-full border border-dashed border-primary/20"
                animate={{ rotate: -360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              />
              <motion.div
                className="relative flex size-14 items-center justify-center rounded-2xl border border-primary/40 bg-primary/10 text-primary"
                initial={{ opacity: 0, scale: 0.7, rotate: -8 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <IconCampaign size={28} />
                </motion.span>
              </motion.div>
            </div>

            <motion.div
              className="mt-5 text-[11px] uppercase tracking-[0.3em] text-primary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              {BRAND.name} · Command hall
            </motion.div>

            <motion.h1
              className="font-display mt-2 flex justify-center text-5xl text-primary sm:text-6xl"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.045, delayChildren: 0.3 } } }}
              aria-label={title}
            >
              {title.split("").map((char, index) => (
                <motion.span
                  key={index}
                  variants={{
                    hidden: { opacity: 0, y: 24, rotateX: -60 },
                    visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
                  }}
                  style={{ display: "inline-block", whiteSpace: char === " " ? "pre" : "normal" }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              className="mt-4 text-sm text-zinc-400 sm:text-base"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.5 }}
            >
              Faction rosters, standing wars, and territory contracts. Step inside to manage your crew.
            </motion.p>

            <motion.button
              type="button"
              onClick={() => setEntered(true)}
              className="relative mt-8 inline-flex items-center gap-2 overflow-hidden rounded-full bg-primary px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.5 }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 40px color-mix(in oklab, var(--primary) 60%, transparent)" }}
              whileTap={{ scale: 0.96 }}
            >
              <span
                className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-white/40 blur-sm"
                style={{ animation: "warroom-shine 2.6s ease-in-out infinite" }}
                aria-hidden
              />
              <span className="relative">Enter War Room</span>
              <motion.span className="relative" animate={{ x: [0, 4, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}>
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
