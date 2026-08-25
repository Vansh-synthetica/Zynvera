export const BP = process.env.NEXT_PUBLIC_BASE_PATH || ''

/** Prefix an app path with the configured basePath (for raw window.location). */
export const withBase = (p: string) => (p.startsWith('/') ? BP + p : p)
