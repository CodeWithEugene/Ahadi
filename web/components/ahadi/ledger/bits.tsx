import { ChevronRight } from "lucide-react"
import Link from "next/link"

import { statusWords } from "@/lib/ledger-data"
import { cn } from "@/lib/utils"

export function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-1 text-muted-foreground">
        {items.map((it, i) => (
          <li key={i} className="flex min-w-0 items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />}
            {it.href ? (
              <Link href={it.href} className="truncate rounded hover:text-ink">
                {it.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate text-ink">
                {it.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  const s = statusWords(status)
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap", s.tone, className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s.label}
    </span>
  )
}

export function SectionHead({ id, title, children, aside }: { id?: string; title: string; children?: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
      <div className="max-w-2xl">
        <h2 id={id} className="text-2xl font-semibold sm:text-[1.75rem]">
          {title}
        </h2>
        {children && <p className="mt-2 text-ink-2">{children}</p>}
      </div>
      {aside}
    </div>
  )
}

export function Panel({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border bg-card", className)} {...rest}>
      {children}
    </div>
  )
}

export function Facts({ items, className }: { items: { k: string; v: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("divide-y", className)}>
      {items.map((it) => (
        <div key={it.k} className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
          <dt className="text-sm text-muted-foreground">{it.k}</dt>
          <dd className="min-w-0 text-[0.9375rem] break-words">{it.v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function TextLink({ href, children, external, className }: { href: string; children: React.ReactNode; external?: boolean; className?: string }) {
  const cls = cn("rounded font-medium text-note underline-offset-4 hover:underline", className)
  return external ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  )
}

/** A section with a centred heading and intro, matching the centred page intros. The anchor mark shows on hover or focus only. */
export function LedgerSection({ id, title, lede, children, className }: { id: string; title: React.ReactNode; lede?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("scroll-mt-32 lg:scroll-mt-24", className)}>
      <div className="mx-auto max-w-3xl text-center">
        <h2 id={`${id}-title`} className="text-2xl font-semibold sm:text-3xl">
          <a href={`#${id}`} className="group relative rounded-sm">
            {title}
            <span className="absolute top-0 -right-6 text-hair opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden>
              #
            </span>
          </a>
        </h2>
        {lede && <div className="mx-auto mt-3 max-w-2xl leading-relaxed text-ink-2">{lede}</div>}
      </div>
      {children}
    </section>
  )
}

/** A diagram in a bordered, sideways-scrollable frame, with a centred caption. */
export function Figure({ children, caption, minWidth, label, className }: { children: React.ReactNode; caption?: React.ReactNode; minWidth?: number; label: string; className?: string }) {
  return (
    <figure className={cn("mt-8", className)}>
      <div className="overflow-x-auto rounded-2xl border bg-card p-3 sm:p-6" tabIndex={0} role="group" aria-label={label}>
        <div style={minWidth ? { minWidth } : undefined}>{children}</div>
      </div>
      {(caption || minWidth) && (
        <figcaption className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          {minWidth ? <span className="md:hidden">Scroll sideways to see the whole picture. </span> : null}
          {caption}
        </figcaption>
      )}
    </figure>
  )
}
