import { MissingState } from "@/components/ahadi/ledger/offline"

export default function FundNotFound() {
  return (
    <MissingState title="No fund by that name">
      There is no event with that ID on Ahadi&apos;s ledger. It may have been typed wrong, or the link may be from another deployment.
    </MissingState>
  )
}
