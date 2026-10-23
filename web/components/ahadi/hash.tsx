"use client"

import { Check, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"

import { short } from "@/lib/format"
import { cn } from "@/lib/utils"

export function Hash({ value, href, head = 6, tail = 4, className, label }: { value: string; href?: string; head?: number; tail?: number; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {}
  }
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="hash inline-flex items-center gap-1 rounded underline decoration-hair underline-offset-4 hover:decoration-note" title={value} aria-label={label ?? `Open ${value} on the block explorer`}>
          {short(value, head, tail)}
          <ExternalLink className="size-3 opacity-60" aria-hidden />
        </a>
      ) : (
        <span className="hash" title={value}>
          {short(value, head, tail)}
        </span>
      )}
      <button type="button" onClick={copy} className="rounded p-0.5 text-muted-foreground hover:text-foreground" aria-label={copied ? "Copied" : "Copy full value"}>
        {copied ? <Check className="size-3.5 text-note" /> : <Copy className="size-3.5" />}
      </button>
    </span>
  )
}
