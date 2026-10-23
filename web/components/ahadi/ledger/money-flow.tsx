import { short, usd } from "@/lib/format"
import type { FundView, Line } from "@/lib/types"

/**
 * The chain of funds as one Sankey-style picture, drawn from real ledger lines:
 * deposits flow into the first fund, out to each winner, and the reserve flows on
 * into the next fund. Every outflow links to its receipt.
 */

const NODE_W = 12
const BOX_W = 196
const SLOT_MIN = 50
const GAP = 14
const TOP = 34

/** Column positions, spread so the picture fills its width whether or not the second fund has outflows yet. */
function columns(threeCols: boolean) {
  return threeCols
    ? { src: 200, fund0: 360, out0: 790, out1: 1170, W: 1420 }
    : { src: 190, fund0: 360, out0: 820, out1: 820, W: 1080 }
}

type Out = {
  key: string
  value: number
  color: string
  title: string
  sub: string
  tx?: string | null
  href?: string
  hatched?: boolean
  planned?: boolean
}

const ORD = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
]

/**
 * What left (or, from the rule, will leave) a fund. Before payouts settle, places the
 * derivation has fixed appear as planned outflows, and so does the reserve.
 */
function outflows(
  f: FundView,
  nextId: string | null,
  nextName: string | null = null
): { outs: Out[]; carry: { value: number; line: Line | null } | null } {
  const outs: Out[] = []
  let carry: { value: number; line: Line | null } | null = null
  const ls = f.lines
  const settledPlaces = new Set<number>()
  for (const l of ls
    .filter((x) => x.kind === "paid")
    .sort((a, b) => (a.detail?.place ?? 99) - (b.detail?.place ?? 99))) {
    if (typeof l.detail?.place === "number") settledPlaces.add(l.detail.place)
    outs.push({
      key: l.id,
      value: l.amount_cents,
      color: "var(--note)",
      title: l.party ?? "Winner",
      sub: `${usd(l.amount_cents)} paid`,
      tx: l.tx_hash,
      href: `/receipt/${l.id}`,
    })
  }
  for (const l of ls.filter((x) => x.kind === "held")) {
    if (typeof l.detail?.place === "number") settledPlaces.add(l.detail.place)
    outs.push({
      key: l.id,
      value: l.amount_cents,
      color: "var(--held)",
      title: l.party ?? "Winner",
      sub: `${usd(l.amount_cents)} held for them`,
      tx: l.tx_hash,
      href: `/receipt/${l.id}`,
    })
  }
  let left = f.totals.available_cents
  // Places the rule has fixed but that have not settled yet.
  const d = f.derivation
  if (d && f.event.status !== "closed") {
    d.place_cents.forEach((cents, i) => {
      const place = i + 1
      if (settledPlaces.has(place) || cents <= 0 || left < cents) return
      const team = f.placements?.find((p) => p.place === place)?.team
      outs.push({
        key: `${f.event.event_id}-plan-${place}`,
        value: cents,
        color: "var(--note)",
        title: team ?? `${ORD[i] ?? place} place`,
        sub: `${usd(cents)}, not paid yet`,
        planned: true,
      })
      left -= cents
    })
  }
  for (const l of ls.filter((x) => x.kind === "carried_out")) {
    if (nextId && (l.party === nextId || l.party === nextName)) carry = { value: l.amount_cents, line: l }
    else
      outs.push({
        key: l.id,
        value: l.amount_cents,
        color: "var(--carried)",
        title: "Carried forward",
        sub: usd(l.amount_cents),
        tx: l.tx_hash,
        href: `/receipt/${l.id}`,
      })
  }
  // The reserve the rule will carry forward at close.
  if (!carry && d && nextId && d.reserve_cents > 0 && left >= d.reserve_cents) {
    carry = { value: d.reserve_cents, line: null }
    left -= d.reserve_cents
  }
  if (left > 0) {
    outs.push({
      key: `${f.event.event_id}-avail`,
      value: left,
      color: "var(--quiet)",
      title: "In the fund now",
      sub: usd(left),
      hatched: true,
    })
  }
  return { outs, carry }
}

function inflow(f: FundView) {
  return (
    f.totals.received_cents +
    f.totals.carried_in_cents +
    f.totals.returned_cents
  )
}

