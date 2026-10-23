"use client"

import { useState } from "react"

import { LedgerTable } from "@/components/ahadi/ledger-table"
import type { Line } from "@/lib/types"
import { cn } from "@/lib/utils"

import { LedgerTimeline } from "./timeline"

/** The same ledger lines, as a lane timeline of who acted or as the full table. */
export function LedgerViews({
  lines,
  partyNames,
}: {
  lines: Line[]
  partyNames?: Record<string, string>
}) {
  const [view, setView] = useState<"timeline" | "table">("timeline")
  return (
    <div className="mt-8">
      <div className="mb-5 flex justify-center">
        <div
          className="inline-flex rounded-lg border bg-card p-1"
          role="tablist"
          aria-label="Ledger view"
        >
          {(
            [
              ["timeline", "Timeline of who acted"],
              ["table", "Every line, in full"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={cn(
                "rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors",
                view === id ? "bg-ink text-paper" : "text-ink-2 hover:text-ink"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {view === "timeline" ? (
        lines.length === 0 ? (
          <p className="rounded-2xl border border-dashed bg-card px-6 py-10 text-center text-ink-2">
            No lines yet. The first will be the rule&apos;s fingerprint going on
            record.
          </p>
        ) : (
          <figure>
            <div
              className="overflow-x-auto rounded-2xl border bg-card p-3 sm:p-4"
              tabIndex={0}
              role="group"
              aria-label="Ledger timeline"
            >
              <LedgerTimeline lines={lines} />
            </div>
            <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
              Oldest on the left. Each column is one ledger line and joins every
              party that took part in it; the large mark is where it ended.
              Select a column to open its receipt.
            </figcaption>
          </figure>
        )
      ) : (
        <LedgerTable lines={lines} partyNames={partyNames} />
      )}
    </div>
  )
}
