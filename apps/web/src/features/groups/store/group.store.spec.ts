import { afterEach, describe, expect, it } from 'vite-plus/test'
import type { Group, GroupsClient } from '../types'
import {
  $activeTab,
  $error,
  $formOpen,
  $group,
  applyGroup,
  clearGroup,
  closeForm,
  loadGroup,
  openForm,
  refreshGroup,
  setActiveTab
} from './group.store'

const group = { id: 'g1', name: 'Potes de Bob' } as Group

afterEach(() => {
  clearGroup()
})

describe('group.store', () => {
  it('applies a Group and clears any load error', () => {
    $error.set('Groupe introuvable')

    applyGroup(group)

    expect($group.get()).toBe(group)
    expect($error.get()).toBe('')
  })

  it('loads a Group through the client', async () => {
    const groups = { get: async () => group } as unknown as GroupsClient

    await loadGroup(groups, 'g1')

    expect($group.get()).toBe(group)
    expect($error.get()).toBe('')
  })

  it('reports a load failure without leaving a stale Group', async () => {
    const groups = {
      get: async () => {
        throw new Error('nope')
      }
    } as unknown as GroupsClient

    await loadGroup(groups, 'g1')

    expect($group.get()).toBeNull()
    expect($error.get()).toBe('Groupe introuvable')
  })

  it('refreshes a Group without clearing the current one', async () => {
    applyGroup(group)
    const refreshed = { id: 'g1', name: 'Potes de Bob + invités' } as Group
    const groups = { get: async () => refreshed } as unknown as GroupsClient

    await refreshGroup(groups, 'g1')

    expect($group.get()).toBe(refreshed)
    expect($error.get()).toBe('')
  })

  it('keeps the current Group when a refresh fails', async () => {
    applyGroup(group)
    const groups = {
      get: async () => {
        throw new Error('nope')
      }
    } as unknown as GroupsClient

    await refreshGroup(groups, 'g1')

    expect($group.get()).toBe(group)
    expect($error.get()).toBe('Groupe introuvable')
  })

  it('ignores a load that resolves after a newer one', async () => {
    let resolveA!: (value: Group) => void
    const loadA = loadGroup(
      { get: () => new Promise<Group>(settle => (resolveA = settle)) } as unknown as GroupsClient,
      'g1'
    )
    const bGroup = { id: 'g2', name: 'Collègues' } as Group
    await loadGroup({ get: async () => bGroup } as unknown as GroupsClient, 'g2')

    resolveA(group)
    await loadA

    expect($group.get()).toBe(bGroup)
    expect($error.get()).toBe('')
  })

  it('clears the Group and ignores in-flight loads', async () => {
    let resolve!: (value: Group) => void
    const pending = loadGroup(
      {
        get: () => new Promise<Group>(settle => (resolve = settle))
      } as unknown as GroupsClient,
      'g1'
    )

    clearGroup()

    resolve(group)
    await pending

    expect($group.get()).toBeNull()
    expect($error.get()).toBe('')
  })

  it('does not surface an error from a stale refresh', async () => {
    applyGroup(group)
    let reject!: (reason: Error) => void
    const pending = refreshGroup(
      {
        get: () => new Promise<Group>((_, settle) => (reject = settle))
      } as unknown as GroupsClient,
      'g1'
    )
    const refreshed = { id: 'g1', name: 'Potes de Bob renommé' } as Group
    await loadGroup({ get: async () => refreshed } as unknown as GroupsClient, 'g1')

    reject(new Error('nope'))
    await pending

    expect($group.get()).toBe(refreshed)
    expect($error.get()).toBe('')
  })

  it('switches the active tab and closes an open form', () => {
    openForm()
    setActiveTab('services')

    expect($activeTab.get()).toBe('services')
    expect($formOpen.get()).toBe(false)
  })

  it('ignores a click on the already-active tab and keeps an open form', () => {
    openForm()
    setActiveTab('expenses')

    expect($activeTab.get()).toBe('expenses')
    expect($formOpen.get()).toBe(true)
  })

  it('keeps the form open after openForm and closes it with closeForm', () => {
    openForm()
    openForm()
    expect($formOpen.get()).toBe(true)

    closeForm()
    expect($formOpen.get()).toBe(false)
  })

  it('resets the slate state with the Group', () => {
    setActiveTab('paybacks')
    openForm()

    clearGroup()

    expect($activeTab.get()).toBe('expenses')
    expect($formOpen.get()).toBe(false)
  })
})
