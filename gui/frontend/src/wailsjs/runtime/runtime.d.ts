// Stub type declarations for Wails runtime.
// The real implementation is generated at build time by `wails build` / `wails dev`.
export declare function EventsOn<T = unknown>(eventName: string, callback: (data: T) => void): () => void
export declare function EventsOff(...eventNames: string[]): void
export declare function EventsEmit(eventName: string, ...data: unknown[]): void
export declare function LogDebug(msg: string): void
export declare function LogInfo(msg: string): void
export declare function LogWarning(msg: string): void
export declare function LogError(msg: string): void
