"use client"

import { Menu, X } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { Wordmark } from "@/components/ahadi/brand"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/", label: "Home" },
  { href: "/funds", label: "Public ledger" },
  { href: "/verify", label: "Verify" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/developers", label: "Developers" },
  { href: "/trust", label: "Trust" },
]

export function TestnetBanner() {
  return (
    <div className="bg-ink text-[0.8125rem] text-paper">
      <div className="ahadi-page flex items-center justify-center gap-2 py-1.5 text-center">
        <span className="inline-block size-1.5 rounded-full bg-[#f2c14b]" aria-hidden />
        Stellar testnet. No real money moves. Cross-chain quotes are simulated. All people and teams are sample data.
      </div>
    </div>
  )
}

export function SiteHeader() {
  const path = usePathname()
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-40 border-b bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="ahadi-page flex h-16 items-center justify-between gap-6">
        <Wordmark />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "rounded-md px-3 py-2 text-[0.9375rem] text-ink-2 transition-colors hover:text-ink",
                (n.href === "/" ? path === "/" : path?.startsWith(n.href)) && "text-ink font-medium",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/console" className="hidden rounded-lg bg-note px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-note-ink sm:inline-flex">
            Organiser console
          </Link>
          <button className="rounded-md p-2 md:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Menu">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t bg-paper px-4 py-3 md:hidden" aria-label="Main">
          {[...NAV, { href: "/console", label: "Organiser console" }].map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded-md px-2 py-2.5 text-ink-2 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="ahadi-page grid gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-ink-2">Ahadi means promise in Kiswahili. Every prize promise, kept in public.</p>
          <p className="text-xs text-muted-foreground">Built for the BASIX.MARKET AI Omega Agent Dev Buildathon, October 2026, by Technetians (Nairobi).</p>
        </div>
        <FooterCol title="Product" links={[["Public ledger", "/funds"], ["Verify a receipt", "/verify"], ["Organiser console", "/console"], ["What Ahadi knows", "/console/agent"]]} />
        <FooterCol title="Learn" links={[["How it works", "/how-it-works"], ["Developers", "/developers"], ["Trust and safety", "/trust"], ["About", "/about"]]} />
        <FooterCol title="Built on" links={[["SingularityNET Omega", "https://github.com/singnet/Omega"], ["Stellar testnet", "https://developers.stellar.org"], ["NEAR Intents (dry quotes)", "https://docs.near-intents.org"], ["Source code", "https://github.com/CodeWithEugene/AI-OMEGA-AGENT-DEV-BUILDATHON"]]} />
      </div>
    </footer>
  )
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="mb-3 font-sans text-sm font-semibold tracking-normal">{title}</h2>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={href}>
            {href.startsWith("http") ? (
              <a href={href} target="_blank" rel="noreferrer" className="text-sm text-ink-2 hover:text-ink">
                {label}
              </a>
            ) : (
              <Link href={href} className="text-sm text-ink-2 hover:text-ink">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
