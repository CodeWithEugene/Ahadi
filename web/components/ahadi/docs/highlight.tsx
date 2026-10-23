import type { ReactNode } from "react"

export type Lang =
  "json" | "bash" | "ts" | "metta" | "text" | "sse" | "csv" | "py"

const KEYWORDS: Record<string, string[]> = {
  ts: [
    "const",
    "let",
    "function",
    "return",
    "await",
    "async",
    "if",
    "else",
    "new",
    "import",
    "from",
    "export",
    "type",
    "interface",
    "for",
    "of",
    "true",
    "false",
    "null",
  ],
  bash: ["curl"],
  py: [
    "if",
    "else",
    "and",
    "or",
    "not",
    "def",
    "return",
    "None",
    "True",
    "False",
    "bool",
  ],
  metta: [
    "if",
    "let",
    "progn",
    "py-call",
    "sread",
    "map-atom",
    "foldl-atom",
    "import!",
  ],
}

const COLORS = {
  comment: "text-white/40",
  string: "text-[#9fd8bd]",
  key: "text-[#c3c0ff]",
  number: "text-[#f0c287]",
  keyword: "text-[#8fc7e0]",
  variable: "text-[#f0c287]",
  flag: "text-[#8fc7e0]",
}

function patternFor(lang: Lang): RegExp | null {
  const str = `"(?:\\\\.|[^"\\\\\\n])*"`
  switch (lang) {
    case "json":
      return new RegExp(
        `(?<key>${str})(?=\\s*:)|(?<string>${str})|(?<number>-?\\b\\d+(?:\\.\\d+)?\\b|\\btrue\\b|\\bfalse\\b|\\bnull\\b)`,
        "g"
      )
    case "ts":
      return new RegExp(
        `(?<comment>\\/\\/[^\\n]*)|(?<string>${str}|'(?:\\\\.|[^'\\\\\\n])*'|\`(?:\\\\.|[^\`\\\\])*\`)|(?<keyword>\\b(?:${KEYWORDS.ts.join("|")})\\b)|(?<number>\\b\\d+(?:\\.\\d+)?\\b)`,
        "g"
      )
    case "bash":
      return new RegExp(
        `(?<comment>(?:^|(?<=\\s))#[^\\n]*)|(?<string>${str}|'[^'\\n]*')|(?<keyword>\\bcurl\\b)|(?<flag>(?<=\\s)--?[a-zA-Z][\\w-]*)`,
        "gm"
      )
    case "py":
      return new RegExp(
        `(?<comment>#[^\\n]*)|(?<string>${str})|(?<keyword>\\b(?:${KEYWORDS.py.join("|")})\\b)`,
        "g"
      )
    case "metta":
      return new RegExp(
        `(?<comment>;[^\\n]*)|(?<string>${str})|(?<variable>\\$[\\w-]+)|(?<keyword>(?<=\\()(?:${KEYWORDS.metta.map((k) => k.replace("!", "\\!")).join("|")}|=)(?=[\\s)]))|(?<number>(?<![\\w-])\\d+\\b)`,
        "g"
      )
    case "sse":
      return new RegExp(
        `(?<key>^(?:id|event|data):)|(?<string>${str})|(?<number>(?<=id: )\\d+)`,
        "gm"
      )
    default:
      return null
  }
}

/** A small, dependency-free highlighter: enough colour to scan, never enough to distract. */
export function highlight(code: string, lang: Lang): ReactNode[] {
  const re = patternFor(lang)
  if (!re) return [code]
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const m of code.matchAll(re)) {
    const start = m.index ?? 0
    if (start > last) out.push(code.slice(last, start))
    const group = Object.entries(m.groups ?? {}).find(
      ([, v]) => v !== undefined
    )?.[0] as keyof typeof COLORS | undefined
    out.push(
      <span key={i++} className={group ? COLORS[group] : undefined}>
        {m[0]}
      </span>
    )
    last = start + m[0].length
    if (m[0].length === 0) re.lastIndex++
  }
  if (last < code.length) out.push(code.slice(last))
  return out
}
