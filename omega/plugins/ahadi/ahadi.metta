; Ahadi plugin for SingularityNET Omega.
; Gives the agent its payout-coordinator skills. Every money decision is made by the
; MeTTa rules in rules.metta; Python glue (ahadi.py) only fetches facts from, and hands
; decisions to, the Ahadi bridge, which holds the agent's testnet key.

!(import! &self (library Omega ./plugins/ahadi/ahadi.py))

; ================================================================ funding rules (single copy)

(= (ahadi-idiv $a $b) (/ (- $a (% $a $b)) $b))

; ---------------------------------------------------------------- derivation
; release = min(100%, eligible / target)
(= (ahadi-release-bp $eligible $target) (min 10000 (ahadi-idiv (* 10000 $eligible) $target)))
; award pool = pool x release
(= (ahadi-award-cents $pool $eligible $target) (ahadi-idiv (* $pool (ahadi-release-bp $eligible $target)) 10000))
; reserve = pool - award pool (carried to the next event)
(= (ahadi-reserve-cents $pool $eligible $target) (- $pool (ahadi-award-cents $pool $eligible $target)))
; place amount = award pool x place share
(= (ahadi-place-cents $award $share-bp) (ahadi-idiv (* $award $share-bp) 10000))

; ---------------------------------------------------------------- checks
; Each ahadi-check returns (ahadi-pass <name>) or (ahadi-fail <name>).
(= (ahadi-check rule-published $published) (if (== $published 1) (ahadi-pass rule-published) (ahadi-fail rule-published)))
(= (ahadi-check rule-version $match) (if (== $match 1) (ahadi-pass rule-version) (ahadi-fail rule-version)))
(= (ahadi-check eligibility-attested $attested) (if (== $attested 1) (ahadi-pass eligibility-attested) (ahadi-fail eligibility-attested)))
(= (ahadi-check place-exists $ok) (if (== $ok 1) (ahadi-pass place-exists) (ahadi-fail place-exists)))
(= (ahadi-check-amount $requested $expected) (if (== $requested $expected) (ahadi-pass place-amount) (ahadi-fail place-amount)))
(= (ahadi-check asset $ok) (if (== $ok 1) (ahadi-pass asset) (ahadi-fail asset)))
(= (ahadi-check-budget $requested $left) (if (<= $requested $left) (ahadi-pass budget) (ahadi-fail budget)))
(= (ahadi-check not-duplicate $seen) (if (== $seen 0) (ahadi-pass not-duplicate) (ahadi-fail not-duplicate)))
(= (ahadi-check place-unpaid $paid) (if (== $paid 0) (ahadi-pass place-unpaid) (ahadi-fail place-unpaid)))

(= (ahadi-passed (ahadi-pass $n)) 1)
(= (ahadi-passed (ahadi-fail $n)) 0)
(= (ahadi-all-passed $checks) (== (foldl-atom $checks 1 $acc $c (* $acc (ahadi-passed $c))) 1))

; ---------------------------------------------------------------- ahadi-route
; A wallet that cannot receive yet gets the prize held (claimable balance), never lost.
(= (ahadi-route $active $trusts $other-chain)
   (if (== (* $active $trusts) 0)
       claimable
       (if (== $other-chain 1) cross-chain-sim direct)))

