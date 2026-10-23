import { KIND } from "@/components/ahadi/status"
import { usd } from "@/lib/format"
import type { Line, LineKind } from "@/lib/types"

/**
 * The ledger as lanes: one column per line, one lane per actor. A column joins every
 * actor who took part, so a payout reads as Ahadi proposing, the organiser signing and
 * Stellar settling, while a refusal never leaves Ahadi's lane.
 */

const LANES = [
  { id: "people", label: "Winners and sponsors", sub: "Messages, deposits", color: "var(--quiet)" },
  { id: "agent", label: "Ahadi", sub: "Derives, proposes, refuses", color: "var(--agent)" },
  { id: "organiser", label: "Organiser", sub: "Publishes, attests, signs", color: "var(--organiser)" },
  { id: "stellar", label: "Stellar testnet", sub: "Settles or refuses", color: "var(--ink)" },
] as const
type Lane = (typeof LANES)[number]["id"]

const TONE: Record<string, string> = {
  ink: "var(--ink)",
  note: "var(--note)",
  organiser: "var(--organiser)",
  agent: "var(--agent)",
  held: "var(--held)",
  failed: "var(--failed)",
  rejected: "var(--rejected)",
  quiet: "var(--quiet)",
  carried: "var(--carried)",
}

function involved(l: Line): { lanes: Lane[]; outcome: Lane } {
  const fromPeople = l.detail?.source === "telegram" || l.detail?.source === "whatsapp"
  const m: Record<LineKind, { lanes: Lane[]; outcome: Lane }> = {
    rule: { lanes: ["agent", "organiser", "stellar"], outcome: "stellar" },
    received: { lanes: ["people", "stellar"], outcome: "stellar" },
    attested: { lanes: ["agent", "organiser"], outcome: "organiser" },
    control: { lanes: ["agent", "stellar"], outcome: "stellar" },
    paid: { lanes: ["agent", "organiser", "stellar"], outcome: "stellar" },
    held: { lanes: ["agent", "organiser", "stellar"], outcome: "stellar" },
    failed: { lanes: ["agent", "organiser", "stellar"], outcome: "stellar" },
    rejected: { lanes: fromPeople ? ["people", "agent"] : ["agent"], outcome: "agent" },
    duplicate: { lanes: fromPeople ? ["people", "agent"] : ["agent"], outcome: "agent" },
    carried_out: { lanes: ["agent", "organiser", "stellar"], outcome: "stellar" },
    carried_in: { lanes: ["stellar"], outcome: "stellar" },
    returned: { lanes: ["stellar"], outcome: "stellar" },
  }
  return m[l.kind] ?? { lanes: ["agent"], outcome: "agent" }
}

function wrap(label: string): string[] {
  const words = label.split(" ")
  if (label.length <= 12 || words.length === 1) return [label]
  const half = Math.ceil(words.length / 2)
  return [words.slice(0, half).join(" "), words.slice(half).join(" ")]
}

const LABEL_W = 210
const COL = 84
const LANE_Y0 = 46
const LANE_H = 62

