import type { ReactNode } from "react"

/* ------------------------------------------------------------------ primitives */

function Box({
  x,
  y,
  w,
  h,
  title,
  lines = [],
  accent = "var(--hair)",
  fill = "#ffffff",
  dashed = false,
  titleColor = "var(--ink)",
}: {
  x: number
  y: number
  w: number
  h: number
  title?: string
  lines?: string[]
  accent?: string
  fill?: string
  dashed?: boolean
  titleColor?: string
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={12}
        fill={fill}
        stroke={accent}
        strokeWidth={dashed ? 1.5 : 1.25}
        strokeDasharray={dashed ? "6 5" : undefined}
      />
      {title && (
        <text
          x={x + 16}
          y={y + 28}
          fontSize={15}
          fontWeight={600}
          fill={titleColor}
        >
          {title}
        </text>
      )}
      {lines.map((l, i) => (
        <text
          key={i}
          x={x + 16}
          y={y + 50 + i * 19}
          fontSize={12.5}
          fill="var(--ink-2)"
        >
          {l}
        </text>
      ))}
    </g>
  )
}

function Pill({
  x,
  y,
  w,
  label,
  sub,
  dot,
}: {
  x: number
  y: number
  w: number
  label: string
  sub?: string
  dot?: string
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={34}
        rx={8}
        fill="var(--paper)"
        stroke="var(--hair)"
      />
      {dot && <circle cx={x + 14} cy={y + 17} r={4} fill={dot} />}
      <text
        x={x + (dot ? 26 : 12)}
        y={y + 21.5}
        fontSize={12.5}
        fontWeight={500}
        fill="var(--ink)"
      >
        {label}
      </text>
      {sub && (
        <text
          x={x + w - 12}
          y={y + 21.5}
          fontSize={11.5}
          fill="var(--quiet)"
          textAnchor="end"
          fontFamily="var(--font-mono)"
        >
          {sub}
        </text>
      )}
    </g>
  )
}

function Arrow({
  d,
  label,
  lx,
  ly,
  both = false,
  color = "var(--ink-2)",
  anchor = "middle",
}: {
  d: string
  label?: string
  lx?: number
  ly?: number
  both?: boolean
  color?: string
  anchor?: "start" | "middle" | "end"
}) {
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        markerEnd="url(#ah-arrow)"
        markerStart={both ? "url(#ah-arrow-start)" : undefined}
      />
      {label && (
        <text
          x={lx}
          y={ly}
          fontSize={11.5}
          fill="var(--ink-2)"
          textAnchor={anchor}
        >
          {label}
        </text>
      )}
    </g>
  )
}

function Markers() {
  return (
    <defs>
      <marker
        id="ah-arrow"
        viewBox="0 0 10 10"
        refX="9"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M0 1 L9 5 L0 9 z" fill="var(--ink-2)" />
      </marker>
      <marker
        id="ah-arrow-start"
        viewBox="0 0 10 10"
        refX="1"
        refY="5"
        markerWidth="7"
        markerHeight="7"
        orient="auto"
      >
        <path d="M10 1 L1 5 L10 9 z" fill="var(--ink-2)" />
      </marker>
    </defs>
  )
}

