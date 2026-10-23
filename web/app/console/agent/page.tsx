"use client"

import { Bot, BrainCircuit, Cpu, Database, History, Wrench } from "lucide-react"
import Link from "next/link"
import { useEffect, useMemo, useState } from "react"

import { useStream } from "@/hooks/use-stream"
import { api, getHealth } from "@/lib/api"
import type { Health } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Memory {
  long_term: { id: number; text: string; time: string | null }[]
  history_tail: string
}

const SKILL_TEXT: Record<string, string> = {
  "ahadi-status": "Reads a fund: rule, totals, ledger, open proposals",
  "ahadi-publish-rule": "Prepares the on-chain record of the rule",
  "ahadi-derive": "Derives award pool, reserve and every prize in MeTTa",
  "ahadi-propose": "Checks a place against the rule in MeTTa; proposes only if allowed",
  "ahadi-request": "Checks a payout request from a message; records duplicates and refusals",
  "ahadi-try-alone": "Shows that its own key alone cannot pay",
  "ahadi-reroute": "Holds a prize as a claimable balance after a failure",
  "ahadi-carry-forward": "Proposes moving the reserve to the next event",
  "ahadi-quote": "Gets a simulated NEAR Intents dry quote",
  "ahadi-verify": "Checks a transaction against the ledger",
  remember: "Writes a fact to long-term memory",
  query: "Searches long-term memory",
  episodes: "Recalls what happened around a time",
  send: "Replies to the organiser",
  metta: "Evaluates a MeTTa expression",
}

export default function AgentPage() {
  const [health, setHealth] = useState<Health | null>(null)
  const [memory, setMemory] = useState<Memory | null>(null)
  const { events } = useStream()

  useEffect(() => {
    const load = () => {
      getHealth().then(setHealth).catch(() => {})
      api<Memory>("/api/agent/memory").then(setMemory).catch(() => {})
    }
    load()
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [])

  const calls = useMemo(() => events.filter((e) => e.kind === "omega_log" && (e.category === "decision" || e.category === "result")).slice(-60), [events])
  const om = health?.omega

  return (
    <div className="ahadi-page py-10">
      <div className="flex flex-col items-center text-center">
      <Link href="/console" className="text-sm text-ink-2 hover:text-ink">
        Organiser console
      </Link>
      <h1 className="mt-2 text-3xl font-semibold sm:text-5xl">What Ahadi knows</h1>
      <p className="mx-auto mt-3 max-w-2xl text-lg text-ink-2">
        Ahadi is a SingularityNET Omega agent running in its own Docker container. This page shows what it remembers, the tools it can use, and its most recent decisions, read straight from the agent.
      </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Bot} label="Agent" value={om?.connected ? "Online" : "Offline"} tone={om?.connected ? "text-note" : "text-failed"} />
        <Stat icon={Cpu} label="Language model" value={om?.provider ? `${om.provider}${om.model ? `, ${om.model}` : ""}` : "Not called yet"} />
        <Stat icon={BrainCircuit} label="Reasoning cycles seen" value={String(om?.cycles ?? 0)} />
        <Stat icon={Database} label="Long-term memories" value={String(memory?.long_term.length ?? 0)} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="min-w-0 rounded-2xl border bg-card p-5" aria-labelledby="mem">
          <h2 id="mem" className="flex items-center gap-2 font-sans text-lg font-semibold tracking-normal">
            <Database className="size-5 text-agent" aria-hidden /> Long-term memory
          </h2>
          <p className="mt-1 text-sm text-ink-2">Facts Ahadi chose to remember. They survive restarts, so a new session can recall last month&apos;s event.</p>
          <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto">
            {(memory?.long_term ?? []).length === 0 && <li className="rounded-lg bg-paper px-3 py-6 text-center text-sm text-muted-foreground">No memories yet. Ahadi remembers a fact after each money action.</li>}
            {memory?.long_term.map((m) => (
              <li key={m.id} className="rounded-lg bg-paper px-3 py-2.5 text-sm">
                <p className="break-words">{m.text}</p>
                {m.time && <p className="mt-1 text-xs text-muted-foreground">{m.time}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className="min-w-0 rounded-2xl border bg-card p-5" aria-labelledby="skills">
          <h2 id="skills" className="flex items-center gap-2 font-sans text-lg font-semibold tracking-normal">
            <Wrench className="size-5 text-agent" aria-hidden /> Tools Ahadi can use
          </h2>
          <p className="mt-1 text-sm text-ink-2">Omega skills loaded right now. Shell, file writing and web search are switched off for this agent.</p>
          <ul className="mt-4 grid gap-1.5">
            {(om?.skills ?? []).filter((s) => s.startsWith("ahadi-")).map((s) => (
              <li key={s} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg px-3 py-2 odd:bg-paper">
                <code className="hash text-agent">{s}</code>
                <span className="text-right text-sm text-ink-2">{SKILL_TEXT[s] ?? ""}</span>
              </li>
            ))}
            {!om?.skills?.length && <li className="text-sm text-muted-foreground">The skill list appears when the agent starts.</li>}
          </ul>
        </section>
      </div>

      <section className="mt-6 rounded-2xl border bg-card p-5" aria-labelledby="calls">
        <h2 id="calls" className="flex items-center gap-2 font-sans text-lg font-semibold tracking-normal">
          <BrainCircuit className="size-5 text-agent" aria-hidden /> Recent decisions and results
        </h2>
        <ol className="mt-4 divide-y">
          {calls.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">Decisions stream in live while Ahadi works.</li>}
          {calls.map((e) => (
            <li key={e.id} className="flex gap-3 py-2.5 text-sm">
              <span className="w-16 shrink-0 text-xs text-muted-foreground tnum">{e.ts?.slice(11)}</span>
              {e.category === "decision" ? (
                <span>
                  <span className="font-medium text-agent">Calls</span> <code className="hash">{e.calls.map((c: any) => `${c.name} ${c.arguments}`).join("  ")}</code>
                </span>
              ) : (
                <span className={cn("line-clamp-2", e.ok ? "text-ink-2" : "text-failed")}>
                  <span className="font-medium text-ink">{e.skill}</span> {String(e.text).slice(0, 260)}
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-2xl border bg-card p-5" aria-labelledby="hist">
        <h2 id="hist" className="flex items-center gap-2 font-sans text-lg font-semibold tracking-normal">
          <History className="size-5 text-agent" aria-hidden /> Episodic history
        </h2>
        <p className="mt-1 text-sm text-ink-2">Omega&apos;s own append-only record of messages and the skill calls it made, in MeTTa form.</p>
        <pre className="hash mt-4 max-h-96 overflow-auto rounded-xl bg-ink p-4 text-[0.75rem] leading-relaxed whitespace-pre-wrap text-paper/85">{memory?.history_tail || "Empty until the agent handles its first message."}</pre>
      </section>
    </div>
  )
}

function Stat({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border bg-card p-4 text-center">
      <div className="flex items-center justify-center gap-2 text-sm text-ink-2">
        <Icon className="size-4" aria-hidden /> {label}
      </div>
      <div className={cn("mt-1.5 text-lg font-semibold", tone)}>{value}</div>
    </div>
  )
}
