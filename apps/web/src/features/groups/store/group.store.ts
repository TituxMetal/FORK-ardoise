import { atom } from 'nanostores'
import type { Group, GroupsClient, SlateTab } from '../types'

export const $group = atom<Group | null>(null)
export const $error = atom('')
// The Slate screen state (active tab, open create form) is owned here, at the
// screen level, per the #76 state contract; the page and SlateTabs subscribe.
export const $activeTab = atom<SlateTab>('expenses')
export const $formOpen = atom(false)

// Generation guard: every load/refresh/apply bumps it, so a stale async
// result (a load that resolves after the route changed or the page
// unmounted) never commits over a newer one.
let requestId = 0

export const clearGroup = () => {
  requestId++
  $group.set(null)
  $error.set('')
  $activeTab.set('expenses')
  $formOpen.set(false)
}

export const applyGroup = (group: Group) => {
  requestId++
  $group.set(group)
  $error.set('')
}

// Switching tab closes an open create form; clicking the already-active tab
// is a no-op so an open draft is never discarded by a tab re-click.
export const setActiveTab = (next: SlateTab) => {
  if (next === $activeTab.get()) return
  $activeTab.set(next)
  $formOpen.set(false)
}

// The + is open-only: its announced action ("Ajouter…") always matches what
// it does. Closing an open form is the form's Annuler button.
export const openForm = () => $formOpen.set(true)
export const closeForm = () => $formOpen.set(false)

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
