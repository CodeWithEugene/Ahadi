"use client"

import { KeyRound, ShieldCheck, Upload } from "lucide-react"
import { createContext, useContext, useRef, useState } from "react"
import { Keypair } from "@stellar/stellar-sdk"

import { short } from "@/lib/format"

type Key = { public: string; secret: string } | null
const Ctx = createContext<{ key: Key; setKey: (k: Key) => void }>({ key: null, setKey: () => {} })

export function OrganiserKeyProvider({ children }: { children: React.ReactNode }) {
  const [key, setKey] = useState<Key>(null)
  return <Ctx.Provider value={{ key, setKey }}>{children}</Ctx.Provider>
}

export const useOrganiserKey = () => useContext(Ctx)

/** The organiser's key is held only in this tab's memory. It is never sent to the server or shown. */
export function OrganiserKeyCard({ expectedPublic }: { expectedPublic: string | null }) {
  const { key, setKey } = useOrganiserKey()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  async function load(file: File) {
    setError(null)
    try {
      const data = JSON.parse(await file.text())
      const kp = Keypair.fromSecret(String(data.secret))
      if (expectedPublic && kp.publicKey() !== expectedPublic) {
        setError("This key is not the organiser key for this fund.")
        return
      }
      setKey({ public: kp.publicKey(), secret: kp.secret() })
    } catch {
      setError("That file is not an Ahadi organiser key.")
    }
  }

  if (key) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-organiser/30 bg-organiser-soft px-4 py-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-organiser" aria-hidden />
          <div>
            <div className="text-sm font-medium">Your organiser key is ready to sign</div>
            <div className="hash text-ink-2">{short(key.public, 6, 6)} · kept in this tab only</div>
          </div>
        </div>
        <button onClick={() => setKey(null)} className="rounded-md px-2 py-1 text-sm text-ink-2 hover:text-ink">
          Forget key
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-dashed border-organiser/40 bg-card px-4 py-4">
      <div className="flex items-start gap-3">
        <KeyRound className="mt-0.5 size-5 text-organiser" aria-hidden />
        <div className="flex-1">
          <div className="text-sm font-medium">Load your organiser key to approve payouts</div>
          <p className="mt-1 text-sm text-ink-2">The key stays in this browser tab. Ahadi&apos;s servers never see it; they only receive your signature.</p>
          {error && <p className="mt-2 text-sm text-failed">{error}</p>}
          <button
            onClick={() => input.current?.click()}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-paper px-3 py-2 text-sm font-medium hover:border-ink/40"
          >
            <Upload className="size-4" aria-hidden /> Choose key file
          </button>
          <input ref={input} type="file" accept=".key,.json,application/json" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
        </div>
      </div>
    </div>
  )
}
