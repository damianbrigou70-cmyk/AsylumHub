import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlassPanel } from "@/components/ui-custom/GlassPanel";
import { IconChevronLeft, IconChevronRight, IconCheck } from "@/components/ui-custom/CustomIcon";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/battlepass")({ component: BattlepassPage });

const TOTAL_LEVELS = 100;
const PER_PAGE = 10;
const REWARD_TYPES = ["Outfit", "Weapon skin", "Vehicle paint", "Player icon", "Emote", "Progress boost", "Photo pose", "Loading screen", "Title", "Credits", "Clothing skin", "Discord role", "Badge", "NPC voucher", "UAV voucher", "Vehicle voucher"] as const;

type Reward = { level: number; type: (typeof REWARD_TYPES)[number]; name: string; cost: number };

const REWARDS: Reward[] = Array.from({ length: TOTAL_LEVELS }, (_, index) => {
  const level = index + 1;
  const milestone = level % 6 === 0 && level < TOTAL_LEVELS;
  const specialRewards: Partial<Record<number, (typeof REWARD_TYPES)[number]>> = {
    10: "Weapon skin",
    20: "Vehicle paint",
    30: "Clothing skin",
    40: "Discord role",
    50: "Badge",
    60: "NPC voucher",
    70: "UAV voucher",
    80: "Vehicle voucher",
    90: "Discord role",
  };
  const type = milestone ? "Credits" : specialRewards[level] ?? REWARD_TYPES[index % 10];
  const cost = type === "Credits" ? 0 : 15 + ((index * 7) % 40);
  const names: Record<(typeof REWARD_TYPES)[number], string> = {
    "Outfit": `Charred Survivor Outfit Vol.${Math.ceil(level / 10)}`,
    "Weapon skin": `Bloodied Blade Weapon Skin`,
    "Vehicle paint": `Scorched Convoy Paint`,
    "Player icon": `Ashen Faction Icon`,
    "Emote": `Blood Oath Emote`,
    "Progress boost": `5% Progress Boost`,
    "Photo pose": `Firelit Photo Pose`,
    "Loading screen": `Loading Screen: Ember Fields`,
    "Title": `"Bloodletter" Title`,
    "Credits": "2,500 Credits",
    "Clothing skin": `Drylands Clothing Skin ${Math.ceil(level / 10)}`,
    "Discord role": level === 40 ? "Drylands Scout Discord Role" : "Drylands Warden Discord Role",
    "Badge": "Drylands Battlepass Badge",
    "NPC voucher": "NPC Spawn Voucher",
    "UAV voucher": "UAV Deployment Voucher",
    "Vehicle voucher": "Vehicle Spawn Voucher",
  };
  return { level, type, name: names[type], cost };
});

// Deterministic pseudo-random drip heights/delays so blood drips look organic without re-rolling on render.
function seeded(n: number, salt: number) {
  const x = Math.sin(n * 999 + salt) * 10000;
  return x - Math.floor(x);
}

