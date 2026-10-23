import { CloudOff, SearchX } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function OfflineState({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-dashed bg-card px-6 py-14 text-center", className)}>
      <CloudOff className="mx-auto size-6 text-muted-foreground" aria-hidden />
      <h2 className="mt-4 text-xl font-semibold">The live ledger is offline right now</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-2">
        Ahadi&apos;s ledger service did not answer. The receipts themselves stay on Stellar testnet and can be checked on any explorer. Try again in a moment.
      </p>
    </div>
  )
}

export function MissingState({ title, children, href = "/funds", cta = "See all funds" }: { title: string; children: React.ReactNode; href?: string; cta?: string }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <SearchX className="size-7 text-muted-foreground" aria-hidden />
      <h1 className="mt-5 text-3xl font-semibold">{title}</h1>
      <p className="mt-3 text-ink-2">{children}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={href} className="rounded-lg bg-note px-4 py-2.5 font-medium text-white transition-colors hover:bg-note-ink">
          {cta}
        </Link>
        <Link href="/verify" className="rounded-lg border border-ink/15 bg-card px-4 py-2.5 font-medium transition-colors hover:border-ink/40">
          Verify a transaction
        </Link>
      </div>
    </div>
  )
}
