import { afterEach, describe, expect, it } from 'vite-plus/test'
import type { Group, GroupsClient } from '../types'
import { $error, $group, applyGroup, loadGroup } from './group.store'

const group = { id: 'g1', name: 'Potes de Bob' } as Group

afterEach(() => {
  $group.set(null)
  $error.set('')
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
    $group.set(group)
    const groups = {
      get: async () => {
        throw new Error('nope')
      }
    } as unknown as GroupsClient

    await loadGroup(groups, 'g1')

    expect($group.get()).toBeNull()
    expect($error.get()).toBe('Groupe introuvable')
  })
})
