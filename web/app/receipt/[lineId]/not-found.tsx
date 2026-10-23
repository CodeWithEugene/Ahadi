import { MissingState } from "@/components/ahadi/ledger/offline"

export default function ReceiptNotFound() {
  return (
    <MissingState title="No ledger line with that ID">
      Ledger line links look like /receipt/l_64f1409ef6. Check the link, or start from a fund&apos;s ledger and open the line from there.
    </MissingState>
  )
}
