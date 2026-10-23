"use client"

import { Lock, LockOpen } from "lucide-react"
import { useEffect, useState } from "react"

import { api } from "@/lib/api"

/** The live console is protected by a demo passcode; it is kept in this tab's session storage only. */
export function PasscodeBar() {
  const [stored, setStored] = useState<string | null>(null)
  const [value, setValue] = useState("")
  const [state, setState] = useState<"unknown" | "needed" | "ok" | "wrong">("unknown")

  useEffect(() => {
    let code: string | null = null
    try {
      code = window.sessionStorage.getItem("ahadi.passcode")
    } catch {}
    setStored(code)
    // A harmless write probe: rejecting an unknown proposal tells us whether the passcode is accepted.
    api("/api/proposals/p_probe/reject", { method: "POST", body: JSON.stringify({ reason: "probe" }), passcode: code ?? "" })
      .then(() => setState("ok"))
      .catch((e) => setState(e.status === 401 ? (code ? "wrong" : "needed") : "ok"))
  }, [])

  if (state === "ok" || state === "unknown") {
    return stored && state === "ok" ? (
      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <LockOpen className="size-3.5" /> Console unlocked for this tab
      </div>
    ) : null
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        try {
          window.sessionStorage.setItem("ahadi.passcode", value.trim())
        } catch {}
        window.location.reload()
      }}
      className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-3 rounded-2xl border border-organiser/30 bg-organiser-soft px-5 py-4"
    >
      <Lock className="size-4 text-organiser" aria-hidden />
      <label htmlFor="passcode" className="text-sm font-medium">
        {state === "wrong" ? "That passcode was not accepted. Try again" : "Enter the console passcode to act as the organiser"}
      </label>
      <input id="passcode" value={value} onChange={(e) => setValue(e.target.value)} type="password" autoComplete="off" className="w-40 rounded-lg border bg-card px-3 py-1.5 text-sm" />
      <button className="rounded-lg bg-note px-3 py-1.5 text-sm font-medium text-white hover:bg-note-ink">Unlock</button>
      <p className="w-full text-center text-xs text-ink-2">Anyone can read the ledger. Approving payouts and talking to Ahadi need the organiser&apos;s passcode and key.</p>
    </form>
  )
}
