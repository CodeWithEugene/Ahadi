import {
  ArrowDownToLine,
  ArrowRightLeft,
  Ban,
  CircleCheck,
  CircleDashed,
  Copy,
  FileCheck2,
  Hourglass,
  KeyRound,
  Landmark,
  OctagonAlert,
  ShieldCheck,
  Undo2,
  type LucideIcon,
} from "lucide-react"

import type { LineKind } from "@/lib/types"
import { cn } from "@/lib/utils"

export const KIND: Record<LineKind, { label: string; icon: LucideIcon; tone: string; sign: 1 | -1 | 0; help: string }> = {
  rule: { label: "Rule recorded", icon: FileCheck2, tone: "ink", sign: 0, help: "The funding rule's fingerprint was written to the fund on Stellar." },
  received: { label: "Received", icon: ArrowDownToLine, tone: "note", sign: 1, help: "Money arrived in the fund." },
  attested: { label: "Eligibility attested", icon: ShieldCheck, tone: "organiser", sign: 0, help: "The organiser confirmed how many teams qualified." },
  paid: { label: "Paid", icon: CircleCheck, tone: "note", sign: -1, help: "Settled on Stellar with both signatures." },
  held: { label: "Held for winner", icon: Hourglass, tone: "held", sign: -1, help: "Parked on the ledger until the winner claims it; returns to the fund if unclaimed." },
  failed: { label: "Failed", icon: OctagonAlert, tone: "failed", sign: 0, help: "The network refused this payout. Nothing moved." },
  rejected: { label: "Refused by rule", icon: Ban, tone: "rejected", sign: 0, help: "The rule does not allow this request, so it was never signed." },
  duplicate: { label: "Duplicate", icon: Copy, tone: "quiet", sign: 0, help: "This exact request was already handled. Nothing new was sent." },
  control: { label: "Single key refused", icon: KeyRound, tone: "agent", sign: 0, help: "The agent tried to pay with only its own key. Stellar refused, as designed." },
  carried_out: { label: "Carried forward", icon: ArrowRightLeft, tone: "carried", sign: -1, help: "The reserve moved to the next event's fund." },
  carried_in: { label: "Carried in", icon: Landmark, tone: "carried", sign: 1, help: "Reserve received from the previous event." },
  returned: { label: "Returned", icon: Undo2, tone: "carried", sign: 1, help: "An unclaimed prize came back to the fund." },
}

const TONE: Record<string, string> = {
  ink: "bg-paper-2 text-ink",
  note: "bg-note-soft text-note-ink",
  organiser: "bg-organiser-soft text-organiser",
  agent: "bg-agent-soft text-agent",
  held: "bg-held-soft text-held",
  failed: "bg-failed-soft text-failed",
  rejected: "bg-rejected-soft text-rejected",
  quiet: "bg-quiet-soft text-quiet",
  carried: "bg-carried-soft text-carried",
}

export function KindChip({ kind, className }: { kind: LineKind; className?: string }) {
  const k = KIND[kind] ?? { label: kind, icon: CircleDashed, tone: "quiet" }
  const Icon = k.icon
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", TONE[k.tone], className)}>
      <Icon className="size-3.5" aria-hidden />
      {k.label}
    </span>
  )
}

export function toneClass(kind: LineKind): string {
  return TONE[KIND[kind]?.tone ?? "quiet"]
}
