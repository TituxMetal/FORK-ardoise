/** @vitest-environment happy-dom */
import { act, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, test } from 'vite-plus/test'
import type { GroupeDto, GroupeSummary } from '../infrastructure/CreateGroupes.client.ts'
import { GroupesScreen } from './GroupesScreen.tsx'

const emptyGroupe = (id: string, name: string, members: GroupeDto['members']): GroupeDto => ({
  id,
  name,
  members,
  expenses: [],
  services: [],
  settlements: [],
  balances: members.map(membre => ({ ...membre, amount: 0 }))
})

const memoryClient = () => {
  const groupes = new Map<string, GroupeDto>()
  return {
    list: async (): Promise<GroupeSummary[]> =>
      [...groupes.values()].map(groupe => ({ id: groupe.id, name: groupe.name })),
    create: async (name: string): Promise<GroupeDto> => {
      const groupe = emptyGroupe(crypto.randomUUID(), name, [{ userId: 'lea', name: 'Léa' }])
      groupes.set(groupe.id, groupe)
      return groupe
    },
    get: async (id: string): Promise<GroupeDto> => {
      const groupe = groupes.get(id)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      return groupe
    }
  }
}

const render = async (ui: ReactNode) => {
  const container = document.createElement('div')
  document.body.append(container)
  const root = createRoot(container)
  await act(async () => {
    root.render(ui)
  })
  return container
}

const submitCreate = async (container: HTMLElement, name: string) => {
  const input = container.querySelector('input[name="name"]') as HTMLInputElement
  const form = input.form as HTMLFormElement
  input.value = name
  await act(async () => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
  })
}

test('creating a Groupe lists it and opens an empty ardoise', async () => {
  const client = memoryClient()
  const container = await render(<GroupesScreen client={client} />)

  await submitCreate(container, 'Potes de Bob')

  expect(container.textContent).toContain('Potes de Bob')

  const open = [...container.querySelectorAll('button')].find(
    button => button.textContent === 'Potes de Bob'
  )
  await act(async () => {
    open?.click()
  })

  expect(container.textContent).toContain('Potes de Bob')
  expect(container.textContent).toContain('Aucune Dépense')
  expect(container.textContent).toContain('Aucun Service')
  expect(container.textContent).toContain('Aucun Règlement')
  expect(container.textContent).toMatch(/Léa.*0/)
})

test('two Groupes created by the same User stay on two distinct lines', async () => {
  const client = memoryClient()
  const container = await render(<GroupesScreen client={client} />)

  await submitCreate(container, 'Potes de Bob')
  await submitCreate(container, 'Collègues')

  const lines = [...container.querySelectorAll('button')].filter(button =>
    ['Potes de Bob', 'Collègues'].includes(button.textContent ?? '')
  )
  expect(lines.map(line => line.textContent)).toEqual(['Potes de Bob', 'Collègues'])
})
