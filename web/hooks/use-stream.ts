"use client"

import { useEffect, useRef, useState } from "react"

import type { ActivityEvent } from "@/lib/types"

/** Live events from the bridge (server-sent events), with automatic reconnect. */
export function useStream(max = 500) {
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [connected, setConnected] = useState(false)
  const last = useRef(0)

  useEffect(() => {
    let es: EventSource | null = null
    let retry: ReturnType<typeof setTimeout> | undefined
    let closed = false
    const open = () => {
      es = new EventSource(`/api/stream?after=${last.current}`)
      es.onopen = () => setConnected(true)
      es.onmessage = (m) => {
        try {
          const ev = JSON.parse(m.data) as ActivityEvent
          if (ev.id <= last.current) return
          last.current = ev.id
          setEvents((prev) => {
            const next = [...prev, ev]
            return next.length > max ? next.slice(next.length - max) : next
          })
        } catch {}
      }
      es.onerror = () => {
        setConnected(false)
        es?.close()
        if (!closed) retry = setTimeout(open, 2000)
      }
    }
    open()
    return () => {
      closed = true
      es?.close()
      if (retry) clearTimeout(retry)
    }
  }, [max])

  return { events, connected }
}
