import { atom } from 'nanostores'
import type { Group, GroupsClient } from '../types'

export const $group = atom<Group | null>(null)
export const $error = atom('')

export const applyGroup = (group: Group) => {
  $group.set(group)
  $error.set('')
}

export const loadGroup = async (groups: GroupsClient, id: string) => {
  $group.set(null)
  $error.set('')
  try {
    $group.set(await groups.get(id))
  } catch {
    $error.set('Groupe introuvable')
  }
}

export const refreshGroup = async (groups: GroupsClient, id: string) => {
  try {
    applyGroup(await groups.get(id))
  } catch {
    $error.set('Groupe introuvable')
  }
}
