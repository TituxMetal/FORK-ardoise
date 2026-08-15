import { createApp } from './CreateApp.ts'

const port = Number(process.env.PORT ?? 3000)

Bun.serve({
  port,
  fetch: createApp().fetch
})

console.log(`api listening on http://localhost:${port}`)
