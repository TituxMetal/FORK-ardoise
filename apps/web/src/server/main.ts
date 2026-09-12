import { fileURLToPath } from 'node:url'
import { createWebApp } from './createWebApp'

const apiUrl = process.env.API_URL
if (!apiUrl) {
  console.error('API_URL is required; refusing to start.')
  process.exit(1)
}

const port = Number(process.env.PORT ?? 3000)

// Resolved from this file rather than the working directory: the image mirrors the
// repository layout, so `dist` sits two levels above `src/server`.
const staticRoot = fileURLToPath(new URL('../../dist', import.meta.url))

Bun.serve({
  port,
  fetch: createWebApp({ staticRoot, apiUrl }).fetch
})

console.log(`web listening on http://localhost:${port}`)