function ribbon(x0: number, y0: number, x1: number, y1: number, h: number) {
  const xm = (x0 + x1) / 2
  return `M${x0},${y0} C${xm},${y0} ${xm},${y1} ${x1},${y1} L${x1},${y1 + h} C${xm},${y1 + h} ${xm},${y0 + h} ${x0},${y0 + h} Z`
}

type Placed = Out & { y: number; h: number; slotY: number; slotH: number }

/** Running starts: start, start + a, start + a + b, ... (one per value). */
function starts(values: number[], start: number): number[] {
  return values.reduce<number[]>(
    (acc, _v, i) => [...acc, i === 0 ? start : acc[i - 1] + values[i - 1]],
    []
  )
}

function stack(items: Out[], k: number, startY: number): Placed[] {
  const hs = items.map((o) => Math.max(o.value * k, 3))
  const slots = hs.map((h) => Math.max(h, SLOT_MIN))
  const ys = starts(
    slots.map((sh) => sh + GAP),
    startY
  )
  return items.map((o, i) => ({
    ...o,
    h: hs[i],
    slotY: ys[i],
    slotH: slots[i],
    y: ys[i] + (slots[i] - hs[i]) / 2,
  }))
}

export function MoneyFlow({ funds }: { funds: FundView[] }) {
  const f0 = funds[0]
  const f1 = funds[1] ?? null
  if (!f0) return null
  const in0 = inflow(f0)
  const in1 = f1 ? inflow(f1) : 0
  const k = 440 / Math.max(in0, in1, 1)

  const { outs: outs0, carry } = outflows(f0, f1?.event.event_id ?? null, f1?.event.name ?? null)
  const { outs: outs1 } = f1 ? outflows(f1, null) : { outs: [] }
  const X = columns(outs1.length > 0)
  const W = X.W

  // Column 0: deposits into the first fund, grouped by sender.
  const bySender = new Map<string, number>()
  for (const l of f0.lines.filter((x) => x.kind === "received"))
    bySender.set(
      l.party ?? "Sponsor",
      (bySender.get(l.party ?? "Sponsor") ?? 0) + l.amount_cents
    )
  const sources: Out[] = [...bySender].map(([p, v]) => ({
    key: p,
    value: v,
    color: "var(--note)",
    title: p,
    sub: usd(v),
  }))

  // Column 2: the first fund's outflows, then the next fund (fed by the carry).
  const placedOut0 = stack(outs0, k, TOP)
  const lastOut0 = placedOut0[placedOut0.length - 1]
  const f1Y = lastOut0 ? lastOut0.slotY + lastOut0.slotH + GAP * 2 : TOP
  const in1Shown = Math.max(in1, carry && !carry.line ? in1 + carry.value : in1)
  const f1H = f1 ? Math.max(in1Shown * k, 92) : 0

  const f0H = Math.max(in0 * k, 92)
  const col2Bottom = f1
    ? f1Y + f1H
    : lastOut0
      ? lastOut0.slotY + lastOut0.slotH
      : TOP + 92
  const f0Y = Math.max(
    TOP,
    Math.min((col2Bottom - TOP) / 2 + TOP - f0H / 2, TOP + 40)
  )

  const srcTotalH = sources.reduce(
    (s, o) => s + Math.max(o.value * k, SLOT_MIN) + GAP,
    -GAP
  )
  const placedSrc = stack(sources, k, f0Y + Math.max(0, (f0H - srcTotalH) / 2))

  const placedOut1 = stack(
    outs1,
    k,
    f1Y +
      Math.max(
        0,
        (f1H -
          outs1.reduce(
            (s, o) => s + Math.max(o.value * k, SLOT_MIN) + GAP,
            -GAP
          )) /
          2
      )
  )
  const H =
    Math.max(
      col2Bottom,
      f0Y + f0H,
      ...placedOut1.map((p) => p.slotY + p.slotH)
    ) + 70

  // Where each ribbon leaves the first fund's box (stacked in the same order as the targets).
  const base0 = f0Y + (f0H - in0 * k) / 2
  const leave0 = starts(
    placedOut0.map((p) => p.value * k),
    base0
  )
  const carryY0 = base0 + placedOut0.reduce((a, p) => a + p.value * k, 0)
  const carryH = carry ? carry.value * k : 0
  const enter0 = starts(
    placedSrc.map((p) => p.value * k),
    base0
  )
  const f1InnerTop = f1 ? f1Y + (f1H - in1Shown * k) / 2 : 0
  const leave1 = starts(
    placedOut1.map((p) => p.value * k),
    f1InnerTop
  )

  const desc = [
    `${f0.event.name} received ${usd(in0)}.`,
    ...outs0.map((o) => `${o.title}: ${o.sub}.`),
    carry && f1
      ? `${usd(carry.value)} ${carry.line ? "carried" : "to be carried"} forward to ${f1.event.name}.`
      : "",
    ...outs1.map((o) => `${f1?.event.name}: ${o.title} ${o.sub}.`),
  ].join(" ")

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block h-auto w-full font-sans"
      role="img"
      aria-labelledby="flow-title flow-desc"
    >
      <title id="flow-title">Where the prize money went</title>
      <desc id="flow-desc">{desc}</desc>
      <defs>
        <pattern
          id="flow-hatch"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width="6" height="6" fill="var(--paper-2)" />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="6"
            stroke="var(--hair)"
            strokeWidth="2"
          />
        </pattern>
      </defs>

      {/* column headings */}
      <g fontSize={12} fill="var(--quiet)">
        <text x={X.src + NODE_W} y={16} textAnchor="end">
          Came in
        </text>
        <text x={X.fund0} y={16}>
          {f0.event.short ?? f0.event.name} fund
        </text>
        <text x={X.out0} y={16}>
          {outs0.some((o) => o.planned) || (carry && !carry.line)
            ? "Out, paid or set by the rule"
            : "Went out"}
        </text>
        {f1 && outs1.length > 0 && (
          <text x={X.out1} y={16}>
            From {f1.event.short ?? f1.event.name}
          </text>
        )}
      </g>

      {/* ribbons: deposits into fund 0 */}
      {placedSrc.map((p, i) => (
        <path
          key={p.key}
          d={ribbon(X.src + NODE_W, p.y, X.fund0, enter0[i], p.value * k)}
          fill="var(--note)"
          fillOpacity={0.16}
        />
      ))}
      {/* ribbons: fund 0 outflows */}
      {placedOut0.map((p, i) => (
        <path
          key={p.key}
          d={ribbon(X.fund0 + BOX_W, leave0[i], X.out0, p.y, p.value * k)}
          fill={p.hatched ? "url(#flow-hatch)" : p.color}
          fillOpacity={p.hatched ? 1 : p.planned ? 0.07 : 0.26}
          stroke={p.planned ? p.color : "none"}
          strokeOpacity={0.45}
          strokeDasharray="5 5"
        />
      ))}
      {/* the carry, fund 0 to fund 1 */}
      {carry && f1 && (
        <path
          d={ribbon(X.fund0 + BOX_W, carryY0, X.out0, f1InnerTop, carryH)}
          fill="var(--carried)"
          fillOpacity={carry.line ? 0.3 : 0.08}
          stroke={carry.line ? "none" : "var(--carried)"}
          strokeDasharray="5 5"
          strokeOpacity={0.6}
        />
      )}
      {/* ribbons: fund 1 outflows */}
      {placedOut1.map((p, i) => (
        <path
          key={p.key}
          d={ribbon(X.out0 + BOX_W, leave1[i], X.out1, p.y, p.value * k)}
          fill={p.hatched ? "url(#flow-hatch)" : p.color}
          fillOpacity={p.hatched ? 1 : p.planned ? 0.07 : 0.26}
          stroke={p.planned ? p.color : "none"}
          strokeOpacity={0.45}
          strokeDasharray="5 5"
        />
      ))}

      {/* sources */}
      {placedSrc.map((p) => (
        <g key={p.key}>
          <rect
            x={X.src}
            y={p.y}
            width={NODE_W}
            height={p.h}
            rx={3}
            fill="var(--note)"
          />
          <text
            x={X.src - 10}
            y={p.y + p.h / 2 - 3}
            textAnchor="end"
            fontSize={13}
            fontWeight={600}
            fill="var(--ink)"
          >
            {p.title}
          </text>
          <text
            x={X.src - 10}
            y={p.y + p.h / 2 + 14}
            textAnchor="end"
            fontSize={12}
            fill="var(--ink-2)"
            className="tnum"
          >
            {p.sub}
          </text>
        </g>
      ))}
      {placedSrc.length === 0 && (
        <text
          x={X.src + NODE_W}
          y={f0Y + f0H / 2}
          textAnchor="end"
          fontSize={12.5}
          fill="var(--quiet)"
        >
          No deposit yet
        </text>
      )}

      <FundBox x={X.fund0} y={f0Y} h={f0H} f={f0} value={in0} />
      {f1 && (
        <FundBox
          x={X.out0}
          y={f1Y}
          h={f1H}
          f={f1}
          value={in1}
          carriedIn
          plannedIn={carry && !carry.line ? carry.value : 0}
          fromShort={f0.event.short ?? f0.event.name}
        />
      )}

      {/* carry receipt on the ribbon */}
      {carry && f1 && (
        <CarryTag
          x={(X.fund0 + BOX_W + X.out0) / 2 - 92}
          y={(carryY0 + f1InnerTop) / 2 + carryH / 2 - 26}
          value={carry.value}
          line={carry.line}
        />
      )}

      {/* outflow nodes and labels */}
      {[
        ...placedOut0.map((p) => ({ p, x: X.out0 })),
        ...placedOut1.map((p) => ({ p, x: X.out1 })),
      ].map(({ p, x }) => {
        const body = (
          <g>
            <rect
              x={x}
              y={p.y}
              width={NODE_W}
              height={p.h}
              rx={3}
              fill={
                p.hatched
                  ? "url(#flow-hatch)"
                  : p.planned
                    ? "var(--card)"
                    : p.color
              }
              stroke={p.hatched ? "var(--hair)" : p.planned ? p.color : "none"}
              strokeDasharray={p.planned ? "3 3" : undefined}
            />
            <text
              x={x + NODE_W + 10}
              y={p.slotY + p.slotH / 2 - (p.tx ? 9 : 2)}
              fontSize={13}
              fontWeight={600}
              fill={p.planned ? "var(--ink-2)" : "var(--ink)"}
            >
              {p.title}
            </text>
            <text
              x={x + NODE_W + 10}
              y={p.slotY + p.slotH / 2 + (p.tx ? 7 : 14)}
              fontSize={12}
              fill="var(--ink-2)"
              className="tnum"
            >
              {p.sub}
            </text>
            {p.tx && (
              <text
                x={x + NODE_W + 10}
                y={p.slotY + p.slotH / 2 + 22}
                fontSize={11}
                fill="var(--note)"
                fontFamily="var(--font-mono)"
              >
                {short(p.tx, 6, 4)}
              </text>
            )}
          </g>
        )
        return p.href ? (
          <a
            key={p.key}
            href={p.href}
            aria-label={`${p.title}, ${p.sub}. Open the receipt`}
            className="[&:focus-visible_text]:underline [&:hover_text]:underline"
          >
            {body}
          </a>
        ) : (
          <g key={p.key}>{body}</g>
        )
      })}
      {/* legend */}
      <g
        transform={`translate(${(W - 640) / 2}, ${H - 26})`}
        fontSize={12}
        fill="var(--ink-2)"
      >
        <rect
          width={26}
          height={10}
          y={-9}
          rx={3}
          fill="var(--note)"
          fillOpacity={0.35}
        />
        <text x={34}>Settled, with a receipt</text>
        <rect
          x={210}
          width={26}
          height={10}
          y={-9}
          rx={3}
          fill="var(--note)"
          fillOpacity={0.07}
          stroke="var(--note)"
          strokeOpacity={0.5}
          strokeDasharray="4 3"
        />
        <text x={244}>Planned by the rule, not settled yet</text>
        <rect
          x={500}
          width={26}
          height={10}
          y={-9}
          rx={3}
          fill="url(#flow-hatch)"
          stroke="var(--hair)"
        />
        <text x={534}>Still in the fund</text>
      </g>
    </svg>
  )
}

