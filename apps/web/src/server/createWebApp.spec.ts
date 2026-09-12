import { once } from 'node:events'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vite-plus/test'
import { createWebApp, type WebApp } from './createWebApp'

const indexHtml = '<!doctype html><html lang="fr"><div id="root"></div></html>'
const sessionCookie = 'better-auth.session_token=session-token; Path=/; HttpOnly'
const dontRememberCookie = 'dont_remember=false; Path=/; Max-Age=2592000'
const signInBody = JSON.stringify({ email: 'bob@ardoise.test', password: 'secret' })

type UpstreamRequest = { method: string; url: string; body: string }
type Upstream = { server: Server; url: string; requests: UpstreamRequest[] }

// A throwaway API: it records what it receives, answers a sign-in the way better-auth does
// (a redirect with two `Set-Cookie` headers), and answers anything else with JSON.
const startUpstream = async (): Promise<Upstream> => {
  const requests: UpstreamRequest[] = []
  const server = createServer((request, response) => {
    const chunks: Buffer[] = []
    request.on('data', chunk => chunks.push(chunk))
    request.on('end', () => {
      requests.push({
        method: request.method ?? '',
        url: request.url ?? '',
        body: Buffer.concat(chunks).toString()
      })
      if (request.url === '/auth/sign-in/email') {
        response.writeHead(302, {
          location: 'https://ardoise.test/groups',
          'set-cookie': [sessionCookie, dontRememberCookie]
        })
        response.end()
        return
      }
      if (request.url === '/echo-headers') {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(JSON.stringify(request.headers))
        return
      }
      response.writeHead(200, {
        'content-type': 'application/json',
        connection: 'close, X-Upstream-Internal',
        'proxy-authenticate': 'Basic realm="ardoise"',
        trailer: 'X-Trailing',
        'x-upstream-internal': 'supabase-service-role'
      })
      response.end(JSON.stringify({ ok: true }))
    })
  })

  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const address = server.address()
  const port = typeof address === 'object' && address ? address.port : 0

  return { server, url: `http://127.0.0.1:${port}`, requests }
}

describe('createWebApp', () => {
  let staticRoot: string
  let upstream: Upstream
  let web: WebApp

  beforeAll(async () => {
    staticRoot = await mkdtemp(join(tmpdir(), 'ardoise-web-'))
    await mkdir(join(staticRoot, 'assets'))
    await writeFile(join(staticRoot, 'index.html'), indexHtml)
    await writeFile(join(staticRoot, 'assets/app.js'), 'export const ardoise = true')

    upstream = await startUpstream()
    web = createWebApp({ staticRoot, apiUrl: upstream.url })
  })

  afterAll(async () => {
    const closed = once(upstream.server, 'close')
    upstream.server.close()
    upstream.server.closeAllConnections()
    await closed
    await rm(staticRoot, { recursive: true, force: true })
  })

  it('serves the built index.html at the root', async () => {
    const response = await web.request('/')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=UTF-8')
    expect(await response.text()).toBe(indexHtml)
  })

  it('answers a deep link with the SPA index.html instead of a 404', async () => {
    const response = await web.request('/groups/xyz')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(indexHtml)
  })

  it('answers a path the server does not enumerate with the SPA index.html', async () => {
    const response = await web.request('/about')

    expect(response.status).toBe(200)
    expect(await response.text()).toBe(indexHtml)
  })

  it('serves a built asset with the content type the browser needs', async () => {
    const response = await web.request('/assets/app.js')

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/javascript; charset=UTF-8')
    expect(await response.text()).toBe('export const ardoise = true')
  })

  it('forwards /api/<route> to the API with the prefix stripped', async () => {
    const response = await web.request('/api/ping')

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(upstream.requests.at(-1)).toEqual({ method: 'GET', url: '/ping', body: '' })
  })

  it('returns the 3xx, its Location and every Set-Cookie header intact', async () => {
    const response = await web.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: signInBody
    })

    expect(response.status).toBe(302)
    expect(response.headers.get('location')).toBe('https://ardoise.test/groups')
    expect(response.headers.getSetCookie()).toEqual([sessionCookie, dontRememberCookie])
    expect(upstream.requests.at(-1)).toEqual({
      method: 'POST',
      url: '/auth/sign-in/email',
      body: signInBody
    })
  })

  it('drops the response headers the connection owns, including the one Connection names', async () => {
    const response = await web.request('/api/ping')

    expect(response.status).toBe(200)
    expect(response.headers.get('connection')).toBeNull()
    expect(response.headers.get('x-upstream-internal')).toBeNull()
    expect(response.headers.get('proxy-authenticate')).toBeNull()
    expect(response.headers.get('trailer')).toBeNull()
    expect(response.headers.get('content-type')).toBe('application/json')
  })

  it('drops the request headers the connection owns, including the one Connection names', async () => {
    const response = await web.request('/api/echo-headers', {
      headers: {
        authorization: 'Bearer session-token',
        connection: 'close, X-Internal',
        'x-internal': 'supabase-service-role',
        te: 'trailers',
        upgrade: 'h2c'
      }
    })

    expect(response.status).toBe(200)
    const forwarded = (await response.json()) as Record<string, string>
    expect(forwarded['x-internal']).toBeUndefined()
    expect(forwarded.te).toBeUndefined()
    expect(forwarded.upgrade).toBeUndefined()
    expect(forwarded.authorization).toBe('Bearer session-token')
  })
})