export function BattlepassPage() {
  const [rank, setRank] = useState(1);
  const [score, setScore] = useState(240);
  const [tickets, setTickets] = useState(60);
  const [credits, setCredits] = useState(0);
  const [claimed, setClaimed] = useState<number[]>([]);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(TOTAL_LEVELS / PER_PAGE);
  const pageRewards = useMemo(() => REWARDS.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE), [page]);
  const featuredReward = REWARDS[rank - 1];
  const scoreTarget = 1000;

  const claim = (reward: Reward) => {
    if (reward.level > rank) return toast.error("Reach this rank first");
    if (claimed.includes(reward.level)) return;
    if (reward.cost > 0 && tickets < reward.cost) return toast.error("Not enough tickets");
    if (reward.cost > 0) setTickets((value) => value - reward.cost);
    if (reward.type === "Credits") setCredits((value) => value + 2500);
    setClaimed((current) => [...current, reward.level]);
    toast.success(`Claimed ${reward.name}`, { description: `Rank ${reward.level}` });
  };

  const rankUp = () => {
    if (rank >= TOTAL_LEVELS) return;
    setRank((value) => value + 1);
    setTickets((value) => value + 10);
    setScore(0);
    toast.success(`Ranked up to ${rank + 1}`);
  };

  return (
    <div className="bf-root space-y-6">
      {/* SVG turbulence filter gives the blood shapes an irregular, liquid edge */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden>
        <filter id="bf-blood-turb" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.09 0.25" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      {/* Ambient background: embers, smoke, fire glow */}
      <div className="bf-atmosphere" aria-hidden>
        <img className="bf-desert-video" src="/drylands.png" alt="" aria-hidden />
        <FireSparkleField />
        <div className="bf-wind bf-wind-a" />
        <div className="bf-wind bf-wind-b" />
        <img className="bf-flying-sticker" src="/fly-flying-sticker.gif" alt="" />
        <div className="bf-smoke bf-smoke-a" />
        <div className="bf-smoke bf-smoke-b" />
        <div className="bf-fire-glow" />
        {Array.from({ length: 72 }, (_, index) => (
          <span
            key={index}
            className="bf-ember"
            style={{
              left: `${(seeded(index, 1) * 100).toFixed(2)}%`,
              bottom: `${(-8 + seeded(index, 4) * 108).toFixed(2)}%`,
              width: `${1.5 + seeded(index, 8) * 3}px`,
              height: `${1.5 + seeded(index, 9) * 5}px`,
              animationDelay: `${(seeded(index, 2) * 6).toFixed(2)}s`,
              animationDuration: `${3 + seeded(index, 3) * 5}s`,
            }}
          />
        ))}
      </div>

      <header className="bf-masthead">
        <div className="bf-mast-copy">
          <div className="bf-hero-kicker">Battlepass // Season I: Drylands</div>
          <h1 className="bf-title">DRYLANDS</h1>
          <p className="bf-subtitle">A hundred ranks across the dead frontier. Earn your keep, claim the relics, and survive the long road home.</p>
        </div>
        <div className="bf-season-mark" aria-hidden><span>SEASON</span><b>01</b><small>100 RANKS</small></div>
      </header>

      <section className="bf-frontier-head">
        <div className="bf-frontier-label"><span className="bf-command-label">Season progress</span><strong>{rank} <small>/ {TOTAL_LEVELS}</small></strong></div>
        <div className="bf-frontier-progress"><div className="bf-score-line"><span>Progress to next rank</span><b>{score} / {scoreTarget}</b></div><div className="bf-score-bar"><div className="bf-score-fill" style={{ width: `${Math.min(100, (score / scoreTarget) * 100)}%` }} /></div></div>
        <div className="bf-frontier-wallet"><span>Tickets</span><b>{tickets}</b><span>Credits</span><b>{credits.toLocaleString()}</b></div>
        <button type="button" onClick={rankUp} disabled={rank >= TOTAL_LEVELS} className="bf-rankup">Advance</button>
      </section>

      <section className="bf-frontier-layout">
        <GlassPanel className="bf-panel bf-frontier-map">
          <div className="bf-map-heading"><div><div className="bf-command-label">The Drylands route</div><h2>CLAIM YOUR GROUND</h2></div><div className="bf-track-controls"><span>Ranks {page * PER_PAGE + 1}-{Math.min(TOTAL_LEVELS, page * PER_PAGE + PER_PAGE)}</span><button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={page === 0} className="bf-pagebtn"><IconChevronLeft size={14} /></button><button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={page === totalPages - 1} className="bf-pagebtn"><IconChevronRight size={14} /></button></div></div>
          <div className="bf-frontier-path"><div className="bf-path-line" />
          {pageRewards.map((reward, i) => {
            const locked = reward.level > rank;
            const isClaimed = claimed.includes(reward.level);
            const isCurrent = reward.level === rank;
            return (
              <button
                key={reward.level}
                type="button"
                onClick={() => claim(reward)}
                disabled={locked || isClaimed}
                className={`bf-card ${isClaimed ? "bf-card-claimed" : locked ? "bf-card-locked" : "bf-card-ready"} ${isCurrent ? "bf-card-current" : ""}`}
              >
                <span className="bf-card-drip" style={{ animationDelay: `${(seeded(i + page * 10, 9) * 5).toFixed(2)}s`, height: `${10 + seeded(i + page * 10, 10) * 12}px` }} aria-hidden>
                  <span className="bf-card-drip-gloss" />
                </span>
                <span className="bf-card-drip-pool" style={{ animationDelay: `${(seeded(i + page * 10, 9) * 5).toFixed(2)}s` }} aria-hidden />
                <span className="bf-frontier-node"><span>{String(reward.level).padStart(2, "0")}</span></span>
                <span className="bf-frontier-reward"><b>{reward.name}</b><small>{reward.type}</small><em>{isClaimed ? "CLAIMED" : reward.cost > 0 ? `${reward.cost} TIX` : "FREE"}</em></span>
                {isClaimed && <IconCheck size={15} className="text-emerald-300" />}
              </button>
            );
          })}
          </div>
        </GlassPanel>
        <GlassPanel className="bf-panel bf-drawer">
          <div className="bf-drawer-art"><span>{featuredReward.type === "Credits" ? "¢" : "✦"}</span><small>SELECTED REWARD</small></div>
          <div className="bf-drawer-content"><div className="bf-command-label">Rank {featuredReward.level} checkpoint</div><h2>{featuredReward.name}</h2><p>{featuredReward.type} // Drylands season relic</p><button type="button" onClick={() => claim(featuredReward)} disabled={featuredReward.level > rank || claimed.includes(featuredReward.level)} className="bf-claim-featured">{claimed.includes(featuredReward.level) ? "Claimed" : featuredReward.level > rank ? "Locked" : "Claim reward"}</button></div>
        </GlassPanel>
      </section>

      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=MedievalSharp&display=swap");
        .bf-root { position: relative; }
        .bf-atmosphere { position: fixed; inset: 0; z-index: -1; overflow: hidden; pointer-events: none; background: radial-gradient(ellipse at 50% 100%, oklch(0.22 0.08 20 / 0.55), oklch(0.05 0.01 20) 70%); }
        .bf-sparkle-field { position: absolute; inset: 0; z-index: 1; width: 100%; height: 100%; opacity: .72; mix-blend-mode: screen; pointer-events: none; }
        .bf-wind { position: absolute; inset: 0 -35%; opacity: .28; pointer-events: none; background: repeating-linear-gradient(166deg, transparent 0 34px, oklch(0.92 0.09 68 / .14) 35px 37px, transparent 38px 82px); mix-blend-mode: screen; filter: blur(1px); animation: bf-wind-sweep 18s linear infinite; }
        .bf-wind-a { top: 8%; transform: rotate(-3deg) scale(1.1); }
        .bf-wind-b { top: 44%; opacity: .18; transform: rotate(2deg) scale(1.15); animation-duration: 26s; animation-delay: -9s; }
        @keyframes bf-wind-sweep { from { transform: translateX(-16%) rotate(-2deg) scale(1.1); } to { transform: translateX(16%) rotate(-2deg) scale(1.1); } }
        .bf-flying-sticker { position: absolute; z-index: 2; top: 28%; left: -12%; width: clamp(52px, 7vw, 96px); height: auto; opacity: 0; object-fit: contain; mix-blend-mode: screen; animation: bf-fly-across 10s linear infinite; }
        @keyframes bf-fly-across { 0%, 6% { opacity: 0; transform: translate3d(0, 0, 0) rotate(-8deg) scale(.8); } 12% { opacity: .8; } 78% { opacity: .8; } 94%, 100% { opacity: 0; transform: translate3d(125vw, -8vh, 0) rotate(12deg) scale(1.05); } }
        .bf-fire-glow { position: absolute; left: 50%; bottom: -10%; width: 70%; height: 40%; transform: translateX(-50%); background: radial-gradient(ellipse, oklch(0.55 0.2 30 / 0.5), transparent 70%); filter: blur(40px); animation: bf-glow-pulse 3.2s ease-in-out infinite; }
        @keyframes bf-glow-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 0.95; } }
        .bf-smoke { position: absolute; bottom: 0; width: 260px; height: 520px; border-radius: 50%; filter: blur(26px); opacity: 0.35; background: radial-gradient(ellipse at 40% 90%, oklch(0.1 0.02 20 / 0.6), transparent 60%); animation: bf-smoke-rise 11s ease-in-out infinite; }
        .bf-smoke-a { left: 10%; animation-duration: 13s; }
        .bf-smoke-b { right: 12%; animation-duration: 9s; animation-delay: -3s; }
        @keyframes bf-smoke-rise { 0%, 100% { transform: translateY(20px) scale(0.95); opacity: 0.25; } 50% { transform: translateY(-40px) scale(1.08); opacity: 0.5; } }
        .bf-ember { position: absolute; bottom: 4%; width: 3px; height: 3px; border-radius: 50%; background: oklch(0.85 0.2 55); box-shadow: 0 0 8px 2px oklch(0.7 0.22 35 / 0.85); opacity: 0; animation-name: bf-ember-rise; animation-timing-function: ease-out; animation-iteration-count: infinite; }
        @keyframes bf-ember-rise { 0% { opacity: 0; transform: translate(0, 12vh) scale(0.6); } 12% { opacity: 1; } 100% { opacity: 0; transform: translate(14px, -125vh) scale(0.2); } }

        .bf-hero { position: relative; text-align: center; padding: 28px 12px 40px; }
        .bf-hero-kicker { font: 700 11px ui-monospace, monospace; letter-spacing: 0.3em; text-transform: uppercase; color: oklch(0.7 0.2 25 / 0.85); }
        .bf-title { position: relative; margin-top: 10px; font-family: "MedievalSharp", Georgia, serif; font-size: clamp(2.6rem, 6vw, 4.5rem); font-weight: 400; letter-spacing: 0.02em; color: #f4efe9; text-shadow: 0 0 30px oklch(0.6 0.22 25 / 0.6), 0 2px 0 #000; }
        .bf-amp { color: oklch(0.75 0.2 40); }
        .bf-subtitle { margin: 18px auto 0; max-width: 640px; color: oklch(0.85 0.02 60 / 0.75); font-size: 0.95rem; }
        .bf-card-drip { position: absolute; top: -2px; left: 16px; width: 5px; border-radius: 0 0 50% 50%; background: linear-gradient(180deg, oklch(0.42 0.24 22), oklch(0.2 0.18 15)); box-shadow: inset -1px -2px 3px oklch(0.05 0.05 15 / 0.8), 0 3px 7px oklch(0.02 0.02 10 / 0.65); animation: bf-button-blood 5s ease-in-out infinite; transform-origin: top; filter: url(#bf-blood-turb); z-index: 2; }
        .bf-card-drip::after { content: ""; position: absolute; left: 50%; bottom: -3px; width: 130%; height: 8px; border-radius: 50%; background: inherit; transform: translateX(-50%); }
        .bf-card-drip-gloss { position: absolute; top: 12%; left: 20%; width: 24%; height: 48%; border-radius: 50%; background: linear-gradient(180deg, oklch(0.85 0.05 30 / 0.55), transparent 70%); filter: blur(0.4px); pointer-events: none; }
        .bf-card-drip-pool { position: absolute; top: 3px; left: 14px; width: 10px; height: 3px; border-radius: 50%; background: radial-gradient(ellipse, oklch(0.3 0.2 16 / 0.9), oklch(0.16 0.15 12 / 0.4) 70%, transparent); transform: scaleX(0); animation: bf-button-pool 5s ease-out infinite; filter: url(#bf-blood-turb); z-index: 1; }
        @keyframes bf-button-blood { 0%, 100% { transform: scaleY(0.82); opacity: 0.88; } 50% { transform: scaleY(1); opacity: 1; } }
        @keyframes bf-button-pool { 0%, 35% { transform: scaleX(0); opacity: 0; } 65% { opacity: 0.85; } 100% { transform: scaleX(1); opacity: 0.7; } }

        .bf-masthead { display: flex; align-items: end; justify-content: space-between; gap: 24px; padding: 22px 4px 12px; border-bottom: 1px solid oklch(0.45 0.16 20 / 0.3); }
        .bf-mast-copy { max-width: 680px; }
        .bf-season-mark { display: grid; width: 118px; height: 118px; place-content: center; border: 1px solid oklch(0.58 0.2 28 / 0.65); background: linear-gradient(145deg, oklch(0.3 0.12 25 / 0.7), oklch(0.08 0.02 15 / 0.9)); box-shadow: 8px 8px 0 oklch(0.25 0.08 20 / 0.7), 0 0 34px oklch(0.55 0.18 25 / 0.24); text-align: center; transform: rotate(3deg); }
        .bf-season-mark span { color: oklch(0.8 0.15 45 / 0.8); font: 700 10px ui-monospace, monospace; letter-spacing: .2em; }
        .bf-season-mark b { color: oklch(0.85 0.06 35); font: 800 42px var(--font-display); line-height: .9; }
        .bf-season-mark small { color: oklch(0.7 0.04 35 / .7); font: 700 8px ui-monospace, monospace; letter-spacing: .12em; }
        .bf-command-grid { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 12px; }
        .bf-rank-panel { display: flex; align-items: center; gap: 20px; padding: 18px; }
        .bf-rank-orbit { position: relative; display: grid; width: 116px; height: 116px; flex: 0 0 auto; place-content: center; border: 1px solid oklch(0.55 0.18 25 / .6); border-radius: 50%; background: radial-gradient(circle, oklch(0.38 0.14 25 / .5), oklch(0.08 0.02 15 / .9) 68%); text-align: center; box-shadow: inset 0 0 24px oklch(0.55 0.2 25 / .25); }
        .bf-rank-orbit strong { color: oklch(0.92 0.07 45); font: 800 44px var(--font-display); line-height: .85; }
        .bf-rank-orbit small { color: oklch(0.72 0.08 30); font: 700 9px ui-monospace, monospace; letter-spacing: .22em; }
        .bf-orbit-ring { position: absolute; inset: -7px 13px; border: 1px solid oklch(0.72 0.18 35 / .45); border-left-color: transparent; border-radius: 50%; animation: bf-orbit-spin 8s linear infinite; }
        @keyframes bf-orbit-spin { to { transform: rotate(360deg); } }
        .bf-rank-meta { flex: 1; min-width: 0; }
        .bf-command-label { color: oklch(0.72 0.16 25 / .85); font: 700 10px ui-monospace, monospace; letter-spacing: .18em; text-transform: uppercase; }
        .bf-score-line { display: flex; justify-content: space-between; margin-top: 18px; color: oklch(0.68 0.03 40); font: 700 10px ui-monospace, monospace; letter-spacing: .12em; }
        .bf-score-line b { color: oklch(0.86 0.08 45); }
        .bf-rank-meta .bf-rankup { margin-top: 14px; }
        .bf-currency-stack { display: grid; gap: 12px; }
        .bf-currency { position: relative; display: grid; align-content: center; min-height: 0; padding: 15px 16px 14px 20px; overflow: hidden; border: 1px solid oklch(0.4 0.1 20 / .5); background: oklch(0.08 0.02 15 / .8); }
        .bf-currency::before { content: ""; position: absolute; inset: 0 auto 0 0; width: 4px; background: oklch(0.72 0.18 45); box-shadow: 0 0 14px oklch(0.7 0.2 35 / .7); }
        .bf-currency span { color: oklch(0.65 0.04 40); font: 700 9px ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; }
        .bf-currency strong { color: oklch(0.9 0.08 45); font: 800 25px var(--font-display); }
        .bf-currency i { color: oklch(0.58 0.03 40); font-size: 10px; font-style: normal; }
        .bf-track-layout { display: grid; grid-template-columns: minmax(220px, .75fr) minmax(0, 1.7fr); gap: 12px; align-items: start; }
        .bf-featured { position: sticky; top: 20px; overflow: hidden; }
        .bf-featured-art { display: grid; min-height: 210px; place-items: center; position: relative; background: radial-gradient(circle at 50% 45%, oklch(0.5 0.15 25 / .65), transparent 36%), repeating-linear-gradient(135deg, oklch(0.26 0.08 22 / .8) 0 2px, transparent 2px 9px), linear-gradient(145deg, oklch(0.2 0.07 20), oklch(0.05 0.01 15)); }
        .bf-featured-art::after { content: ""; position: absolute; inset: 14px; border: 1px solid oklch(0.75 0.18 35 / .25); transform: rotate(45deg); }
        .bf-art-sigil { z-index: 1; color: oklch(0.92 0.1 45); font: 800 82px var(--font-display); text-shadow: 0 0 32px oklch(0.7 0.2 25 / .75); }
        .bf-featured-art em { position: absolute; top: 12px; left: 14px; color: oklch(0.8 0.16 30); font: 700 9px ui-monospace, monospace; letter-spacing: .18em; font-style: normal; }
        .bf-featured-body { padding: 18px; }
        .bf-featured-body h2 { margin-top: 8px; color: oklch(0.92 0.05 45); font: 800 25px var(--font-display); line-height: 1; }
        .bf-featured-body p { margin-top: 8px; color: oklch(0.64 0.04 40); font-size: 11px; }
        .bf-claim-featured { width: 100%; margin-top: 20px; padding: 11px; border: 1px solid oklch(0.7 0.17 32 / .75); background: oklch(0.5 0.16 27 / .2); color: oklch(0.9 0.1 45); font: 700 11px ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; }
        .bf-claim-featured:hover:not(:disabled) { background: oklch(0.65 0.18 30 / .35); }
        .bf-claim-featured:disabled { color: oklch(0.55 0.03 40); border-color: oklch(0.35 0.04 30); }
        .bf-track-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 18px 18px 14px; border-bottom: 1px solid oklch(0.4 0.12 20 / .4); }
        .bf-track-heading h2 { margin-top: 3px; color: oklch(0.9 0.06 40); font: 800 22px var(--font-display); letter-spacing: .04em; }
        .bf-track-controls { display: flex; align-items: center; gap: 5px; color: oklch(0.58 0.04 40); font: 700 10px ui-monospace, monospace; }
        .bf-track-controls .bf-pagebtn { padding: 6px; }
        .bf-reward-rail { position: relative; padding: 10px 14px 14px; }
        .bf-reward-rail::before { content: ""; position: absolute; top: 20px; bottom: 20px; left: 45px; width: 1px; background: linear-gradient(180deg, oklch(0.6 0.18 30 / .7), oklch(0.25 0.08 20 / .25)); }
        .bf-card { display: flex; align-items: center; min-height: 60px; width: 100%; margin: 4px 0; padding: 9px 12px 9px 0; border-radius: 0; border-width: 0 0 1px; border-color: oklch(0.35 0.08 20 / .45); background: transparent; text-align: left; transform: none !important; }
        .bf-card:hover:not(:disabled) { background: linear-gradient(90deg, oklch(0.45 0.13 25 / .2), transparent); }
        .bf-card::before { content: ""; z-index: 1; width: 9px; height: 9px; flex: 0 0 auto; margin: 0 25px 0 12px; border: 2px solid oklch(0.64 0.16 30); border-radius: 50%; background: oklch(0.12 0.03 20); box-shadow: 0 0 10px oklch(0.65 0.18 30 / .6); }
        .bf-row-level { width: 36px; color: oklch(0.62 0.04 40); font: 700 11px ui-monospace, monospace; }
        .bf-row-copy { display: grid; flex: 1; gap: 3px; min-width: 0; }
        .bf-row-copy b { overflow: hidden; color: oklch(0.85 0.04 40); font: 700 13px var(--font-display); text-overflow: ellipsis; white-space: nowrap; }
        .bf-row-copy small { color: oklch(0.58 0.03 40); font-size: 10px; }
        .bf-row-cost { min-width: 54px; color: oklch(0.78 0.14 45); font: 700 10px ui-monospace, monospace; text-align: right; }
        .bf-card-locked { opacity: .42; filter: grayscale(.7); }
        .bf-card-claimed .bf-row-copy b { color: oklch(0.7 0.1 150); }
        .bf-card-current { background: linear-gradient(90deg, oklch(0.5 0.16 25 / .24), transparent); }
        .bf-card-current::before { background: oklch(0.8 0.18 40); transform: scale(1.35); }
        .bf-card-drip { left: 72px; top: -2px; }
        .bf-card-drip-pool { left: 70px; }

        .bf-frontier-head { display: grid; grid-template-columns: 155px minmax(180px, 1fr) auto auto; align-items: end; gap: 18px; padding: 14px 16px; border: 1px solid oklch(0.62 0.12 52 / .4); background: linear-gradient(90deg, oklch(0.15 0.04 30 / .92), oklch(0.24 0.07 39 / .85)); box-shadow: 0 15px 35px oklch(0.04 0.02 25 / .4); }
        .bf-frontier-label { display: grid; gap: 3px; }
        .bf-frontier-label strong { color: oklch(0.92 0.1 65); font: 800 30px "MedievalSharp", Georgia, serif; line-height: .9; }
        .bf-frontier-label small { color: oklch(0.66 0.05 50); font: 400 13px ui-monospace, monospace; }
        .bf-frontier-progress { min-width: 0; }
        .bf-frontier-wallet { display: grid; grid-template-columns: auto auto; column-gap: 10px; row-gap: 2px; align-items: baseline; color: oklch(0.72 0.06 55); font: 700 9px ui-monospace, monospace; text-transform: uppercase; letter-spacing: .1em; }
        .bf-frontier-wallet b { color: oklch(0.9 0.12 68); font-size: 15px; text-align: right; }
        .bf-frontier-head .bf-rankup { white-space: nowrap; }
        .bf-frontier-layout { display: grid; grid-template-columns: minmax(0, 1.7fr) minmax(230px, .65fr); gap: 14px; align-items: stretch; }
        .bf-frontier-map { min-width: 0; overflow: hidden; }
        .bf-map-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 20px 20px 16px; border-bottom: 1px solid oklch(0.62 0.12 52 / .28); }
        .bf-map-heading h2 { margin-top: 4px; color: oklch(0.93 0.1 68); font: 400 26px "MedievalSharp", Georgia, serif; letter-spacing: .04em; }
        .bf-frontier-path { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 9px; padding: 24px 18px 22px; }
        .bf-path-line { position: absolute; top: 50px; left: 8%; right: 8%; height: 2px; background: linear-gradient(90deg, transparent, oklch(0.78 0.18 58 / .8) 10% 90%, transparent); box-shadow: 0 0 12px oklch(0.75 0.18 55 / .5); }
        .bf-frontier-path .bf-card { z-index: 1; display: grid; grid-template-rows: 52px auto; gap: 8px; min-height: 150px; margin: 0; padding: 0 5px 5px; border: 1px solid oklch(0.6 0.13 48 / .35); background: linear-gradient(180deg, oklch(0.23 0.07 38 / .82), oklch(0.1 0.03 27 / .95)); text-align: center; transform: none !important; }
        .bf-frontier-path .bf-card:hover:not(:disabled) { border-color: oklch(0.84 0.18 65 / .8); background: linear-gradient(180deg, oklch(0.35 0.1 42 / .9), oklch(0.13 0.04 27 / .98)); }
        .bf-frontier-node { display: grid; place-items: center; position: relative; }
        .bf-frontier-node span { display: grid; place-items: center; width: 42px; height: 42px; border: 2px solid oklch(0.78 0.16 58); border-radius: 50%; background: oklch(0.16 0.04 29); color: oklch(0.93 0.1 68); font: 700 12px ui-monospace, monospace; box-shadow: 0 0 16px oklch(0.75 0.18 55 / .35); }
        .bf-frontier-reward { display: grid; align-content: center; gap: 4px; padding: 0 7px; min-width: 0; }
        .bf-frontier-reward b { overflow: hidden; color: oklch(0.9 0.07 62); font: 400 15px "MedievalSharp", Georgia, serif; line-height: 1.05; text-overflow: ellipsis; }
        .bf-frontier-reward small { color: oklch(0.68 0.05 52); font-size: 9px; text-transform: uppercase; letter-spacing: .1em; }
        .bf-frontier-reward em { color: oklch(0.8 0.14 60); font: 700 9px ui-monospace, monospace; font-style: normal; }
        .bf-frontier-path .bf-card-locked { opacity: .48; filter: grayscale(.6); }
        .bf-frontier-path .bf-card-current { box-shadow: 0 0 0 2px oklch(0.86 0.2 65 / .8), 0 0 24px oklch(0.75 0.18 55 / .34); animation: bf-frontier-pulse 1.8s ease-in-out infinite; }
        @keyframes bf-frontier-pulse { 0%, 100% { box-shadow: 0 0 0 2px oklch(0.86 0.2 65 / .7), 0 0 18px oklch(0.75 0.18 55 / .25); } 50% { box-shadow: 0 0 0 3px oklch(0.9 0.2 65 / 1), 0 0 30px oklch(0.75 0.18 55 / .55); } }
        .bf-frontier-path .bf-card-drip, .bf-frontier-path .bf-card-drip-pool { display: none; }
        .bf-drawer { display: flex; flex-direction: column; min-height: 100%; overflow: hidden; }
        .bf-drawer-art { display: grid; place-items: center; position: relative; min-height: 190px; background: radial-gradient(circle at 50% 40%, oklch(0.8 0.18 62 / .6), transparent 22%), linear-gradient(145deg, oklch(0.46 0.12 43), oklch(0.13 0.04 27)); }
        .bf-drawer-art::before, .bf-drawer-art::after { content: ""; position: absolute; width: 120px; height: 120px; border: 1px solid oklch(0.9 0.18 68 / .32); transform: rotate(45deg); }
        .bf-drawer-art::after { width: 84px; height: 84px; }
        .bf-drawer-art span { z-index: 1; color: oklch(0.95 0.12 68); font: 400 82px "MedievalSharp", Georgia, serif; text-shadow: 0 0 30px oklch(0.9 0.2 60 / .75); }
        .bf-drawer-art small { position: absolute; top: 14px; left: 16px; color: oklch(0.88 0.14 63); font: 700 9px ui-monospace, monospace; letter-spacing: .16em; }
        .bf-drawer-content { display: grid; align-content: start; gap: 8px; padding: 20px; flex: 1; }
        .bf-drawer-content h2 { color: oklch(0.94 0.1 68); font: 400 25px "MedievalSharp", Georgia, serif; line-height: 1.05; }
        .bf-drawer-content p { color: oklch(0.68 0.05 52); font-size: 11px; }
        .bf-drawer-content .bf-claim-featured { align-self: end; margin-top: auto; }

        .bf-atmosphere { background: linear-gradient(180deg, oklch(0.28 0.04 235) 0%, oklch(0.48 0.08 45) 42%, oklch(0.24 0.07 30) 58%, oklch(0.1 0.035 28) 100%); }
        .bf-desert-video { position: absolute; inset: -3%; width: 106%; height: 106%; object-fit: cover; opacity: .72; filter: saturate(.78) sepia(.16) contrast(1.08); animation: bf-desert-wind 34s ease-in-out infinite alternate; }
        @keyframes bf-desert-wind { from { transform: translate3d(-1.5%, 0, 0) scale(1.02); } to { transform: translate3d(1.5%, -0.5%, 0) scale(1.06); } }
        .bf-atmosphere::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 19% 38%, oklch(0.95 0.12 75 / .95) 0 4%, oklch(0.85 0.12 55 / .42) 12%, transparent 31%), linear-gradient(180deg, transparent 0 36%, oklch(0.08 0.04 235 / .35) 37% 51%, transparent 52%); mix-blend-mode: screen; }
        .bf-atmosphere::after { content: ""; position: absolute; inset: 52% 0 0; opacity: .48; background: repeating-linear-gradient(166deg, transparent 0 17px, oklch(0.04 0.025 28 / .65) 18px 20px, transparent 21px 43px), repeating-linear-gradient(12deg, transparent 0 29px, oklch(0.55 0.16 42 / .2) 30px 32px, transparent 33px 58px); transform: perspective(500px) rotateX(25deg) scale(1.15); transform-origin: top; }
        .bf-fire-glow { left: 19%; bottom: 42%; width: 32%; height: 25%; background: radial-gradient(ellipse, oklch(0.95 0.22 70 / .75), oklch(0.78 0.2 45 / .24) 35%, transparent 70%); filter: blur(32px); animation: bf-sun-pulse 6s ease-in-out infinite; }
        @keyframes bf-sun-pulse { 0%, 100% { opacity: .65; transform: translateX(-50%) scale(.96); } 50% { opacity: .95; transform: translateX(-50%) scale(1.04); } }
        .bf-smoke { width: 46%; height: 30%; bottom: auto; top: 6%; border-radius: 50%; filter: blur(24px); opacity: .55; background: radial-gradient(ellipse, oklch(0.08 0.035 235 / .8), transparent 70%); animation: bf-cloud-drift 18s ease-in-out infinite; }
        .bf-smoke-a { left: 18%; }
        .bf-smoke-b { right: 8%; animation-duration: 23s; animation-delay: -8s; }
        @keyframes bf-cloud-drift { 0%, 100% { transform: translateX(-3%) scale(1); } 50% { transform: translateX(5%) scale(1.12); } }
        .bf-ember { background: oklch(0.94 0.18 65); box-shadow: 0 0 8px 2px oklch(0.75 0.2 45 / .85); }
        .bf-hero-kicker { color: oklch(0.82 0.16 55 / .9); }
        .bf-title { font-family: "MedievalSharp", Georgia, serif; font-weight: 400; letter-spacing: .035em; color: oklch(0.87 0.09 68); text-shadow: 2px 3px 0 oklch(0.22 0.06 30), 0 0 24px oklch(0.85 0.2 55 / .38); }
        .bf-subtitle { color: oklch(0.88 0.06 68 / .82); }
        .bf-panel { border-color: oklch(0.62 0.12 52 / .4) !important; background: linear-gradient(145deg, oklch(0.17 0.045 34 / .9), oklch(0.09 0.025 27 / .95)) !important; box-shadow: 0 20px 45px oklch(0.04 0.02 25 / .5), inset 0 1px oklch(0.9 0.12 60 / .09); }
        .bf-season-mark { border-color: oklch(0.72 0.16 58 / .7); background: linear-gradient(145deg, oklch(0.56 0.15 47 / .72), oklch(0.16 0.05 28 / .95)); box-shadow: 8px 8px 0 oklch(0.15 0.05 28 / .8), 0 0 34px oklch(0.75 0.18 55 / .32); }
        .bf-season-mark span, .bf-season-mark small { color: oklch(0.9 0.12 70 / .85); }
        .bf-season-mark b { color: oklch(0.96 0.1 73); font-family: Rockwell, "Roboto Slab", Georgia, serif; }
        .bf-featured-art { background: radial-gradient(circle at 24% 45%, oklch(0.88 0.2 65 / .7), transparent 18%), repeating-linear-gradient(165deg, oklch(0.32 0.1 40 / .9) 0 2px, transparent 2px 10px), linear-gradient(145deg, oklch(0.38 0.1 38), oklch(0.1 0.03 28)); }
        .bf-featured-body h2, .bf-track-heading h2 { font-family: Rockwell, "Roboto Slab", Georgia, serif; }
        .bf-command-label { color: oklch(0.8 0.15 58 / .9); }
        .bf-score-fill { background: linear-gradient(90deg, oklch(0.55 0.17 38), oklch(0.84 0.2 65), oklch(0.58 0.16 28)); box-shadow: 0 0 14px oklch(0.75 0.2 55 / .7); }
        .bf-card::before { border-color: oklch(0.78 0.16 58); box-shadow: 0 0 10px oklch(0.78 0.18 55 / .6); }
        .bf-rankup, .bf-claim-featured { color: oklch(0.15 0.04 28); background: linear-gradient(180deg, oklch(0.86 0.18 68), oklch(0.65 0.18 43)); border-color: oklch(0.9 0.2 70 / .8); }

        .bf-panel { border-color: oklch(0.4 0.15 20 / 0.35) !important; background: linear-gradient(180deg, oklch(0.1 0.02 20 / 0.9), oklch(0.06 0.01 15 / 0.95)) !important; }
        .bf-stat-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; padding: 16px; }
        .bf-stat { border-radius: 10px; border: 1px solid oklch(0.4 0.1 20 / 0.4); background: oklch(0.08 0.02 20 / 0.6); padding: 8px 14px; text-align: center; }
        .bf-stat-label { font: 700 9px ui-monospace, monospace; text-transform: uppercase; letter-spacing: 0.16em; color: oklch(0.7 0.02 40 / 0.6); }
        .bf-stat-value { font-family: ui-monospace, monospace; font-size: 1.15rem; margin-top: 2px; }
        .bf-stat-fire { color: oklch(0.75 0.2 30); text-shadow: 0 0 12px oklch(0.65 0.22 25 / 0.7); }
        .bf-stat-amber { color: oklch(0.82 0.16 75); }
        .bf-stat-cyan { color: oklch(0.8 0.12 210); }
        .bf-score-track { flex: 1; min-width: 220px; }
        .bf-score-bar { margin-top: 6px; height: 10px; border-radius: 999px; overflow: hidden; background: oklch(0.08 0.02 20 / 0.8); border: 1px solid oklch(0.4 0.1 20 / 0.4); }
        .bf-score-fill { height: 100%; background: linear-gradient(90deg, oklch(0.55 0.2 30), oklch(0.78 0.2 60), oklch(0.6 0.22 25)); background-size: 200% 100%; animation: bf-score-flicker 2.4s ease-in-out infinite; box-shadow: 0 0 14px oklch(0.65 0.22 30 / 0.7); }
        @keyframes bf-score-flicker { 0%, 100% { background-position: 0% 0; filter: brightness(1); } 50% { background-position: 100% 0; filter: brightness(1.25); } }
        .bf-rankup { border-radius: 10px; padding: 10px 18px; font-size: 0.85rem; font-weight: 600; color: #1b0b06; background: linear-gradient(180deg, oklch(0.82 0.18 55), oklch(0.62 0.22 30)); box-shadow: 0 0 18px oklch(0.62 0.22 30 / 0.6); transition: filter 0.2s ease; }
        .bf-rankup:disabled { opacity: 0.35; filter: grayscale(0.6); }
        .bf-rankup:not(:disabled):hover { filter: brightness(1.1); }

        .bf-track-panel { padding: 0; overflow: hidden; }
        .bf-pagebtn { border-radius: 8px; border: 1px solid oklch(0.4 0.1 20 / 0.4); padding: 8px; color: oklch(0.75 0.02 40 / 0.7); transition: background 0.15s ease; }
        .bf-pagebtn:hover:not(:disabled) { background: oklch(0.3 0.1 20 / 0.3); }
        .bf-pagebtn:disabled { opacity: 0.3; }

        .bf-card { position: relative; overflow: visible; border-radius: 12px; border: 1px solid oklch(0.4 0.1 20 / 0.4); background: linear-gradient(160deg, oklch(0.14 0.03 20 / 0.9), oklch(0.07 0.02 15 / 0.95)); padding: 12px; text-align: left; transition: transform 0.15s ease, box-shadow 0.2s ease; }
        .bf-card-ready:hover { transform: translateY(-3px); box-shadow: 0 10px 28px -10px oklch(0.6 0.2 25 / 0.6); }
        .bf-card-ready { border-color: oklch(0.55 0.2 30 / 0.7); }
        .bf-card-current { animation: bf-card-pulse 1.8s ease-in-out infinite; }
        @keyframes bf-card-pulse { 0%, 100% { box-shadow: 0 0 0 0 oklch(0.6 0.22 30 / 0.55); } 50% { box-shadow: 0 0 0 8px oklch(0.6 0.22 30 / 0); } }
        .bf-card-locked { opacity: 0.45; filter: grayscale(0.7); }
        .bf-card-claimed { border-color: oklch(0.6 0.15 150 / 0.6); background: linear-gradient(160deg, oklch(0.14 0.05 150 / 0.4), oklch(0.07 0.02 15 / 0.95)); }
        .bf-panel { border-color: oklch(0.62 0.12 52 / .4) !important; background: linear-gradient(145deg, oklch(0.17 0.045 34 / .9), oklch(0.09 0.025 27 / .95)) !important; box-shadow: 0 20px 45px oklch(0.04 0.02 25 / .5), inset 0 1px oklch(0.9 0.12 60 / .09); }

        .bf-reward-rail .bf-card { display: flex; align-items: center; min-height: 60px; width: 100%; margin: 4px 0; padding: 9px 12px 9px 0; border-radius: 0; border-width: 0 0 1px; border-color: oklch(0.35 0.08 20 / .45); background: transparent; text-align: left; transform: none !important; }
        .bf-reward-rail .bf-card-ready { border-color: oklch(0.35 0.08 20 / .45); }
        .bf-reward-rail .bf-card-claimed { border-color: oklch(0.35 0.08 20 / .45); background: linear-gradient(90deg, oklch(0.25 0.08 150 / .2), transparent); }
        .bf-reward-rail .bf-card-current { animation: bf-rail-pulse 1.8s ease-in-out infinite; }
        @keyframes bf-rail-pulse { 0%, 100% { box-shadow: inset 3px 0 oklch(0.65 0.18 30 / .35); } 50% { box-shadow: inset 6px 0 oklch(0.75 0.2 35 / .8); } }
        @media (max-width: 760px) {
          .bf-masthead { align-items: start; }
          .bf-season-mark { width: 82px; height: 82px; }
          .bf-season-mark b { font-size: 28px; }
          .bf-command-grid, .bf-track-layout { grid-template-columns: 1fr; }
          .bf-featured { position: relative; top: auto; }
          .bf-currency-stack { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 480px) {
          .bf-rank-panel { align-items: start; }
          .bf-rank-orbit { width: 86px; height: 86px; }
          .bf-rank-orbit strong { font-size: 32px; }
          .bf-currency-stack { grid-template-columns: 1fr; }
          .bf-row-copy b { font-size: 12px; }
          .bf-row-level { display: none; }
          .bf-reward-rail::before { left: 31px; }
          .bf-card::before { margin-left: 8px; margin-right: 17px; }
          .bf-card-drip { left: 57px; }
          .bf-card-drip-pool { left: 55px; }
        }

        @media (max-width: 900px) {
          .bf-frontier-head { grid-template-columns: 130px minmax(150px, 1fr) auto; }
          .bf-frontier-head .bf-rankup { grid-column: 1 / -1; }
          .bf-frontier-layout { grid-template-columns: 1fr; }
          .bf-drawer { min-height: 0; }
        }
        @media (max-width: 620px) {
          .bf-frontier-head { grid-template-columns: 1fr 1fr; gap: 12px; }
          .bf-frontier-progress { grid-column: 1 / -1; grid-row: 2; }
          .bf-frontier-wallet { justify-self: end; }
          .bf-map-heading { align-items: start; flex-direction: column; }
          .bf-track-controls { width: 100%; justify-content: space-between; }
          .bf-frontier-path { grid-template-columns: repeat(2, minmax(0, 1fr)); padding: 18px 10px; }
          .bf-path-line { top: 18px; bottom: 18px; left: 50%; right: auto; width: 2px; height: auto; background: linear-gradient(180deg, oklch(0.78 0.18 58 / .8), oklch(0.78 0.18 58 / .2)); }
          .bf-frontier-path .bf-card { min-height: 138px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .bf-ember, .bf-smoke, .bf-wind, .bf-desert-video, .bf-flying-sticker, .bf-fire-glow, .bf-card-drip, .bf-card-drip-pool, .bf-score-fill, .bf-card-current { animation: none !important; }
          .bf-sparkle-field { display: none; }
        }
      `}</style>
    </div>
  );
}

function FireSparkleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const count = 100_000;
    const positions = new Float32Array(count * 3);
    let seed = 0x9e3779b9;
    const random = () => {
      seed = Math.imul(seed ^ (seed >>> 15), seed | 1);
      seed ^= seed + Math.imul(seed ^ (seed >>> 7), seed | 61);
      return ((seed ^ (seed >>> 14)) >>> 0) / 4294967296;
    };
    for (let index = 0; index < count; index += 1) {
      const offset = index * 3;
      positions[offset] = random();
      positions[offset + 1] = random();
      positions[offset + 2] = 0.25 + random() * 1.75;
    }

    let frame = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * ratio);
      canvas.height = Math.floor(window.innerHeight * ratio);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const draw = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const time = performance.now() * 0.00045;
      context.clearRect(0, 0, width, height);
      for (let index = 0; index < count; index += 1) {
        const offset = index * 3;
        const twinkle = Math.sin(time * positions[offset + 2] + index * 0.017) * 0.5 + 0.5;
        const x = (positions[offset] * width + time * 4 * positions[offset + 2]) % width;
        const y = (positions[offset + 1] * height - time * 7 * positions[offset + 2]) % height;
        const radius = positions[offset + 2] > 1.55 ? 1 : 0.55;
        context.fillStyle = `rgba(255, ${125 + Math.floor(twinkle * 90)}, ${35 + Math.floor(twinkle * 45)}, ${0.08 + twinkle * 0.2})`;
        context.fillRect(x < 0 ? x + width : x, y < 0 ? y + height : y, radius, radius);
      }
      frame = window.setTimeout(draw, 100);
    };
    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.clearTimeout(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="bf-sparkle-field" aria-hidden />;
}
