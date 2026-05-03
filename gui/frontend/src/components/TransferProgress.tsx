import type { ProgressInfo, TransferResult, TransferState } from '../types/transfer'

interface Props {
  state: TransferState
  progress: ProgressInfo | null
  successCount: number
  failureCount: number
}

export function ProgressCard({ state, progress, successCount, failureCount }: Props) {
  return (
    <div className="bg-[#efe9de] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {state === 'running' ? (
            <svg className="w-4 h-4 text-[#cc785c] animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-[#5db872]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span className="text-sm font-medium text-[#252523]">
            {state === 'running' ? 'Transferring…' : 'Transfer complete'}
          </span>
        </div>
        <span className="text-sm text-[#6c6a64]">
          <span className="text-[#5db872] font-medium">{successCount}</span> transferred
          {failureCount > 0 && (
            <> · <span className="text-[#c64545] font-medium">{failureCount}</span> failed</>
          )}
          {progress && ` · ${progress.total} total`}
        </span>
      </div>

      {progress && (
        <>
          <div className="h-1.5 bg-[#e8e0d2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#cc785c] rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          {state === 'running' && (
            <p className="mt-2 text-xs text-[#6c6a64] truncate">
              [{progress.current}/{progress.total}]{' '}
              <span className="font-medium text-[#3d3d3a]">{progress.id}</span> — {progress.title}
            </p>
          )}
        </>
      )}
    </div>
  )
}

interface ResultsListProps {
  results: TransferResult[]
  endRef: React.RefObject<HTMLDivElement | null>
}

export function ResultsList({ results, endRef }: ResultsListProps) {
  if (results.length === 0) return null
  return (
    <div className="bg-[#181715] rounded-xl overflow-hidden">
      <div className="divide-y divide-[#252320] max-h-[420px] overflow-y-auto">
        {results.map((r, i) => (
          <div key={i} className="px-5 py-3 flex items-start gap-3">
            {r.success ? (
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#5db872]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4 mt-0.5 shrink-0 text-[#c64545]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-medium text-[#a09d96] shrink-0 font-mono">{r.id}</span>
                <span className="text-sm text-[#faf9f5] truncate">{r.title}</span>
              </div>
              {r.success && r.url && (
                <span className="text-xs text-[#cc785c] truncate block mt-0.5">{r.url}</span>
              )}
              {!r.success && r.error && (
                <p className="text-xs text-[#c64545] mt-0.5">{r.error}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  )
}

interface FailureBannerProps {
  count: number
}

export function FailureBanner({ count }: FailureBannerProps) {
  if (count === 0) return null
  return (
    <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-5 py-4">
      <p className="text-sm font-medium text-[#c64545] mb-1">
        {count} issue{count > 1 ? 's' : ''} failed to transfer
      </p>
      <p className="text-xs text-[#c64545]/80">
        Check your GitHub token permissions or retry these issues manually.
      </p>
    </div>
  )
}
