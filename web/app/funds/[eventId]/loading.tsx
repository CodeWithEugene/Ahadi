export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading the ledger">
      <div className="border-b bg-card">
        <div className="ahadi-page flex flex-col items-center pt-10 pb-10">
          <div className="h-4 w-48 self-start animate-pulse rounded bg-paper-2" />
          <div className="mt-8 h-12 w-2/3 max-w-xl animate-pulse rounded-lg bg-paper-2" />
          <div className="mt-4 h-5 w-80 max-w-full animate-pulse rounded bg-paper-2" />
          <div className="mt-8 h-20 w-full animate-pulse rounded-2xl bg-paper-2/70" />
        </div>
      </div>
      <div className="ahadi-page flex flex-col items-center py-12">
        <div className="h-8 w-72 max-w-full animate-pulse rounded-lg bg-paper-2" />
        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-paper-2" />
        <div className="mt-8 h-72 w-full animate-pulse rounded-2xl bg-paper-2/70" />
      </div>
    </div>
  )
}
