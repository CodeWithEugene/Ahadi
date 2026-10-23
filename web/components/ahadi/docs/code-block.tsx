"use client"

import { Check, Copy } from "lucide-react"
import { useState, type ReactNode } from "react"

import { cn } from "@/lib/utils"

import { highlight, type Lang } from "./highlight"

export function CopyButton({
  value,
  className,
  label = "Copy",
}: {
  value: string
  className?: string
  label?: string
}) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white",
        className
      )}
      aria-label={copied ? "Copied" : `${label} to clipboard`}
    >
      {copied ? (
        <Check className="size-3.5 text-[#7fe0b0]" aria-hidden />
      ) : (
        <Copy className="size-3.5" aria-hidden />
      )}
      <span aria-live="polite">{copied ? "Copied" : label}</span>
    </button>
  )
}

/** The code surface on its own: ink background, mono, scrollable. */
export function CodeSurface({
  code,
  lang,
  maxHeight,
  className,
}: {
  code: string
  lang: Lang
  maxHeight?: string
  className?: string
}) {
  return (
    <pre
      className={cn(
        "overflow-auto px-4 py-3.5 font-mono text-[0.8125rem] leading-6 [tab-size:2] text-[#e7ebe6]",
        className
      )}
      style={maxHeight ? { maxHeight } : undefined}
      tabIndex={0}
    >
      <code>{highlight(code, lang)}</code>
    </pre>
  )
}

export function CodeBlock({
  code,
  lang,
  title,
  maxHeight,
  className,
  footer,
  wrap = false,
}: {
  code: string
  lang: Lang
  title?: ReactNode
  maxHeight?: string
  className?: string
  footer?: ReactNode
  wrap?: boolean
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-xl bg-ink shadow-sm ring-1 ring-ink/10",
        className
      )}
    >
      <figcaption className="flex items-center justify-between gap-3 border-b border-white/10 py-1.5 pr-1.5 pl-4">
        <span className="truncate text-xs text-white/55">
          {title ?? langLabel(lang)}
        </span>
        <CopyButton value={code} />
      </figcaption>
      <CodeSurface
        code={code}
        lang={lang}
        maxHeight={maxHeight}
        className={wrap ? "break-all whitespace-pre-wrap" : undefined}
      />
      {footer && (
        <div className="border-t border-white/10 px-4 py-2 text-xs text-white/50">
          {footer}
        </div>
      )}
    </figure>
  )
}

export function langLabel(lang: Lang): string {
  return {
    json: "JSON",
    bash: "Shell",
    ts: "TypeScript",
    metta: "MeTTa",
    text: "Text",
    sse: "Event stream",
    csv: "CSV",
    py: "Python",
  }[lang]
}
