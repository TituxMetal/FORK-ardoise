import type { Route } from './router'

export const resolvePage = (route: Route, session: { name: string } | null): Route => {
  if (route.name === 'invite') {
    return { name: 'invite', secret: route.secret }
  }
  if (route.name === 'about') {
    return { name: 'about' }
  }
  if (route.name === 'landing') {
    return session ? { name: 'groups' } : { name: 'landing' }
  }
  if (route.name === 'auth') {
    return session ? { name: 'groups' } : { name: 'auth' }
  }
  if (session === null) {
    return { name: 'auth' }
  }
  if (route.name === 'group') {
    return { name: 'group', id: route.id }
  }
  if (route.name === 'profile') {
    return { name: 'profile' }
  }
  return { name: 'groups' }
}
