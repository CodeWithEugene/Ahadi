import { ArrowRight, Landmark } from "lucide-react"
import Link from "next/link"

import { Hash } from "@/components/ahadi/hash"
import { EXPLORER_TX, usd } from "@/lib/format"
import { longDate } from "@/lib/ledger-data"
import type { Line } from "@/lib/types"
import { cn } from "@/lib/utils"

/** A carry-forward link between two funds: the reserve leaving one event or arriving in the next. */
export function CarryCard({ line, direction, otherName, otherId, className }: { line: Line; direction: "in" | "out"; otherName: string; otherId: string; className?: string }) {
  const amount = usd(line.amount_cents)
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-carried/25 bg-carried-soft/70", className)}>
      <div className="grid gap-5 px-5 py-5 sm:px-6 md:grid-cols-[auto_1fr_auto] md:items-center md:gap-6">
        <span className="flex size-11 items-center justify-center rounded-full bg-card text-carried shadow-xs" aria-hidden>
          {direction === "in" ? <Landmark className="size-5" /> : <ArrowRight className="size-5" />}
        </span>
        <div className="min-w-0">
          <p className="font-display text-xl font-semibold tracking-tight text-ink">
            {direction === "in" ? (
              <>
                This fund opens with <span className="tnum text-carried">{amount}</span> carried forward from the {otherName}.
              </>
            ) : (
              <>
                <span className="tnum text-carried">{amount}</span> moved to the {otherName}.
              </>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-2">
            {direction === "in"
              ? `The reserve the earlier rule did not award arrived on ${longDate(line.created_at)} in one transaction, signed by both keys.`
              : `The reserve this rule did not award left on ${longDate(line.created_at)} in one transaction, signed by both keys. Nothing was kept back.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 text-sm md:items-end">
          {line.tx_hash && (
            <span className="inline-flex items-center gap-1.5">
              <span className="text-muted-foreground">Receipt</span>
              <Hash value={line.tx_hash} href={EXPLORER_TX + line.tx_hash} />
            </span>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href={`/receipt/${line.id}`} className="rounded font-medium text-note underline-offset-4 hover:underline">
              Check this line
            </Link>
            <Link href={`/funds/${otherId}`} className="rounded font-medium text-note underline-offset-4 hover:underline">
              {direction === "in" ? "Previous ledger" : "Next ledger"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