export function ScrollFigure({
  children,
  caption,
  minWidth = 900,
}: {
  children: ReactNode
  caption?: string
  minWidth?: number
}) {
  return (
    <figure className="mt-8">
      <div
        className="overflow-x-auto rounded-2xl border bg-card p-3 sm:p-5"
        tabIndex={0}
        role="group"
        aria-label={caption}
      >
        <div style={{ minWidth }}>{children}</div>
      </div>
      {caption && (
        <figcaption className="mt-3 max-w-2xl text-sm text-muted-foreground">
          <span className="md:hidden">Scroll sideways to see the whole diagram. </span>
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/* ------------------------------------------------------------------ architecture */

export function ArchitectureDiagram() {
  return (
    <svg
      viewBox="0 0 1200 640"
      className="h-auto w-full font-sans"
      role="img"
      aria-labelledby="arch-title arch-desc"
    >
      <title id="arch-title">Ahadi architecture</title>
      <desc id="arch-desc">
        Browsers reach the Next.js web app, which proxies /api to the bridge.
        The organiser&apos;s browser holds the organiser&apos;s key and signs.
        The bridge talks to the Omega container over a websocket channel and
        serves its skill tools, keeps the ledger and the agent&apos;s key, and
        talks to Stellar testnet and to NEAR Intents for dry quotes only.
      </desc>
      <Markers />

      {/* people */}
      <Box
        x={20}
        y={40}
        w={220}
        h={96}
        title="Browser"
        lines={["Ledger, receipts, docs", "Anyone, no account"]}
      />
      <Box
        x={20}
        y={176}
        w={220}
        h={124}
        title="Organiser's browser"
        titleColor="var(--organiser)"
        accent="var(--organiser)"
        fill="var(--organiser-soft)"
        lines={[
          "Holds the organiser's key,",
          "imported from a local file",
          "Signs the XDR locally",
        ]}
      />
      <Box
        x={20}
        y={340}
        w={220}
        h={80}
        title="Telegram"
        lines={["Participants message Ahadi"]}
      />

      {/* web */}
      <Box
        x={300}
        y={40}
        w={220}
        h={260}
        title="Next.js web app"
        lines={[
          "Public pages and the",
          "organiser console",
          "",
          "Proxies /api to the bridge",
          "",
          "Runs stellar-sdk in the",
          "browser for signing",
        ]}
      />

      {/* bridge */}
      <Box
        x={580}
        y={40}
        w={300}
        h={380}
        title="Bridge"
        lines={["FastAPI, holds no LLM"]}
        accent="var(--note)"
      />
      <Pill x={596} y={102} w={268} label="REST" sub="/api/*" />
      <Pill
        x={596}
        y={142}
        w={268}
        label="Live stream (SSE)"
        sub="/api/stream"
      />
      <Pill x={596} y={182} w={268} label="Websocket channel" sub="/omega" />
      <Pill x={596} y={222} w={268} label="Skill tools" sub="/tools/*" />
      <Pill
        x={596}
        y={262}
        w={268}
        label="Python mirror of the rule"
        sub="rules.py"
      />
      <Pill x={596} y={302} w={268} label="Ledger" sub="SQLite" />
      <Pill
        x={596}
        y={342}
        w={268}
        label="Agent's key, one of two"
        dot="var(--agent)"
      />
      <text x={612} y={402} fontSize={11.5} fill="var(--quiet)">
        Also relays Telegram to and from Omega
      </text>

      {/* omega */}
      <Box
        x={940}
        y={40}
        w={240}
        h={380}
        title="Omega container"
        lines={["Docker, unprivileged user,", "no-new-privileges, Landlock"]}
        accent="var(--agent)"
        dashed
      />
      <Pill x={956} y={122} w={208} label="Agent loop" dot="var(--agent)" />
      <Pill x={956} y={162} w={208} label="LLM via Omega's provider" />
      <Pill x={956} y={202} w={208} label="MeTTa rules" sub="ahadi-decide" />
      <Pill x={956} y={242} w={208} label="Skills" sub="10 ahadi-*" />
      <Pill x={956} y={282} w={208} label="Long-term memory" sub="ChromaDB" />
      <Pill
        x={956}
        y={322}
        w={208}
        label="Episodic history"
        sub="history.metta"
      />
      <text x={972} y={392} fontSize={11.5} fill="var(--quiet)">
        No keys. Shell, file and web
      </text>
      <text x={972} y={408} fontSize={11.5} fill="var(--quiet)">
        search skills removed.
      </text>

      {/* chain and near */}
      <Box
        x={580}
        y={500}
        w={300}
        h={120}
        title="Stellar testnet"
        accent="var(--note)"
        fill="var(--note-soft)"
        titleColor="var(--note-ink)"
        lines={[
          "2 of 2 vault funds, payments,",
          "claimable balances, manageData",
          "holding the rule hash",
        ]}
      />
      <Box
        x={940}
        y={500}
        w={240}
        h={120}
        title="NEAR Intents 1Click"
        lines={["Dry quote only.", "No funds move."]}
        dashed
      />

      {/* arrows */}
      <Arrow d="M240 88 H296" />
      <Arrow d="M240 238 H296" both />
      <Arrow d="M520 170 H576" both label="/api" lx={548} ly={162} />
      <Arrow
        d="M240 380 H576"
        both
        label="Bot API, relayed by the bridge"
        lx={408}
        ly={372}
      />
      <Arrow d="M880 199 H936" both label="messages" lx={908} ly={191} />
      <Arrow d="M936 239 H884" label="skills" lx={908} ly={262} />
      <Arrow
        d="M730 420 V496"
        both
        label="Horizon"
        lx={740}
        ly={462}
        anchor="start"
      />
      <Arrow
        d="M880 410 C 920 440, 1000 450, 1040 496"
        label="dry quote"
        lx={986}
        ly={452}
        anchor="start"
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ lifecycle */

type Tone =
  | "ink"
  | "agent"
  | "organiser"
  | "note"
  | "held"
  | "failed"
  | "rejected"
  | "quiet"
  | "carried"

const TONE: Record<Tone, { fill: string; stroke: string; text: string }> = {
  ink: { fill: "#ffffff", stroke: "var(--hair)", text: "var(--ink)" },
  agent: {
    fill: "var(--agent-soft)",
    stroke: "var(--agent)",
    text: "var(--agent)",
  },
  organiser: {
    fill: "var(--organiser-soft)",
    stroke: "var(--organiser)",
    text: "var(--organiser)",
  },
  note: {
    fill: "var(--note-soft)",
    stroke: "var(--note)",
    text: "var(--note-ink)",
  },
  held: {
    fill: "var(--held-soft)",
    stroke: "var(--held)",
    text: "var(--held)",
  },
  failed: {
    fill: "var(--failed-soft)",
    stroke: "var(--failed)",
    text: "var(--failed)",
  },
  rejected: {
    fill: "var(--rejected-soft)",
    stroke: "var(--rejected)",
    text: "var(--rejected)",
  },
  quiet: {
    fill: "var(--quiet-soft)",
    stroke: "var(--quiet)",
    text: "var(--quiet)",
  },
  carried: {
    fill: "var(--carried-soft)",
    stroke: "var(--carried)",
    text: "var(--carried)",
  },
}

function State({
  x,
  y,
  title,
  sub,
  tone = "ink",
  w = 150,
}: {
  x: number
  y: number
  title: string
  sub: string
  tone?: Tone
  w?: number
}) {
  const t = TONE[tone]
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={58}
        rx={10}
        fill={t.fill}
        stroke={t.stroke}
        strokeOpacity={tone === "ink" ? 1 : 0.55}
      />
      <text
        x={x + 12}
        y={y + 24}
        fontSize={13.5}
        fontWeight={600}
        fill={t.text}
      >
        {title}
      </text>
      <text x={x + 12} y={y + 43} fontSize={11.5} fill="var(--ink-2)">
        {sub}
      </text>
    </g>
  )
}

export const LIFECYCLE: {
  title: string
  sub: string
  tone: Tone
  branches?: { title: string; sub: string; tone: Tone }[]
}[] = [
  { title: "Requested", sub: "A skill call or a message", tone: "ink" },
  {
    title: "Checked by the rule",
    sub: "MeTTa and the bridge must agree",
    tone: "ink",
    branches: [
      {
        title: "Refused by rule",
        sub: "A rejected line with reasons. Nothing is signed.",
        tone: "rejected",
      },
      {
        title: "Duplicate",
        sub: "Points to the original receipt. Nothing new is sent.",
        tone: "quiet",
      },
    ],
  },
  {
    title: "Proposed",
    sub: "Waits for the organiser",
    tone: "ink",
    branches: [
      {
        title: "Rejected by the organiser",
        sub: "A rejected line with the organiser's reason.",
        tone: "rejected",
      },
    ],
  },
  {
    title: "Agent signed",
    sub: "prepare re-checks the rule, then signs",
    tone: "agent",
  },
  {
    title: "Organiser signed",
    sub: "In the organiser's browser",
    tone: "organiser",
  },
  {
    title: "Submitted",
    sub: "Signed XDR stored before it is sent",
    tone: "ink",
    branches: [
      {
        title: "Failed",
        sub: "The network refused it. Nothing moved.",
        tone: "failed",
      },
      {
        title: "Rerouted, then held",
        sub: "A claimable balance for 30 days, signed by both keys again.",
        tone: "held",
      },
    ],
  },
  { title: "Settled", sub: "A paid line with its receipt", tone: "note" },
]

export function LifecycleDiagram() {
  const xs = [10, 180, 350, 520, 690, 860, 1030]
  const main = LIFECYCLE
  return (
    <svg
      viewBox="0 0 1190 400"
      className="h-auto w-full font-sans"
      role="img"
      aria-labelledby="life-title life-desc"
    >
      <title id="life-title">Payout request lifecycle</title>
      <desc id="life-desc">
        Requested, checked by the rule, proposed, agent signed, organiser
        signed, submitted, settled. The rule can refuse a request or mark it a
        duplicate. The organiser can reject a proposal. A submitted payout can
        fail; a failure caused by the wallet is rerouted to a held prize that
        the winner can claim for 30 days.
      </desc>
      <Markers />
      {main.map((s, i) => (
        <State
          key={s.title}
          x={xs[i]}
          y={40}
          title={s.title}
          sub={shorten(s.sub)}
          tone={s.tone}
        />
      ))}
      {xs.slice(0, -1).map((x, i) => (
        <Arrow key={i} d={`M${x + 150} 69 H${xs[i + 1] - 4}`} />
      ))}

      {/* rule check branches */}
      <State
        x={95}
        y={190}
        title="Refused by rule"
        sub="Rejected line, reasons"
        tone="rejected"
      />
      <State
        x={265}
        y={290}
        title="Duplicate"
        sub="Original receipt returned"
        tone="quiet"
      />
      <Arrow d="M235 98 V150 Q235 160 225 160 H180 Q170 160 170 170 V186" />
      <Arrow d="M265 98 V250 Q265 260 275 260 H330 Q340 260 340 270 V286" />

      {/* organiser rejects */}
      <State
        x={435}
        y={190}
        title="Rejected"
        sub="By the organiser"
        tone="rejected"
      />
      <Arrow d="M425 98 V150 Q425 160 435 160 H500 Q510 160 510 170 V186" />

      {/* failure path */}
      <State
        x={860}
        y={190}
        title="Failed"
        sub="Result code recorded"
        tone="failed"
      />
      <Arrow d="M935 98 V186" />
      <State
        x={1030}
        y={190}
        title="Rerouted"
        sub="Claimable proposal"
        tone="ink"
      />
      <Arrow d="M1010 219 H1026" />
      <State
        x={1030}
        y={310}
        title="Held, 30 days"
        sub="Claim, or back to fund"
        tone="held"
      />
      <Arrow d="M1105 248 V306" />
      <text x={1117} y={281} fontSize={11} fill="var(--ink-2)">
        both keys sign again
      </text>
      <text x={860} y={272} fontSize={11.5} fill="var(--ink-2)">
        tx_too_late, tx_bad_seq:
      </text>
      <text x={860} y={289} fontSize={11.5} fill="var(--ink-2)">
        MeTTa says propose again
      </text>
    </svg>
  )
}

function shorten(s: string): string {
  return (
    {
      "A skill call or a message": "Skill call or message",
      "MeTTa and the bridge must agree": "MeTTa and bridge agree",
      "Waits for the organiser": "Waits for the organiser",
      "prepare re-checks the rule, then signs": "Rule re-checked first",
      "In the organiser's browser": "In their browser",
      "Signed XDR stored before it is sent": "XDR stored, then sent",
      "A paid line with its receipt": "Paid line and receipt",
    }[s] ?? s
  )
}

/** The same lifecycle as a stepped list, for narrow screens. */
export function LifecycleList() {
  return (
    <ol className="mt-8 space-y-0">
      {LIFECYCLE.map((s, i) => {
        const t = TONE[s.tone]
        return (
          <li key={s.title} className="relative pb-6 pl-8 last:pb-0">
            {i < LIFECYCLE.length - 1 && (
              <span
                className="absolute top-5 bottom-0 left-[0.6875rem] w-px bg-hair"
                aria-hidden
              />
            )}
            <span
              className="absolute top-1 left-0 size-[1.375rem] rounded-full border-2 bg-card"
              style={{ borderColor: t.stroke }}
              aria-hidden
            />
            <div className="font-semibold" style={{ color: t.text }}>
              {s.title}
            </div>
            <div className="text-sm text-ink-2">{s.sub}</div>
            {s.branches && (
              <ul className="mt-2 space-y-1.5">
                {s.branches.map((b) => (
                  <li
                    key={b.title}
                    className="rounded-lg border px-3 py-2 text-sm"
                    style={{
                      background: TONE[b.tone].fill,
                      borderColor: "transparent",
                    }}
                  >
                    <span
                      className="font-medium"
                      style={{ color: TONE[b.tone].text }}
                    >
                      {b.title}.
                    </span>{" "}
                    <span className="text-ink-2">{b.sub}</span>
                  </li>
                ))}
              </ul>
            )}
          </li>
        )
      })}
    </ol>
  )
}
