import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite-plus'

export const startApi = (): Plugin => {
  let child: ChildProcess | undefined

  return {
    name: 'start-api',
    apply: 'serve',
    configureServer(server) {
      const apiRoot = fileURLToPath(new URL('../api', import.meta.url))
      child = spawn('bun', ['--watch', 'src/main.ts'], {
        cwd: apiRoot,
        stdio: 'inherit',
        env: { ...process.env, PORT: '3000' }
      })

      const stop = () => {
        child?.kill()
        child = undefined
      }

      server.httpServer?.once('close', stop)
      process.once('exit', stop)
    }
  }
}
