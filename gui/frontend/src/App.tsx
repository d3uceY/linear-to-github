import { useState, useEffect, useRef } from 'react'
import { EventsOn } from '../wailsjs/runtime/runtime'
import { Transfer } from '../wailsjs/go/main/App'

interface FormValues {
  linearApiKey: string
  githubToken: string
  githubOwner: string
  githubRepo: string
  linearTeamId: string
  delayMs: number
}

interface ProgressInfo {
  current: number
  total: number
  id: string
  title: string
}

interface TransferResult {
  id: string
  title: string
  url: string
  success: boolean
  error?: string
}

type TransferState = 'idle' | 'running' | 'done' | 'error'

const SERIF = '"Tiempos Headline", "Cormorant Garamond", Garamond, "Times New Roman", serif'

const inputClass =
  'w-full h-10 px-3.5 bg-[#faf9f5] border border-[#e6dfd8] rounded-lg text-sm text-[#141413] placeholder:text-[#a09d96] focus:outline-none focus:border-[#cc785c] focus:ring-2 focus:ring-[#cc785c]/15 transition-colors'

export default function App() {
  const [state, setState] = useState<TransferState>('idle')
  const [form, setForm] = useState<FormValues>({
    linearApiKey: '',
    githubToken: '',
    githubOwner: '',
    githubRepo: '',
    linearTeamId: '',
    delayMs: 1000,
  })
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  const [results, setResults] = useState<TransferResult[]>([])
  const [fatalError, setFatalError] = useState<string | null>(null)
  const resultsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const offs = [
      EventsOn('transfer:progress', (data: ProgressInfo) => setProgress(data)),
      EventsOn('transfer:result', (data: TransferResult) =>
        setResults(prev => [...prev, data]),
      ),
      EventsOn('transfer:done', () => setState('done')),
    ]
    return () => offs.forEach(off => off())
  }, [])

  useEffect(() => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [results])

  const field = (key: keyof FormValues, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState('running')
    setResults([])
    setProgress(null)
    setFatalError(null)
    try {
      await Transfer({
        linearApiKey: form.linearApiKey,
        githubToken: form.githubToken,
        githubOwner: form.githubOwner,
        githubRepo: form.githubRepo,
        linearTeamId: form.linearTeamId,
        delayMs: form.delayMs,
      })
    } catch (err) {
      setFatalError(String(err))
      setState('error')
    }
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      {/* Nav */}
      <header className="h-14 border-b border-[#e6dfd8] bg-[#faf9f5] flex items-center px-8 gap-2.5">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1v16M1 9h16M3.64 3.64l10.72 10.72M14.36 3.64L3.64 14.36"
            stroke="#141413"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontFamily: SERIF, letterSpacing: '-0.3px' }} className="text-[#141413] text-base">
          Linear to GitHub
        </span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1
            style={{ fontFamily: SERIF, letterSpacing: '-0.5px' }}
            className="text-[38px] font-normal leading-tight text-[#141413] mb-2"
          >
            Transfer Issues
          </h1>
          <p className="text-[#6c6a64] text-[15px] leading-relaxed">
            Move Linear issues into a GitHub repository as GitHub Issues.
          </p>
        </div>

        {/* Form */}
        {(state === 'idle' || state === 'error') && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[#efe9de] rounded-xl p-6 space-y-4">
              <p className="text-[11px] font-medium text-[#6c6a64] uppercase tracking-[1.4px]">Linear</p>
              <div>
                <label className="block text-sm font-medium text-[#252523] mb-1.5">API Key</label>
                <input
                  type="password"
                  value={form.linearApiKey}
                  onChange={e => field('linearApiKey', e.target.value)}
                  placeholder="lin_api_..."
                  required
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#252523] mb-1.5">
                  Team ID <span className="font-normal text-[#a09d96]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.linearTeamId}
                  onChange={e => field('linearTeamId', e.target.value)}
                  placeholder="e.g. TEAM-123"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="bg-[#efe9de] rounded-xl p-6 space-y-4">
              <p className="text-[11px] font-medium text-[#6c6a64] uppercase tracking-[1.4px]">GitHub</p>
              <div>
                <label className="block text-sm font-medium text-[#252523] mb-1.5">Personal Access Token</label>
                <input
                  type="password"
                  value={form.githubToken}
                  onChange={e => field('githubToken', e.target.value)}
                  placeholder="ghp_..."
                  required
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#252523] mb-1.5">Owner</label>
                  <input
                    type="text"
                    value={form.githubOwner}
                    onChange={e => field('githubOwner', e.target.value)}
                    placeholder="username or org"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#252523] mb-1.5">Repository</label>
                  <input
                    type="text"
                    value={form.githubRepo}
                    onChange={e => field('githubRepo', e.target.value)}
                    placeholder="repo-name"
                    required
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#efe9de] rounded-xl p-6">
              <div className="max-w-[200px]">
                <label className="block text-sm font-medium text-[#252523] mb-1.5">
                  Delay between requests <span className="font-normal text-[#a09d96]">(ms)</span>
                </label>
                <input
                  type="number"
                  value={form.delayMs}
                  onChange={e => field('delayMs', Number(e.target.value))}
                  min={0}
                  className={inputClass}
                />
              </div>
            </div>

            {fatalError && (
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-5 py-4">
                <p className="text-sm text-[#c64545] leading-relaxed">{fatalError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-[#cc785c] hover:bg-[#a9583e] active:bg-[#a9583e] text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Start Transfer
            </button>
          </form>
        )}

        {/* Progress & Results */}
        {(state === 'running' || state === 'done') && (
          <div className="space-y-4">
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

            {results.length > 0 && (
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
                  <div ref={resultsEndRef} />
                </div>
              </div>
            )}

            {state === 'done' && failureCount > 0 && (
              <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-5 py-4">
                <p className="text-sm font-medium text-[#c64545] mb-1">
                  {failureCount} issue{failureCount > 1 ? 's' : ''} failed to transfer
                </p>
                <p className="text-xs text-[#c64545]/80">
                  Check your GitHub token permissions or retry these issues manually.
                </p>
              </div>
            )}

            {state === 'done' && (
              <button
                type="button"
                onClick={() => {
                  setState('idle')
                  setResults([])
                  setProgress(null)
                  setFatalError(null)
                }}
                className="w-full h-11 bg-[#efe9de] hover:bg-[#e8e0d2] text-[#3d3d3a] text-sm font-medium rounded-lg transition-colors cursor-pointer"
              >
                New Transfer
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
