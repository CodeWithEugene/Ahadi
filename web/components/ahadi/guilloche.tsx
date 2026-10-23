import { cn } from "@/lib/utils"

/**
 * A banknote-style guilloché rosette, generated from hypotrochoid curves.
 * Deterministic (no randomness), so server and client render the same SVG.
 */
function curve(R: number, r: number, d: number, steps = 900, scale = 1): string {
  const pts: string[] = []
  const loops = r / gcd(Math.round(R), Math.round(r))
  const total = Math.PI * 2 * loops
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * total
    const x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t)
    const y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t)
    pts.push(`${(x * scale).toFixed(2)},${(y * scale).toFixed(2)}`)
  }
  return "M" + pts.join("L") + "Z"
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

const RINGS = [
  { R: 96, r: 36, d: 44, color: "var(--note)", w: 0.55, o: 0.55 },
  { R: 96, r: 30, d: 38, color: "var(--note)", w: 0.5, o: 0.35 },
  { R: 70, r: 26, d: 30, color: "var(--carried)", w: 0.45, o: 0.35 },
  { R: 120, r: 45, d: 20, color: "var(--note)", w: 0.4, o: 0.25 },
]

export function Guilloche({ className, draw = false }: { className?: string; draw?: boolean }) {
  return (
    <svg viewBox="-150 -150 300 300" aria-hidden className={cn(draw && "guilloche-draw", className)}>
      {RINGS.map((g, i) => (
        <path key={i} d={curve(g.R, g.r, g.d, 1400)} fill="none" stroke={g.color} strokeWidth={g.w} strokeOpacity={g.o} />
      ))}
    </svg>
  )
}

/** A thin guilloché band for the edge of a note. */
export function GuillocheBand({ className }: { className?: string }) {
  const waves: string[] = []
  for (let k = 0; k < 5; k++) {
    const pts: string[] = []
    for (let x = 0; x <= 600; x += 3) {
      const y = 10 + 6 * Math.sin(x / 9 + k * 1.3) * Math.cos(x / 41 + k)
      pts.push(`${x},${y.toFixed(2)}`)
    }
    waves.push("M" + pts.join("L"))
  }
  return (
    <svg viewBox="0 0 600 20" preserveAspectRatio="none" aria-hidden className={cn("h-5 w-full", className)}>
      {waves.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--note)" strokeOpacity={0.28} strokeWidth={0.6} />
      ))}
    </svg>
  )
}

const ORBIT_RINGS = [
  { R: 96, r: 36, d: 44, color: "var(--note)", w: 0.7, o: 0.75, z: 60, spin: 38, dir: 1 },
  { R: 96, r: 30, d: 38, color: "var(--note)", w: 0.6, o: 0.55, z: 20, spin: 52, dir: -1 },
  { R: 70, r: 26, d: 30, color: "var(--carried)", w: 0.6, o: 0.6, z: -20, spin: 30, dir: 1 },
  { R: 120, r: 45, d: 20, color: "var(--note)", w: 0.5, o: 0.45, z: -60, spin: 70, dir: -1 },
  { R: 84, r: 21, d: 34, color: "var(--agent)", w: 0.45, o: 0.35, z: 100, spin: 46, dir: 1 },
  { R: 84, r: 21, d: 34, color: "var(--organiser)", w: 0.45, o: 0.35, z: -100, spin: 46, dir: -1 },
]

/**
 * The guilloché rosette as a slowly turning 3D object: each ring is its own layer at a
 * different depth, spinning at its own speed, while the whole stack tilts in perspective.
 * Pure CSS transforms (no canvas), and fully still when the viewer prefers reduced motion.
 */
export function GuillocheOrbit({ className }: { className?: string }) {
  return (
    <div className={cn("guilloche-orbit pointer-events-none", className)} aria-hidden>
      <div className="guilloche-orbit-stage">
        {ORBIT_RINGS.map((g, i) => (
          <svg
            key={i}
            viewBox="-150 -150 300 300"
            className="guilloche-orbit-ring"
            style={{ "--z": `${g.z}px`, "--spin": `${g.spin}s`, "--dir": g.dir === 1 ? "normal" : "reverse" } as React.CSSProperties}
          >
            <path d={curve(g.R, g.r, g.d, 1400)} fill="none" stroke={g.color} strokeWidth={g.w} strokeOpacity={g.o} />
          </svg>
        ))}
      </div>
    </div>
  )
}
