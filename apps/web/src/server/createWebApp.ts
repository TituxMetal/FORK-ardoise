import { readFile } from 'node:fs/promises'
import { extname, join, resolve, sep } from 'node:path'
import { Hono } from 'hono'

type WebAppOptions = {
  /** Directory holding the production build (`apps/web/dist`) the server answers from. */
  staticRoot: string
  /** Origin of the API the `/api` routes are forwarded to, e.g. `http://fork-ardoise-api:3000`. */
  apiUrl: string
}

const contentTypes: Record<string, string> = {
  '.css': 'text/css; charset=UTF-8',
  '.html': 'text/html; charset=UTF-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.map': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=UTF-8',
  '.webmanifest': 'application/manifest+json',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2'
}

// Hop-by-hop headers (RFC 9110 §7.6.1) belong to the connection, not to the caller: the
// standard set, plus every field the incoming `Connection` names — see `copyHeaders`. `host`
// and the framing headers are recomputed by fetch and by the runtime; and the body the
// runtime hands back is already decoded, so its `content-encoding` no longer describes it.
const hopByHopHeaders = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade'
]
const droppedRequestHeaders = [...hopByHopHeaders, 'content-length', 'host']
const droppedResponseHeaders = [...hopByHopHeaders, 'content-encoding', 'content-length']

// A `Headers` copy keeps the several `Set-Cookie` headers better-auth answers a sign-in with
// apart; every comma-joined view — `forEach`, `Object.fromEntries` — collapses them into one,
// and the browser then stores a single mangled cookie.
// Those named lists are not the whole drop set: RFC 9110 §7.6.1 also makes hop-by-hop every
// field the incoming `Connection` names, so a peer answering `Connection: close, X-Internal`
// must not have `X-Internal` forwarded. The tokens are read before the first delete, which is
// what removes `connection` itself.
const copyHeaders = (source: Headers, dropped: string[]): Headers => {
  const nominated = (source.get('connection') ?? '')
    .split(',')
    .map(token => token.trim())
    .filter(token => token !== '')
  const headers = new Headers(source)
  for (const name of [...dropped, ...nominated]) {
    headers.delete(name)
  }
  return headers
}

const staticFile = async (root: string, pathname: string): Promise<Response | null> => {
  const file = resolve(root, `.${pathname}`)
  if (!file.startsWith(`${root}${sep}`)) {
    return null
  }
  try {
    return new Response(await readFile(file), {
      headers: { 'content-type': contentTypes[extname(file)] ?? 'application/octet-stream' }
    })
  } catch {
    return null
  }
}

const forwardToApi = async (request: Request, apiUrl: string): Promise<Response> => {
  const url = new URL(request.url)
  const target = new URL(apiUrl)
  target.pathname = url.pathname.replace(/^\/api/, '') || '/'
  target.search = url.search

  const upstream = await fetch(target, {
    method: request.method,
    headers: copyHeaders(request.headers, droppedRequestHeaders),
    body:
      request.method === 'GET' || request.method === 'HEAD' ? null : await request.arrayBuffer(),
    redirect: 'manual'
  })

  return new Response(upstream.body, {
    status: upstream.status,
    headers: copyHeaders(upstream.headers, droppedResponseHeaders)
  })
}

/** The production web server: the built SPA, with `/api/*` proxied to the API. */
export const createWebApp = ({ staticRoot, apiUrl }: WebAppOptions) =>
  new Hono()
    .all('/api', c => forwardToApi(c.req.raw, apiUrl))
    .all('/api/*', c => forwardToApi(c.req.raw, apiUrl))
    .get('*', async c => {
      const file = await staticFile(staticRoot, c.req.path)
      if (file) {
        return file
      }
      return new Response(await readFile(join(staticRoot, 'index.html')), {
        headers: { 'content-type': 'text/html; charset=UTF-8' }
      })
    })

export type WebApp = ReturnType<typeof createWebApp>
