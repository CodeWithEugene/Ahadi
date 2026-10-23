"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"

export interface NavGroup {
  title: string
  items: { id: string; label: string; method?: string }[]
}

/** Sticky section navigation with scroll spy (desktop) and a jump menu (mobile). */
export function DocNav({
  groups,
  label = "On this page",
}: {
  groups: NavGroup[]
  label?: string
}) {
  const ids = groups.flatMap((g) => g.items.map((i) => i.id))
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[]
    if (!els.length) return
    const onScroll = () => {
      const offset = 140
      let current = els[0].id
      for (const el of els) {
        if (el.getBoundingClientRect().top - offset <= 0) current = el.id
      }
      if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4)
        current = els[els.length - 1].id
      setActive(current)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join("|")])

  return (
    <>
      {/* Mobile and tablet: a jump menu that stays under the header */}
      <div className="sticky top-16 z-30 -mx-4 border-b bg-paper/90 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:hidden">
        <label className="relative block">
          <span className="sr-only">Jump to a section</span>
          <select
            value={active}
            onChange={(e) => {
              setActive(e.target.value)
              document
                .getElementById(e.target.value)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }}
            className="w-full appearance-none rounded-lg border border-input bg-card py-2 pr-9 pl-3 text-sm font-medium"
          >
            {groups.map((g) => (
              <optgroup key={g.title} label={g.title}>
                {g.items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.method ? `${i.method} ${i.label}` : i.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </label>
      </div>

      {/* Desktop */}
      <nav
        aria-label={label}
        className="sticky top-24 hidden max-h-[calc(100dvh-7rem)] overflow-y-auto pr-2 pb-10 lg:block"
      >
        {groups.map((g) => (
          <div key={g.title} className="mb-6">
            <div className="mb-1.5 px-2 text-xs font-semibold text-ink">
              {g.title}
            </div>
            <ul className="space-y-px border-l border-hair">
              {g.items.map((i) => (
                <li key={i.id}>
                  <a
                    href={`#${i.id}`}
                    aria-current={active === i.id ? "location" : undefined}
                    className={cn(
                      "-ml-px flex items-center gap-2 border-l py-1 pr-2 pl-3 text-[0.8125rem] leading-snug transition-colors",
                      active === i.id
                        ? "border-note font-medium text-ink"
                        : "border-transparent text-ink-2 hover:border-ink/30 hover:text-ink"
                    )}
                  >
                    {i.method && <MethodTag method={i.method} small />}
                    <span>{i.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </>
  )
}

export function MethodTag({
  method,
  small = false,
}: {
  method: string
  small?: boolean
}) {
  const m = method.toUpperCase()
  const tone =
    m === "GET"
      ? "bg-note-soft text-note-ink"
      : m === "POST"
        ? "bg-organiser-soft text-organiser"
        : m === "SSE"
          ? "bg-carried-soft text-carried"
          : "bg-paper-2 text-ink-2"
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded font-mono font-semibold",
        tone,
        small
          ? "w-[2.125rem] justify-center text-[0.625rem] leading-4"
          : "px-1.5 py-0.5 text-[0.6875rem]"
      )}
    >
      {m}
    </span>
  )
}
