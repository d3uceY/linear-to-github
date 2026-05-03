import { useTransfer } from './hooks/useTransfer'
import { NavBar } from './components/NavBar'
import { TransferForm } from './components/TransferForm'
import { ProgressCard, ResultsList, FailureBanner } from './components/TransferProgress'
import { SERIF } from './helpers/styles'
import './App.css'

export default function App() {
  const {
    state,
    form,
    setField,
    submit,
    reset,
    progress,
    results,
    fatalError,
    successCount,
    failureCount,
    resultsEndRef,
  } = useTransfer()

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <NavBar />

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

        {(state === 'idle' || state === 'error') && (
          <TransferForm
            form={form}
            setField={setField}
            fatalError={fatalError}
            onSubmit={submit}
          />
        )}

        {(state === 'running' || state === 'done') && (
          <div className="space-y-4">
            <ProgressCard
              state={state}
              progress={progress}
              successCount={successCount}
              failureCount={failureCount}
            />
            <ResultsList results={results} endRef={resultsEndRef} />
            {state === 'done' && <FailureBanner count={failureCount} />}
            {state === 'done' && (
              <button
                type="button"
                onClick={reset}
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
