export function usd(cents: number, opts: { sign?: boolean; code?: boolean } = {}): string {
  const abs = Math.abs(cents)
  const s = `${Math.floor(abs / 100).toLocaleString("en-US")}.${String(abs % 100).padStart(2, "0")}`
  const sign = opts.sign && cents !== 0 ? (cents > 0 ? "+" : "−") : cents < 0 ? "−" : ""
  return `${sign}${opts.code === false ? "" : "USD "}${s}`
}

export function short(hash: string | null | undefined, head = 6, tail = 4): string {
  if (!hash) return ""
  if (hash.length <= head + tail + 1) return hash
  return `${hash.slice(0, head)}…${hash.slice(-tail)}`
}

export function pct(bp: number): string {
  return `${(bp / 100).toFixed(bp % 100 === 0 ? 0 : 2)}%`
}

export function when(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function ago(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return `${Math.round(s)}s ago`
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return `${Math.round(s / 86400)} d ago`
}

export const EXPLORER_TX = "https://stellar.expert/explorer/testnet/tx/"
export const EXPLORER_ACCOUNT = "https://stellar.expert/explorer/testnet/account/"
