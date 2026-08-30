import { atom } from 'nanostores'
import type { Group, GroupsClient } from '../types'

export const $group = atom<Group | null>(null)
export const $error = atom('')

// Generation guard: every load/refresh/apply bumps it, so a stale async
// result (a load that resolves after the route changed or the page
// unmounted) never commits over a newer one.
let requestId = 0

export const clearGroup = () => {
  requestId++
  $group.set(null)
  $error.set('')
}

export const applyGroup = (group: Group) => {
  requestId++
  $group.set(group)
  $error.set('')
}

export const loadGroup = async (groups: GroupsClient, id: string) => {
  const current = ++requestId
  $group.set(null)
  $error.set('')
  try {
    const group = await groups.get(id)
    if (requestId === current) $group.set(group)
  } catch {
    if (requestId === current) $error.set('Groupe introuvable')
  }
}

export const refreshGroup = async (groups: GroupsClient, id: string) => {
  const current = ++requestId
  try {
    const group = await groups.get(id)
    if (requestId === current) applyGroup(group)
  } catch {
    if (requestId === current) $error.set('Groupe introuvable')
  }
}
