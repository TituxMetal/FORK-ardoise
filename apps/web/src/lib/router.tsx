import {
  useEffect,
  useState,
  type AnchorHTMLAttributes,
  type MouseEvent,
  type ReactNode
} from 'react'

export type Route =
  | { name: 'groups' }
  | { name: 'group'; id: string }
  | { name: 'invite'; secret: string }
  | { name: 'auth' }

export const parsePath = (path: string): Route => {
  const group = path.match(/^\/groups\/([^/]+)$/)
  if (group) {
    return { name: 'group', id: group[1] }
  }
  const invite = path.match(/^\/invites\/([^/]+)$/)
  if (invite) {
    return { name: 'invite', secret: invite[1] }
  }
  if (path === '/session') {
    return { name: 'auth' }
  }
  return { name: 'groups' }
}

const listeners = new Set<() => void>()

export const navigate = (path: string) => {
  window.history.pushState(null, '', path)
  listeners.forEach(listener => listener())
}

export const useRoute = (): Route => {
  const [route, setRoute] = useState<Route>(() => parsePath(window.location.pathname))
  useEffect(() => {
    const onChange = () => setRoute(parsePath(window.location.pathname))
    listeners.add(onChange)
    window.addEventListener('popstate', onChange)
    return () => {
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
