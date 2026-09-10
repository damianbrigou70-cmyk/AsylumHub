/**
 * Ambient fire embers + drifting smoke.
 * Purely decorative, fixed behind all content, pointer-events: none.
 */

const EMBERS = Array.from({ length: 26 }, (_, i) => {
  const seed = (i * 9301 + 49297) % 233280;
  const r = seed / 233280;
  return {
    left: (r * 100).toFixed(2),
    size: (2 + ((i * 7) % 5)).toFixed(1),
    delay: ((i * 1.37) % 12).toFixed(2),
    duration: (9 + ((i * 3.1) % 9)).toFixed(2),
    drift: (((i % 7) - 3) * 26).toFixed(0),
    hue: i % 3 === 0 ? 88 : i % 3 === 1 ? 55 : 35,
  };
});

const SMOKE = Array.from({ length: 5 }, (_, i) => ({
  left: 8 + i * 21,
  delay: (i * 4.5).toFixed(1),
  duration: (26 + i * 5).toFixed(0),
  size: 320 + i * 70,
}));

export function EmberField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {SMOKE.map((s, i) => (
        <span
          key={`smoke-${i}`}
          className="ember-smoke"
          style={{
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        />
      ))}
      {EMBERS.map((e, i) => (
        <span
          key={`ember-${i}`}
          className="ember-spark"
          style={{
            left: `${e.left}%`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            background: `radial-gradient(circle, oklch(0.95 0.16 ${e.hue}) 0%, oklch(0.78 0.19 ${e.hue}) 45%, transparent 70%)`,
            boxShadow: `0 0 10px 2px oklch(0.8 0.18 ${e.hue} / 0.6)`,
            ["--ember-drift" as string]: `${e.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
