// Excerpts quoted from the repository. Keep them in step with the source files named above each.

/** omega/plugins/ahadi/ahadi.metta: the money gate. */
export const METTA_DECIDE = `; facts = (ahadi-facts published rule-match attested place-ok expected requested
;                      asset-ok budget-left seen place-paid active trusts other-chain)
(= (ahadi-decide (ahadi-facts $pub $match $att $pok $expected $requested $aok
                              $left $seen $paid $active $trusts $other))
   (let $checks ((ahadi-check rule-published $pub)
                 (ahadi-check rule-version $match)
                 (ahadi-check eligibility-attested $att)
                 (ahadi-check place-exists $pok)
                 (ahadi-check-amount $requested $expected)
                 (ahadi-check asset $aok)
                 (ahadi-check-budget $requested $left)
                 (ahadi-check not-duplicate $seen)
                 (ahadi-check place-unpaid $paid))
     (if (ahadi-all-passed $checks)
         (ahadi-decision allowed (ahadi-route $active $trusts $other) $checks)
         (ahadi-decision refused none $checks))))

; A wallet that cannot receive yet gets the prize held (claimable balance), never lost.
(= (ahadi-route $active $trusts $other-chain)
   (if (== (* $active $trusts) 0)
       claimable
       (if (== $other-chain 1) cross-chain-sim direct)))`

/** omega/plugins/ahadi/ahadi.metta: derivation and the propose skill. */
export const METTA_DERIVE = `; release = min(100%, eligible / target)
(= (ahadi-release-bp $eligible $target)
   (min 10000 (ahadi-idiv (* 10000 $eligible) $target)))
; award pool = pool x release
(= (ahadi-award-cents $pool $eligible $target)
   (ahadi-idiv (* $pool (ahadi-release-bp $eligible $target)) 10000))
; place amount = award pool x place share
(= (ahadi-place-cents $award $share-bp) (ahadi-idiv (* $award $share-bp) 10000))

(= (ahadi-propose $event $place)
   (let $decision (ahadi-decide (sread (py-call (ahadi.facts_for_place $event $place))))
     (py-call (ahadi.propose_place $event $place (repr $decision)))))`

/** omega/plugins/ahadi/ahadi.metta: what to do after a network failure. */
export const METTA_NEXT_STEP = `(= (ahadi-next-step op_no_destination) claimable)
(= (ahadi-next-step op_no_trust) claimable)
(= (ahadi-next-step op_not_authorized) claimable)
(= (ahadi-next-step tx_too_late) re-propose)
(= (ahadi-next-step tx_bad_seq) re-propose)`

/** bridge/ahadi_bridge/main.py: the agreement check before anything is proposed (abridged). */
export const PY_AGREE = `# what Omega decided, and the Python mirror on the same facts
metta = _parse_metta(body.get("metta_decision", ""))
py = decide(engine.rule(eid), req, facts)
py_allowed = bool(py and py.allowed)
agree = (metta["allowed"] == py_allowed) and (
    not py_allowed or metta["route"] == py.route)
hub.publish("decision", metta=metta, agree=agree, ...)
if metta["allowed"] and agree:
    engine.propose_payout(eid, req, ...)  # unsigned proposal
else:
    # refused, or the two disagree: record why
    reasons.append("MeTTa and the bridge disagreed, "
                   "so nothing was signed")`

export const TS_STREAM = `// Render ledger lines as they happen, with no polling.
type LedgerLine = { seq: number; kind: string; party: string | null; amount_cents: number; tx_hash: string | null }

const usd = (c: number) => \`USD \${(c / 100).toFixed(2)}\`
let lastId = Number(localStorage.getItem("ahadi.lastId") ?? 0)

const es = new EventSource(\`/api/stream?after=\${lastId}\`)

es.onmessage = (msg) => {
  const ev = JSON.parse(msg.data)
  lastId = ev.id
  localStorage.setItem("ahadi.lastId", String(lastId))  // resume here after a reload

  if (ev.kind !== "ledger") return
  const line: LedgerLine = ev.line
  render(\`#\${line.seq} \${line.kind} \${line.party ?? ""} \${usd(line.amount_cents)}\`)
}

function render(text: string) {
  const li = document.createElement("li")
  li.textContent = text
  document.querySelector("#ledger")!.prepend(li)
}`

export const TS_VERIFY = `// Check a receipt: is it on testnet, and does the chain match the ledger?
type Verify = {
  found_on_chain: boolean
  tx?: { hash: string; ledger: number; memo_hex: string | null; successful: boolean }
  signers?: string[]
  checks?: { name: "memo" | "two-signatures"; passed: boolean; text: string }[]
}

async function verifyReceipt(txHash: string): Promise<boolean> {
  const res = await fetch(\`/api/verify/\${txHash}\`)
  if (!res.ok) throw new Error((await res.json()).detail)  // 400 if not 64 hex characters

  const v: Verify = await res.json()
  if (!v.found_on_chain) return false
  return (v.checks ?? []).length > 0 && v.checks!.every((c) => c.passed)
}

await verifyReceipt("ab4e8a838e9991733eb4610182bb68707d13c964121e0204b1571a4753f55a76") // true`
