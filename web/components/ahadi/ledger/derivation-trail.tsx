import { readStep } from "@/lib/ledger-data"
import type { Step } from "@/lib/types"
import { cn } from "@/lib/utils"

/** The agent's derivation as a numbered sequence, each step with the MeTTa rule that produced it. */
export function DerivationTrail({ steps, highlight, className }: { steps: Step[]; highlight?: string | null; className?: string }) {
  return (
    <ol className={cn("relative", className)}>
      {steps.map((s, i) => {
        const r = readStep(s)
        const on = highlight === s.rule
        const dim = highlight && !on && s.rule.startsWith("place-")
        const last = i === steps.length - 1
        return (
          <li key={s.rule} className="relative grid grid-cols-[2rem_1fr] gap-x-3">
            {!last && <span className="absolute top-8 bottom-0 left-4 w-px -translate-x-1/2 bg-hair" aria-hidden />}
            <span
              className={cn(
                "tnum relative z-10 mt-1 flex size-8 items-center justify-center rounded-full border text-[0.8125rem] font-semibold",
                on ? "border-note bg-note text-white" : "border-hair bg-card text-ink-2",
              )}
              aria-hidden
            >
              {i + 1}
            </span>
            <div
              className={cn(
                "mb-3 min-w-0 rounded-xl px-3 py-2.5 transition-colors",
                on && "bg-note-soft ring-1 ring-note/25",
                dim && "opacity-55",
              )}
              aria-current={on ? "step" : undefined}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <span className="font-medium">
                  {r.label}
                  {on && <span className="sr-only"> (this line)</span>}
                </span>
                <span className={cn("tnum font-semibold", on ? "text-note-ink" : "text-ink")}>{r.result}</span>
              </div>
              {r.formula && <div className="tnum mt-0.5 text-sm text-ink-2">{r.formula}</div>}
              {r.note && <div className="mt-0.5 text-sm text-carried">{r.note}</div>}
              <div className="mt-1 text-xs text-muted-foreground">MeTTa rule {s.rule}</div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
