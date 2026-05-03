import type { FormValues } from '../types/transfer'
import { inputClass } from '../helpers/styles'

interface Props {
  form: FormValues
  setField: (key: keyof FormValues, value: string | number) => void
  fatalError: string | null
  onSubmit: (e: React.FormEvent) => void
}

export function TransferForm({ form, setField, fatalError, onSubmit }: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {/* Linear */}
      <div className="bg-[#efe9de] rounded-xl p-6 space-y-4">
        <p className="text-[11px] font-medium text-[#6c6a64] uppercase tracking-[1.4px]">Linear</p>
        <div>
          <label className="block text-sm font-medium text-[#252523] mb-1.5">API Key</label>
          <input
            type="password"
            value={form.linearApiKey}
            onChange={e => setField('linearApiKey', e.target.value)}
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
            onChange={e => setField('linearTeamId', e.target.value)}
            placeholder="e.g. TEAM-123"
            className={inputClass}
          />
        </div>
      </div>

      {/* GitHub */}
      <div className="bg-[#efe9de] rounded-xl p-6 space-y-4">
        <p className="text-[11px] font-medium text-[#6c6a64] uppercase tracking-[1.4px]">GitHub</p>
        <div>
          <label className="block text-sm font-medium text-[#252523] mb-1.5">
            Personal Access Token
          </label>
          <input
            type="password"
            value={form.githubToken}
            onChange={e => setField('githubToken', e.target.value)}
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
              onChange={e => setField('githubOwner', e.target.value)}
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
              onChange={e => setField('githubRepo', e.target.value)}
              placeholder="repo-name"
              required
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="bg-[#efe9de] rounded-xl p-6">
        <div className="max-w-[200px]">
          <label className="block text-sm font-medium text-[#252523] mb-1.5">
            Delay between requests <span className="font-normal text-[#a09d96]">(ms)</span>
          </label>
          <input
            type="number"
            value={form.delayMs}
            onChange={e => setField('delayMs', Number(e.target.value))}
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
  )
}