function FundBox({
  x,
  y,
  h,
  f,
  value,
  carriedIn = false,
  plannedIn = 0,
  fromShort = "the previous event",
}: {
  x: number
  y: number
  h: number
  f: FundView
  value: number
  carriedIn?: boolean
  plannedIn?: number
  fromShort?: string
}) {
  const empty = value === 0
  const fromName = fromShort.split(" ")[0]
  const d = f.derivation
  const facts: [string, string][] = []
  if (d) {
    facts.push([
      `Released ${(d.release_bp / 100).toFixed(0)}%`,
      usd(d.award_cents),
    ])
    facts.push(["Reserve", usd(d.reserve_cents)])
  } else {
    facts.push(["Target", `${f.rule.target_teams} teams`])
  }
  if (f.totals.paid_cents) facts.push(["Paid", usd(f.totals.paid_cents)])
  return (
    <a
      href={`/funds/${f.event.event_id}`}
      aria-label={`Open the ${f.event.name} ledger`}
    >
      <rect
        x={x}
        y={y}
        width={BOX_W}
        height={h}
        rx={12}
        fill="var(--card)"
        stroke={
          empty ? "var(--hair)" : carriedIn ? "var(--carried)" : "var(--note)"
        }
        strokeWidth={1.4}
        strokeDasharray={empty ? "6 5" : undefined}
      />
      <rect
        x={x}
        y={y}
        width={5}
        height={h}
        rx={2.5}
        fill={carriedIn ? "var(--carried)" : "var(--note)"}
        opacity={empty ? 0.3 : 1}
      />
      <text
        x={x + 18}
        y={y + 26}
        fontSize={13.5}
        fontWeight={600}
        fill="var(--ink)"
      >
        {f.event.short ?? f.event.name}
      </text>
      <text
        x={x + 18}
        y={y + 50}
        fontSize={18}
        fontWeight={600}
        fill="var(--ink)"
        className="tnum"
        fontFamily="var(--font-display)"
      >
        {empty ? usd(plannedIn || f.rule.pool_cents) : usd(value)}
      </text>
      <text x={x + 18} y={y + 70} fontSize={11.5} fill="var(--ink-2)">
        {empty
          ? carriedIn
            ? "Opens with the reserve"
            : "Pool per the rule"
          : carriedIn
            ? `Carried in from ${fromName}`
            : "2 of 2 vault on testnet"}
      </text>
      {empty && carriedIn && (
        <text x={x + 18} y={y + 86} fontSize={11.5} fill="var(--ink-2)">
          when {fromName} closes
        </text>
      )}
      {h > 170 && (
        <g fontSize={11.5}>
          <line
            x1={x + 18}
            x2={x + BOX_W - 16}
            y1={y + 98}
            y2={y + 98}
            stroke="var(--hair)"
          />
          {facts.map(([k, v], i) => (
            <g key={k}>
              <text x={x + 18} y={y + 120 + i * 20} fill="var(--quiet)">
                {k}
              </text>
              <text
                x={x + BOX_W - 16}
                y={y + 120 + i * 20}
                fill="var(--ink)"
                textAnchor="end"
                className="tnum"
              >
                {v}
              </text>
            </g>
          ))}
          {f.event.rule_hash && h > 120 + facts.length * 20 + 50 && (
            <>
              <text
                x={x + 18}
                y={y + 120 + facts.length * 20 + 14}
                fill="var(--quiet)"
              >
                Rule fingerprint
              </text>
              <text
                x={x + 18}
                y={y + 120 + facts.length * 20 + 32}
                fill="var(--ink-2)"
                fontFamily="var(--font-mono)"
                fontSize={11}
              >
                {short(f.event.rule_hash, 8, 6)}
              </text>
            </>
          )}
        </g>
      )}
    </a>
  )
}

