export interface FormValues {
  linearApiKey: string
  githubToken: string
  githubOwner: string
  githubRepo: string
  linearTeamId: string
  delayMs: number
}

export interface ProgressInfo {
  current: number
  total: number
  id: string
  title: string
}

export interface TransferResult {
  id: string
  title: string
  url: string
  success: boolean
  error?: string
}

export type TransferState = 'idle' | 'running' | 'done' | 'error'
