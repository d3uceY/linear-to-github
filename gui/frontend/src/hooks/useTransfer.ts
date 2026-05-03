import { useState, useEffect, useRef } from 'react'
import { EventsOn } from '../../wailsjs/runtime/runtime'
import { Transfer } from '../../wailsjs/go/main/App'
import type { FormValues, ProgressInfo, TransferResult, TransferState } from '../types/transfer'

const defaultForm: FormValues = {
  linearApiKey: '',
  githubToken: '',
  githubOwner: '',
  githubRepo: '',
  linearTeamId: '',
  delayMs: 1000,
}

export function useTransfer() {
  const [state, setState] = useState<TransferState>('idle')
  const [form, setForm] = useState<FormValues>(defaultForm)
  const [progress, setProgress] = useState<ProgressInfo | null>(null)
  const [results, setResults] = useState<TransferResult[]>([])
  const [fatalError, setFatalError] = useState<string | null>(null)
  const resultsEndRef = useRef<HTMLDivElement | null>(null)

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

  const setField = (key: keyof FormValues, value: string | number) =>
    setForm(f => ({ ...f, [key]: value }))

  const submit = async (e: React.FormEvent) => {
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

  const reset = () => {
    setState('idle')
    setResults([])
    setProgress(null)
    setFatalError(null)
  }

  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length

  return {
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
  }
}
