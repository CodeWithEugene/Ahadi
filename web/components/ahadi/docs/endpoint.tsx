import { Globe, KeyRound, Lock } from "lucide-react"

import type { Access, Endpoint } from "@/lib/docs-api"
import { cn } from "@/lib/utils"

import { MethodTag } from "./doc-nav"
import { EndpointExample } from "./endpoint-example"

const ACCESS: Record<
  Access,
  { label: string; icon: typeof Globe; className: string }
> = {
  public: {
    label: "Public",
    icon: Globe,
    className: "bg-note-soft text-note-ink",
  },
  console: {
    label: "Console passcode",
    icon: KeyRound,
    className: "bg-organiser-soft text-organiser",
  },
  tool: {
    label: "Internal, shared secret",
    icon: Lock,
    className: "bg-agent-soft text-agent",
  },
}

export function AccessChip({ access }: { access: Access }) {
  const a = ACCESS[access]
  const Icon = a.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        a.className
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {a.label}
    </span>
  )
}

export function EndpointBlock({ e }: { e: Endpoint }) {
  return (
    <article
      id={e.id}
      aria-labelledby={`${e.id}-title`}
      className="scroll-mt-32 border-t pt-10 lg:scroll-mt-24 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:gap-10 2xl:gap-14"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h3
            id={`${e.id}-title`}
            className="font-sans text-xl font-semibold tracking-normal"
          >
            {e.title}
          </h3>
          <AccessChip access={e.access} />
        </div>
        <div className="mt-3 flex min-w-0 items-center gap-2.5 overflow-x-auto rounded-lg border bg-card px-3 py-2">
          <MethodTag method={e.method} />
          <code className="font-mono text-[0.8125rem] whitespace-nowrap text-ink">
            {e.path}
          </code>
        </div>
        <p className="mt-4 max-w-2xl leading-relaxed text-ink-2">{e.text}</p>

        {e.params && e.params.length > 0 && (
          <div className="mt-5">
            <h4 className="text-sm font-semibold">Parameters</h4>
            <dl className="mt-2 divide-y rounded-lg border bg-card">
              {e.params.map((p) => (
                <div
                  key={p.name + p.in}
                  className="grid gap-1 px-4 py-3 sm:grid-cols-[minmax(10rem,14rem)_1fr] sm:gap-4"
                >
                  <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <code className="font-mono text-[0.8125rem] font-medium text-ink">
                      {p.name}
                    </code>
                    <span className="text-xs text-muted-foreground">
                      {p.in}, {p.type}
                      {p.required && (
                        <span className="text-organiser">, required</span>
                      )}
                    </span>
                  </dt>
                  <dd className="text-sm leading-relaxed text-ink-2">
                    {p.text}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>
      <div className="mt-5 min-w-0 xl:sticky xl:top-24 xl:mt-0 xl:self-start">
        <EndpointExample
          curl={e.curl}
          example={e.example}
          exampleLang={e.exampleLang ?? "json"}
          exampleLabel={e.exampleLabel}
          note={e.note}
          tryPath={e.tryPath}
          stream={e.method === "SSE"}
        />
      </div>
    </article>
  )
}
