import { atom } from 'nanostores'
import type { Group, GroupsClient, SlateTab } from '../types'

export const $group = atom<Group | null>(null)
export const $error = atom('')
// The Slate screen state (active tab, open create form) is owned here, at the
// screen level, per the #76 state contract; the page and SlateTabs subscribe.
export const $activeTab = atom<SlateTab>('expenses')
export const $formOpen = atom(false)
// The entry being edited (by kind and id), owned here at the screen level like
// the create form; create and edit are mutually exclusive.
export const $editing = atom<{ kind: SlateTab; id: string } | null>(null)

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
  $editing.set(null)
}

export const applyGroup = (group: Group) => {
  requestId++
  $group.set(group)
  $error.set('')
}

// Switching tab closes an open create form and an open edit; clicking the
// already-active tab is a no-op so an open draft is never discarded by a tab
// re-click.
export const setActiveTab = (next: SlateTab) => {
  if (next === $activeTab.get()) return
  $activeTab.set(next)
  $formOpen.set(false)
  $editing.set(null)
}

// The + is open-only: its announced action ("Ajouter…") always matches what
// it does. Closing an open form is the form's Annuler button.
export const openForm = () => {
  $editing.set(null)
  $formOpen.set(true)
}
export const closeForm = () => $formOpen.set(false)

// Opening an edit closes the create form; the edit form's Annuler and its
// successful save both cancel the edit.
export const startEdit = (entry: { kind: SlateTab; id: string }) => {
  $formOpen.set(false)
  $editing.set(entry)
}
export const cancelEdit = () => $editing.set(null)

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
