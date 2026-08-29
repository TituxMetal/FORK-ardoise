import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode
} from 'react'
import { Hono } from 'hono'

export type Route =
  | { name: 'groups' }
  | { name: 'group'; id: string }
  | { name: 'invite'; secret: string }
  | { name: 'auth' }

const groupsRoute = { name: 'groups' } satisfies Route

export const app = new Hono()
  .get('/', c => c.json(groupsRoute))
  .get('/groups/:id', c => c.json({ name: 'group', id: c.req.param('id') } satisfies Route))
  .get('/invites/:secret', c =>
    c.json({ name: 'invite', secret: c.req.param('secret') } satisfies Route)
  )
  .get('/session', c => c.json({ name: 'auth' } satisfies Route))
  .notFound(c => c.json(groupsRoute))

const resolvePath = async (path: string): Promise<Route> => {
  const response = await app.fetch(new Request(path))
  return (await response.json()) as Route
}

const listeners = new Set<() => void>()

export const navigate = (path: string) => {
  window.history.pushState(null, '', path)
  listeners.forEach(listener => listener())
}

export const useRoute = (): Route | null => {
  const [route, setRoute] = useState<Route | null>(null)
  useEffect(() => {
    let disposed = false
    const onChange = () => {
      const path = window.location.pathname
      void resolvePath(path).then(next => {
        if (!disposed && window.location.pathname === path) {
          setRoute(next)
        }
      })
    }
    onChange()
    listeners.add(onChange)
    window.addEventListener('popstate', onChange)
    return () => {
      disposed = true
      listeners.delete(onChange)
      window.removeEventListener('popstate', onChange)
    }
  }, [])
  return route
}

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to: string
  children: ReactNode
}

export const Link = ({ to, children, onClick, target, download, ...rest }: LinkProps) => {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey ||
      (target && target !== '_self') ||
      download
    ) {
      return
    }
    event.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} target={target} download={download} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