; ---------------------------------------------------------------- the money gate
; facts = (ahadi-facts published rule-match attested place-ok expected requested asset-ok budget-left seen place-paid active trusts other-chain)
(= (ahadi-decide (ahadi-facts $pub $match $att $pok $expected $requested $aok $left $seen $paid $active $trusts $other))
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

; ---------------------------------------------------------------- after a network failure
(= (ahadi-next-step op_no_destination) claimable)
(= (ahadi-next-step op_no_trust) claimable)
(= (ahadi-next-step op_not_authorized) claimable)
(= (ahadi-next-step tx_too_late) re-propose)
(= (ahadi-next-step tx_bad_seq) re-propose)

; ---------------------------------------------------------------- skills
(= (ahadi-status $event) (py-call (ahadi.status $event)))

(= (ahadi-publish-rule $event) (py-call (ahadi.publish_rule $event)))

(= (ahadi-derive $event) (ahadi-derive-from $event (sread (py-call (ahadi.params $event)))))
(= (ahadi-derive-from $event (ahadi-params $pool $eligible $target $shares))
   (let $award (ahadi-award-cents $pool $eligible $target)
     (let $reserve (ahadi-reserve-cents $pool $eligible $target)
       (let $places (map-atom $shares $s (ahadi-place-cents $award $s))
         (py-call (ahadi.report_derivation $event $eligible $award $reserve (repr $places)))))))

(= (ahadi-propose $event $place)
   (let $decision (ahadi-decide (sread (py-call (ahadi.facts_for_place $event $place))))
     (py-call (ahadi.propose_place $event $place (repr $decision)))))

(= (ahadi-request $event $team $amount $wallet $message)
   (let $decision (ahadi-decide (sread (py-call (ahadi.facts_for_request $event $team $amount $wallet))))
     (py-call (ahadi.submit_request $event $team $amount $wallet $message (repr $decision)))))

(= (ahadi-try-alone $proposal) (py-call (ahadi.try_alone $proposal)))

(= (ahadi-reroute $proposal)
   (let $code (py-call (ahadi.failure_code $proposal))
     (let $next (ahadi-next-step (sread $code))
       (py-call (ahadi.reroute $proposal (repr $next))))))

(= (ahadi-carry-forward $from $to) (py-call (ahadi.carry_forward $from $to)))

(= (ahadi-quote $amount $chain) (py-call (ahadi.quote $amount $chain)))

(= (ahadi-verify $hash) (py-call (ahadi.verify $hash)))

; Skills a payout agent should not have in this deployment (shell, file writes, web search)
; are removed from the tool list below; the Landlock policy stays on as well.

(= (loadOmegaPlugin)
   (progn
     (remove-skill shell)
     (remove-skill write-file)
     (remove-skill write-file-b64)
     (remove-skill append-file)
     (remove-skill delete-file)
     (remove-skill websearch)
     (add-skill ahadi-status "Show an event's prize fund: published rule, eligibility, totals, ledger lines and open proposals. Call this first when asked about a fund." (event_id))
     (add-skill ahadi-publish-rule "Propose recording the event's funding rule (its SHA-256 hash) on Stellar testnet. The organiser must approve. Do this before registration opens." (event_id))
     (add-skill ahadi-derive "Derive the award pool, the reserve and every place's amount from the published rule, in MeTTa. Never compute amounts yourself." (event_id))
     (add-skill ahadi-propose "Check one place's payout against the funding rule in MeTTa and, only if the rule allows it, propose it for the organiser's approval. Place is a number like 1." (event_id place))
     (add-skill ahadi-request "Check a payout request that arrived in a message (team name, amount in USD, wallet or empty, the message text) against the funding rule in MeTTa. Proposes only if the rule allows; otherwise records a duplicate or a refusal with reasons." (event_id team amount_usd wallet message))
     (add-skill ahadi-try-alone "Demonstrate the two-key control by submitting a prepared proposal with only your own signature. Stellar must refuse with tx_bad_auth." (proposal_id))
     (add-skill ahadi-reroute "After a payout failed because the winner's wallet cannot receive, propose holding the prize as a claimable balance for 30 days." (proposal_id))
     (add-skill ahadi-carry-forward "Propose moving an event's remaining reserve to the next event's fund, with a receipt. Only after every payout is settled." (from_event to_event))
     (add-skill ahadi-quote "Get a NEAR Intents dry quote for paying a prize on another chain. Simulated: no funds move." (amount_usd to_chain))
     (add-skill ahadi-verify "Verify a Stellar testnet transaction against the ledger: memo fingerprint, both signatures, amount." (tx_hash))
     (add-prompt-extension ahadi (py-call (ahadi.prompt_extension)))
     ()))