export function LedgerTimeline({ lines }: { lines: Line[] }) {
  const ordered = [...lines].sort((a, b) => a.seq - b.seq)
  const width = LABEL_W + Math.max(ordered.length, 4) * COL + 20
  const laneY = (id: Lane) => LANE_Y0 + LANES.findIndex((x) => x.id === id) * LANE_H
  const axisY = LANE_Y0 + LANES.length * LANE_H - 18
  const H = axisY + 78

  return (
    <svg viewBox={`0 0 ${width} ${H}`} width={width} className="mx-auto block h-auto max-w-none font-sans" role="img" aria-labelledby="tl-title tl-desc">
      <title id="tl-title">The ledger as a timeline of who acted</title>
      <desc id="tl-desc">{ordered.map((l) => `Line ${l.seq}: ${KIND[l.kind]?.label ?? l.kind}${l.party ? `, ${l.party}` : ""}.`).join(" ")}</desc>

      {LANES.map((ln, i) => (
        <g key={ln.id}>
          {i % 2 === 0 && <rect x={0} y={laneY(ln.id) - LANE_H / 2} width={width} height={LANE_H} fill="var(--paper)" opacity={0.7} />}
          <circle cx={14} cy={laneY(ln.id) - 7} r={5} fill={ln.color} />
          <text x={28} y={laneY(ln.id) - 3} fontSize={13} fontWeight={600} fill="var(--ink)">
            {ln.label}
          </text>
          <text x={28} y={laneY(ln.id) + 14} fontSize={11.5} fill="var(--quiet)">
            {ln.sub}
          </text>
          <line x1={LABEL_W - 16} x2={width - 10} y1={laneY(ln.id)} y2={laneY(ln.id)} stroke="var(--hair)" />
        </g>
      ))}

      {ordered.map((l, i) => {
        const cx = LABEL_W + i * COL + COL / 2
        const { lanes, outcome } = involved(l)
        const k = KIND[l.kind]
        const color = TONE[k?.tone ?? "quiet"]
        const ys = lanes.map(laneY)
        const top = Math.min(...ys)
        const bottom = Math.max(...ys)
        const refused = l.kind === "control" || l.kind === "failed"
        const label = wrap(k?.label ?? l.kind)
        const amount = l.amount_cents ? usd(l.amount_cents, { code: false }) : ""
        return (
          <a key={l.id} href={`/receipt/${l.id}`} aria-label={`Line ${l.seq}, ${k?.label ?? l.kind}${l.party ? `, ${l.party}` : ""}. Open the receipt`} className="group">
            <title>{`Line ${l.seq}: ${k?.label ?? l.kind}${l.party ? `, ${l.party}` : ""}${l.amount_cents ? `, ${usd(l.amount_cents)}` : ""}`}</title>
            <rect x={cx - COL / 2 + 4} y={LANE_Y0 - LANE_H / 2 + 4} width={COL - 8} height={H - LANE_Y0 + LANE_H / 2 - 12} rx={10} fill="var(--note)" opacity={0} className="transition-opacity group-hover:opacity-[0.06] group-focus-visible:opacity-[0.1]" />
            {top !== bottom && <line x1={cx} x2={cx} y1={top} y2={bottom} stroke={color} strokeWidth={2} strokeOpacity={0.55} />}
            {lanes.map((ln) => {
              const y = laneY(ln)
              const isOut = ln === outcome
              if (!isOut) return <circle key={ln} cx={cx} cy={y} r={4.5} fill="var(--card)" stroke={LANES.find((x) => x.id === ln)!.color} strokeWidth={2} />
              return (
                <g key={ln}>
                  <circle cx={cx} cy={y} r={11} fill={color} />
                  {refused ? (
                    <path d={`M${cx - 4},${y - 4} L${cx + 4},${y + 4} M${cx + 4},${y - 4} L${cx - 4},${y + 4}`} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                  ) : l.kind === "rejected" || l.kind === "duplicate" ? (
                    <path d={`M${cx - 4.5},${y} L${cx + 4.5},${y}`} stroke="#fff" strokeWidth={2} strokeLinecap="round" />
                  ) : (
                    <path d={`M${cx - 4.5},${y + 0.5} L${cx - 1.2},${y + 3.8} L${cx + 4.8},${y - 3}`} fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </g>
              )
            })}
            <text x={cx} y={axisY + 4} fontSize={11} fill="var(--quiet)" textAnchor="middle" className="tnum">
              {l.seq}
            </text>
            {label.map((t, j) => (
              <text key={j} x={cx} y={axisY + 22 + j * 14} fontSize={11.5} fontWeight={j === 0 ? 600 : 400} fill="var(--ink)" textAnchor="middle" className="group-hover:underline">
                {t}
              </text>
            ))}
            {amount && (
              <text x={cx} y={axisY + 22 + label.length * 14} fontSize={11} fill="var(--ink-2)" textAnchor="middle" className="tnum">
                {amount}
              </text>
            )}
          </a>
        )
      })}
    </svg>
  )
}