function CarryTag({
  x,
  y,
  value,
  line,
}: {
  x: number
  y: number
  value: number
  line: Line | null
}) {
  const tag = (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        width={184}
        height={52}
        rx={10}
        fill="var(--card)"
        stroke="var(--carried)"
        strokeOpacity={0.5}
        strokeDasharray={line ? undefined : "4 4"}
      />
      <text
        x={14}
        y={21}
        fontSize={12.5}
        fontWeight={600}
        fill="var(--carried)"
      >
        {usd(value)} {line ? "carried" : "reserve"}
      </text>
      <text
        x={14}
        y={39}
        fontSize={11.5}
        fill="var(--ink-2)"
        fontFamily={line ? "var(--font-mono)" : undefined}
      >
        {line
          ? `${short(line.tx_hash, 6, 4)} receipt`
          : "Carried forward at close"}
      </text>
    </g>
  )
  return line ? (
    <a
      href={`/receipt/${line.id}`}
      aria-label={`Carry forward receipt, ${usd(value)}`}
    >
      {tag}
    </a>
  ) : (
    tag
  )
}

/** The same flows for narrow screens: a vertical statement, top to bottom, with bars to scale. */
export function MoneyFlowList({ funds }: { funds: FundView[] }) {
  const f0 = funds[0]
  const f1 = funds[1] ?? null
  if (!f0) return null
  const { outs: outs0, carry } = outflows(f0, f1?.event.event_id ?? null, f1?.event.name ?? null)
  const { outs: outs1 } = f1 ? outflows(f1, null) : { outs: [] as Out[] }
  const in0 = inflow(f0)
  const senders = f0.lines.filter((l) => l.kind === "received")

  return (
    <div className="space-y-3">
      {senders.length > 0 && (
        <div className="text-center text-sm text-ink-2">
          {senders.map((l) => (
            <div key={l.id}>
              <span className="font-medium text-ink">{l.party}</span> deposited{" "}
              <span className="tnum">{usd(l.amount_cents)}</span>
            </div>
          ))}
          <div className="mx-auto mt-2 h-5 w-px bg-note/40" aria-hidden />
        </div>
      )}
      <FundHead
        f={f0}
        value={in0 || f0.rule.pool_cents}
        sub={
          in0
            ? "2 of 2 vault on testnet"
            : "Pool per the rule, not deposited yet"
        }
      />
      {outs0.length > 0 && (
        <div className="rounded-xl border bg-card px-4 py-1">
          {outs0.map((o) => (
            <FlowRow key={o.key} o={o} total={in0} />
          ))}
        </div>
      )}
      {f1 && (
        <>
          {carry && (
            <div className="flex flex-col items-center gap-1 py-1 text-center text-sm">
              <span className="h-4 w-px bg-carried/50" aria-hidden />
              {carry.line ? (
                <a
                  href={`/receipt/${carry.line.id}`}
                  className="rounded-lg border border-carried/40 bg-carried-soft px-3 py-1.5 font-medium text-carried"
                >
                  {usd(carry.value)} carried forward,{" "}
                  <span className="hash">
                    {short(carry.line.tx_hash, 6, 4)}
                  </span>
                </a>
              ) : (
                <span className="rounded-lg border border-dashed border-carried/50 px-3 py-1.5 text-carried">
                  {usd(carry.value)} reserve, carried forward at close
                </span>
              )}
              <span className="h-4 w-px bg-carried/50" aria-hidden />
            </div>
          )}
          <FundHead
            f={f1}
            value={inflow(f1) || carry?.value || f1.rule.pool_cents}
            sub={
              inflow(f1)
                ? "Opened with the reserve"
                : "Opens with the reserve when the previous event closes"
            }
          />
          {outs1.length > 0 && (
            <div className="rounded-xl border bg-card px-4 py-1">
              {outs1.map((o) => (
                <FlowRow key={o.key} o={o} total={inflow(f1)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function FlowRow({ o, total }: { o: Out; total: number }) {
  const body = (
    <div className="py-2.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className={o.planned ? "text-ink-2" : "font-medium"}>
          {o.title}
        </span>
        <span className="tnum shrink-0 text-ink-2">{o.sub}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-paper-2">
        <div
          className="h-2 rounded-full"
          style={{
            width: `${Math.max((o.value / Math.max(total, 1)) * 100, 2)}%`,
            background: o.hatched
              ? "repeating-linear-gradient(135deg, var(--paper-2) 0 4px, var(--hair) 4px 5px)"
              : o.planned
                ? "transparent"
                : o.color,
            border: o.planned ? `1.5px dashed ${o.color}` : undefined,
          }}
        />
      </div>
      {o.tx && (
        <span className="hash mt-1 block text-xs text-note">
          {short(o.tx, 6, 4)} receipt
        </span>
      )}
    </div>
  )
  return o.href ? (
    <a href={o.href} className="block rounded-md">
      {body}
    </a>
  ) : (
    body
  )
}

function FundHead({
  f,
  value,
  sub,
}: {
  f: FundView
  value: number
  sub: string
}) {
  return (
    <a
      href={`/funds/${f.event.event_id}`}
      className="block rounded-xl border-l-4 border-note bg-card px-4 py-3 shadow-xs"
    >
      <div className="text-sm text-muted-foreground">
        {f.event.short ?? f.event.name} fund
      </div>
      <div className="tnum font-display text-2xl font-semibold">
        {usd(value)}
      </div>
      <div className="text-xs text-ink-2">{sub}</div>
    </a>
  )
}
