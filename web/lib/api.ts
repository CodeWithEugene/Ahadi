import type { EventSummary, FundView, Health, Proposal } from "./types"

// In the browser, /api is proxied by Next to the Ahadi bridge. On the server we call the
// bridge directly.
const SERVER_ORIGIN = process.env.AHADI_API_ORIGIN ?? "http://127.0.0.1:8000"

function base(): string {
  return typeof window === "undefined" ? SERVER_ORIGIN : ""
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export async function api<T>(path: string, init?: RequestInit & { passcode?: string }): Promise<T> {
  const headers: Record<string, string> = { "content-type": "application/json" }
  const code = init?.passcode ?? (typeof window !== "undefined" ? sessionPasscode() : undefined)
  if (code) headers["x-ahadi-passcode"] = code
  const res = await fetch(base() + path, { ...init, headers: { ...headers, ...(init?.headers as any) }, cache: "no-store" })
  if (!res.ok) {
    let body: any = {}
    try {
      body = await res.json()
    } catch {}
    throw new ApiError(res.status, body.error ?? "error", body.detail ?? `Request failed (${res.status})`)
  }
  return res.json()
}

export function sessionPasscode(): string | undefined {
  try {
    return window.sessionStorage.getItem("ahadi.passcode") ?? undefined
  } catch {
    return undefined
  }
}

export const getHealth = () => api<Health>("/api/health")
export const getEvents = () => api<EventSummary[]>("/api/events")
export const getFund = (id: string) => api<FundView>(`/api/funds/${id}`)
export const getProposals = (eventId?: string) => api<Proposal[]>(`/api/proposals${eventId ? `?event_id=${eventId}` : ""}`)

export async function tryServer<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}
