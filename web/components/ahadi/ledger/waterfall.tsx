import { pct, usd } from "@/lib/format"
import { ordinal, placeOutcomes } from "@/lib/ledger-data"
import type { FundView } from "@/lib/types"

/**
 * The derivation as a picture: the pool, split by the release rate into the award pool
 * and the reserve, then the award pool zoomed out into one bar per place. Before the
 * cutoff it draws what the rule fixes: the shares, with amounts still open.
 */
const W = 900
const L = 0
const R = 900
const BAR = 46

export function Waterfall({ fund }: { fund: FundView }) {
  const { rule, derivation: d, lines, placements } = fund
  const outcomes = placeOutcomes(lines)
  const released = d ? d.release_bp / 10000 : null
  const relW = released === null ? R - L : (R - L) * released
  const y1 = 30
  const y2 = 130
  const y3 = 252
  const H = 352
  const shares = rule.place_shares_bp
  const totalBp = shares.reduce((a, b) => a + b, 0)
  const awardCents = d?.award_cents ?? 0
  const placeSum = d ? d.place_cents.reduce((a, b) => a + b, 0) : 0
  const remainder = d ? awardCents - placeSum : 0

  // Row 3 bars: one per place across the full width (plus a sliver for any rounding remainder).
  const unit = d ? (R - L) / Math.max(awardCents, 1) : (R - L) / Math.max(totalBp, 1)
  const gap = 4
  const vals = shares.map((bp, i) => (d ? (d.place_cents[i] ?? 0) : bp))
  const bars = vals.map((v, i) => ({
    i,
    x: L + vals.slice(0, i).reduce((a, b) => a + b, 0) * unit,
    w: Math.max(v * unit - gap, 2),
    bp: shares[i],
    cents: d ? d.place_cents[i] : null,
  }))

  const desc = d
    ? `Prize pool ${usd(rule.pool_cents)}. ${d.eligible} of ${rule.target_teams} target teams qualified, so ${pct(d.release_bp)} is released: ${usd(awardCents)} for prizes and ${usd(d.reserve_cents)} reserve. ` +
      bars.map((b) => `${ordinal(b.i + 1)} place ${usd(b.cents ?? 0)}.`).join(" ")
    : `Prize pool ${usd(rule.pool_cents)}. The share released is set at the cutoff. Places split ${shares.map((bp, i) => `${ordinal(i + 1)} ${pct(bp)}`).join(", ")}.`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full font-sans" role="img" aria-labelledby="wf-title wf-desc">
      <title id="wf-title">How the pool becomes prizes</title>
      <desc id="wf-desc">{desc}</desc>
      <defs>
        <pattern id="wf-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="var(--note-soft)" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--note)" strokeOpacity="0.18" strokeWidth="2" />
        </pattern>
      </defs>

      {/* Row 1: the pool */}
      <text x={L} y={y1 - 10} fontSize={12} fill="var(--quiet)">
        Prize pool, from the rule
      </text>
      <rect x={L} y={y1} width={R - L} height={BAR} rx={8} fill="var(--ink)" />
      <text x={L + 16} y={y1 + 29} fontSize={16} fontWeight={600} fill="var(--paper)" className="tnum">
        {usd(rule.pool_cents)}
      </text>
      <text x={R - 16} y={y1 + 29} fontSize={12.5} fill="var(--paper)" opacity={0.7} textAnchor="end">
        {d ? `${d.eligible} of ${rule.target_teams} target teams qualified` : `Target ${rule.target_teams} eligible teams`}
      </text>

      {/* connector 1 to 2 */}
      <path d={`M${L},${y1 + BAR} L${L + relW},${y1 + BAR} L${L + relW},${y2} L${L},${y2} Z`} fill="var(--note)" opacity={0.08} />
      {d && relW < R - L && <path d={`M${L + relW},${y1 + BAR} L${R},${y1 + BAR} L${R},${y2} L${L + relW},${y2} Z`} fill="var(--carried)" opacity={0.08} />}
      <text x={L} y={y2 - 12} fontSize={12} fill="var(--quiet)">
        {d ? `Released ${pct(d.release_bp)}: min(100%, ${d.eligible} ÷ ${rule.target_teams})` : `Released: eligible teams ÷ ${rule.target_teams}, capped at 100%, set at the cutoff`}
      </text>

      {/* Row 2: award pool and reserve */}
      {d ? (
        <>
          <rect x={L} y={y2} width={relW - (relW < R - L ? 3 : 0)} height={BAR} rx={8} fill="var(--note)" />
          <text x={L + 16} y={y2 + 29} fontSize={15} fontWeight={600} fill="#fff" className="tnum">
            {usd(awardCents)} for prizes
          </text>
          {relW < R - L && (
            <>
              <rect x={L + relW + 3} y={y2} width={R - L - relW - 3} height={BAR} rx={8} fill="var(--carried)" />
              <text x={R - 16} y={y2 + 29} fontSize={15} fontWeight={600} fill="#fff" textAnchor="end" className="tnum">
                {usd(d.reserve_cents)} reserve, to the next event
              </text>
            </>
          )}
        </>
      ) : (
        <>
          <rect x={L + 1} y={y2} width={R - L - 2} height={BAR} rx={8} fill="url(#wf-hatch)" stroke="var(--note)" strokeOpacity={0.5} strokeDasharray="6 5" />
          <text x={L + 16} y={y2 + 29} fontSize={13.5} fill="var(--note-ink)">
            Award pool and reserve, worked out once eligible teams are attested
          </text>
        </>
      )}

      {/* connector 2 to 3: the award pool, zoomed out to full width */}
      <path d={`M${L},${y2 + BAR} L${L + relW - (d && relW < R - L ? 3 : 0)},${y2 + BAR} L${R},${y3} L${L},${y3} Z`} fill="var(--note)" opacity={0.06} />
      <text x={L} y={y3 - 12} fontSize={12} fill="var(--quiet)">
        {d ? `The ${usd(awardCents)} award pool, split between places` : "Split between places, as shares of the award pool"}
      </text>

      {/* Row 3: one bar per place */}
      {bars.map((b) => {
        const o = outcomes.get(b.i + 1)?.line
        const color = !d ? "var(--note)" : o?.kind === "paid" ? "var(--note)" : o?.kind === "held" ? "var(--held)" : o?.kind === "failed" ? "var(--failed)" : "var(--note)"
        const solid = d && o && (o.kind === "paid" || o.kind === "held")
        const team = placements?.find((p) => p.place === b.i + 1)?.team
        return (
          <g key={b.i}>
            <rect
              x={b.x}
              y={y3}
              width={b.w}
              height={BAR}
              rx={7}
              fill={solid ? color : "var(--card)"}
              stroke={color}
              strokeOpacity={solid ? 0 : 0.6}
              strokeDasharray={solid ? undefined : "5 4"}
            />
            <text x={b.x + 10} y={y3 + 20} fontSize={12.5} fontWeight={600} fill={solid ? "#fff" : "var(--ink)"}>
              {ordinal(b.i + 1)}
            </text>
            <text x={b.x + 10} y={y3 + 36} fontSize={11.5} fill={solid ? "#fff" : "var(--ink-2)"} opacity={solid ? 0.85 : 1}>
              {pct(b.bp)}
            </text>
            <text x={b.x + 2} y={y3 + BAR + 20} fontSize={13} fontWeight={600} fill="var(--ink)" className="tnum">
              {b.cents !== null ? usd(b.cents) : "Set at the cutoff"}
            </text>
            <text x={b.x + 2} y={y3 + BAR + 38} fontSize={11.5} fill="var(--ink-2)">
              {d ? (o?.kind === "paid" ? "Paid" : o?.kind === "held" ? "Held" : o?.kind === "failed" ? "Failed" : "Not paid yet") : ""}
              {d && team && b.w > 110 ? `, ${team.replace(/^Team /, "")}` : ""}
            </text>
          </g>
        )
      })}
      {remainder > 0 && (
        <text x={R} y={y3 + BAR + 20} fontSize={11.5} fill="var(--quiet)" textAnchor="end">
          +{usd(remainder)} rounding to reserve
        </text>
      )}
    </svg>
  )
}
