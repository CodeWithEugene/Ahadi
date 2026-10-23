"use client"

import { Play, Square } from "lucide-react"
import { useEffect, useId, useRef, useState } from "react"

import { cn } from "@/lib/utils"

import { CodeSurface, CopyButton } from "./code-block"
import type { Lang } from "./highlight"

type Tab = "request" | "response" | "live"

/** Wall clock for timing a request; only ever called from event handlers. */
function now(): number {
  return performance.now()
}

interface Live {
  status: number | null
  ms: number
  body: string
  lang: Lang
  error?: string
}

export function EndpointExample({
  curl,
  example,
  exampleLang = "json",
  exampleLabel = "Example response",
  note,
  tryPath,
  stream = false,
}: {
  curl: string
  example: string
  exampleLang?: Lang
  exampleLabel?: string
  note?: string
  /** Same-origin path for a live GET. Omitted for writes and internal endpoints. */
  tryPath?: string
  stream?: boolean
}) {
  const [tab, setTab] = useState<Tab>("response")
  const [live, setLive] = useState<Live | null>(null)
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)
  const [count, setCount] = useState(0)
  const esRef = useRef<EventSource | null>(null)
  const id = useId()

  useEffect(() => () => esRef.current?.close(), [])

  async function send() {
    if (!tryPath) return
    if (stream) return toggleStream()
    setBusy(true)
    setTab("live")
    const t0 = now()
    try {
      const res = await fetch(tryPath, { cache: "no-store" })
      const text = await res.text()
      let body = text
      let lang: Lang = "text"
      try {
        body = JSON.stringify(JSON.parse(text), null, 2)
        lang = "json"
      } catch {}
      setLive({
        status: res.status,
        ms: Math.round(now() - t0),
        body,
        lang,
      })
    } catch (e) {
      setLive({
        status: null,
        ms: Math.round(now() - t0),
        body: "",
        lang: "text",
        error: e instanceof Error ? e.message : "Request failed",
      })
    } finally {
      setBusy(false)
    }
  }

  function toggleStream() {
    if (esRef.current) {
      esRef.current.close()
      esRef.current = null
      setListening(false)
      return
    }
    setTab("live")
    const lines: string[] = []
    let count = 0
    const t0 = now()
    setLive({ status: 200, ms: 0, body: "Connecting…", lang: "text" })
    const es = new EventSource(tryPath!)
    esRef.current = es
    setListening(true)
    setTimeout(() => {
      if (esRef.current === es && count === 0) {
        setLive({
          status: 200,
          ms: Math.round(now() - t0),
          body: "Connected, but nothing has arrived yet.\n\nA proxy that compresses responses can hold a stream back.\nTo watch it directly, run the request in a terminal:\n\n  curl -N $AHADI/api/stream",
          lang: "text",
        })
      }
    }, 6000)
    es.onmessage = (ev) => {
      count++
      lines.push(`id: ${ev.lastEventId}\ndata: ${ev.data}\n`)
      if (lines.length > 12) lines.shift()
      setLive({
        status: 200,
        ms: Math.round(now() - t0),
        body: `${lines.join("\n")}`,
        lang: "sse",
        error: undefined,
      })
      setCount(count)
    }
    es.onerror = () => {
      setLive((l) => ({
        status: l?.status ?? null,
        ms: l?.ms ?? 0,
        body: l?.body ?? "",
        lang: "sse",
        error: "The stream closed. The bridge may be offline.",
      }))
      es.close()
      esRef.current = null
      setListening(false)
    }
  }
  const tabs: { id: Tab; label: string }[] = [
    { id: "request", label: "Request" },
    { id: "response", label: exampleLabel },
    ...(live
      ? [{ id: "live" as Tab, label: stream ? "Live stream" : "Live response" }]
      : []),
  ]
  const current =
    tab === "request"
      ? { code: curl, lang: "bash" as Lang }
      : tab === "live" && live
        ? { code: live.body, lang: live.lang }
        : { code: example, lang: exampleLang }

  return (
    <div className="overflow-hidden rounded-xl bg-ink shadow-sm ring-1 ring-ink/10">
      <div className="flex items-center gap-2 border-b border-white/10 py-1.5 pr-1.5 pl-1.5">
        <div
          role="tablist"
          aria-label="Example"
          className="flex min-w-0 flex-1 gap-0.5 overflow-x-auto"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`${id}-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`${id}-panel`}
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors",
                tab === t.id
                  ? "bg-white/12 text-white"
                  : "text-white/55 hover:text-white/85"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        <CopyButton value={current.code} />
        {tryPath && (
          <button
            type="button"
            onClick={send}
            disabled={busy}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60",
              listening
                ? "bg-white/90 text-ink hover:bg-white"
                : "bg-note text-white hover:bg-[#0d7059]"
            )}
          >
            {listening ? (
              <Square className="size-3" aria-hidden />
            ) : (
              <Play className="size-3" aria-hidden />
            )}
            {stream
              ? listening
                ? "Stop"
                : "Listen"
              : busy
                ? "Sending…"
                : "Try it"}
          </button>
        )}
      </div>
      <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${tab}`}>
        {tab === "live" && live && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 px-4 py-2 text-xs text-white/60">
            {live.status !== null && (
              <span
                className={cn(
                  "tnum inline-flex items-center gap-1.5",
                  live.status < 400 ? "text-[#7fe0b0]" : "text-[#f4a582]"
                )}
              >
                <span
                  className="size-1.5 rounded-full bg-current"
                  aria-hidden
                />
                {live.status}
              </span>
            )}
            {stream ? (
              <span className="tnum">
                {count} events{listening ? ", listening" : ""}. Showing the
                latest 12.
              </span>
            ) : (
              <span className="tnum">
                {live.ms} ms, fetched live from this site&apos;s /api proxy
              </span>
            )}
            {live.error && <span className="text-[#f4a582]">{live.error}</span>}
          </div>
        )}
        <CodeSurface
          code={current.code}
          lang={current.lang}
          maxHeight="22rem"
        />
      </div>
      {note && tab === "response" && (
        <div className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
          {note}
        </div>
      )}
    </div>
  )
}
