import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** Page title block, matching the landing page's type scale. */
export function PageIntro({
  title,
  children,
  aside,
  className,
}: {
  title: string
  children?: ReactNode
  aside?: ReactNode
  className?: string
}) {
  return (
    <header className={cn("border-b bg-card", className)}>
      <div className="ahadi-page flex flex-col items-center gap-8 pt-14 pb-12 text-center lg:pt-20">
        <div className="flex flex-col items-center">
          <h1 className="max-w-3xl text-[2.5rem] leading-[1.05] font-semibold sm:text-5xl lg:text-[3.5rem]">
            {title}
          </h1>
          {children && (
            <div className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
              {children}
            </div>
          )}
        </div>
        {aside}
      </div>
    </header>
  )
}

export function DocSection({
  id,
  title,
  lede,
  children,
  className,
}: {
  id: string
  title: string
  lede?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className={cn("scroll-mt-32 lg:scroll-mt-24", className)}
    >
      <h2 id={`${id}-title`} className="text-2xl font-semibold sm:text-3xl">
        <a href={`#${id}`} className="group rounded-sm">
          {title}
          <span
            className="ml-2 text-hair opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            aria-hidden
          >
            #
          </span>
        </a>
      </h2>
      {lede && (
        <div className="mt-3 max-w-2xl leading-relaxed text-ink-2">{lede}</div>
      )}
      {children}
    </section>
  )
}

export function SubHeading({
  id,
  children,
  className,
}: {
  id?: string
  children: ReactNode
  className?: string
}) {
  return (
    <h3
      id={id}
      className={cn(
        "scroll-mt-32 font-sans text-lg font-semibold tracking-normal lg:scroll-mt-24",
        className
      )}
    >
      {children}
    </h3>
  )
}

export function Prose({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "max-w-2xl space-y-4 leading-relaxed text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink",
        className
      )}
    >
      {children}
    </div>
  )
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-[0.8125em] text-ink">
      {children}
    </code>
  )
}

/** A calm, bordered table that scrolls sideways on small screens. */
export function DataTable({
  head,
  rows,
  caption,
  minWidth = 640,
  className,
  colClassName,
}: {
  head: ReactNode[]
  rows: ReactNode[][]
  caption?: string
  minWidth?: number
  className?: string
  colClassName?: string[]
}) {
  return (
    <div className={cn("overflow-x-auto rounded-xl border bg-card", className)}>
      <table className="w-full border-collapse text-sm" style={{ minWidth }}>
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {head.map((h, i) => (
              <th
                key={i}
                scope="col"
                className={cn("px-4 py-3 font-medium", colClassName?.[i])}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b align-top last:border-0">
              {r.map((c, j) => (
                <td
                  key={j}
                  className={cn(
                    "px-4 py-3 leading-relaxed",
                    j === 0 ? "text-ink" : "text-ink-2",
                    colClassName?.[j]
                  )}
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Callout({
  children,
  tone = "note",
  title,
}: {
  children: ReactNode
  tone?: "note" | "held" | "organiser" | "quiet"
  title?: string
}) {
  const tones = {
    note: "border-note/25 bg-note-soft/60",
    held: "border-held/25 bg-held-soft/60",
    organiser: "border-organiser/25 bg-organiser-soft/60",
    quiet: "border-hair bg-paper-2/60",
  }
  return (
    <div
      className={cn(
        "rounded-xl border px-5 py-4 text-[0.9375rem] leading-relaxed text-ink-2",
        tones[tone]
      )}
    >
      {title && <div className="mb-1 font-semibold text-ink">{title}</div>}
      {children}
    </div>
  )
}

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "font-medium text-note underline-offset-4 hover:underline",
        className
      )}
    >
      {children}
    </a>
  )
}
