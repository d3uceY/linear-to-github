// Stub type declarations for the generated Wails Go bindings.
// The real implementation is generated at build time by `wails build` / `wails dev`.

export interface TransferOptions {
  linearApiKey: string
  githubToken: string
  githubOwner: string
  githubRepo: string
  linearTeamId: string
  delayMs: number
}

export declare function Transfer(opts: TransferOptions): Promise<void>
