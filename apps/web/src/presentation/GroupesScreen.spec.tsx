/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vite-plus/test'
import type { GroupeDto, GroupeSummary } from '../infrastructure/CreateGroupes.client.ts'
import { GroupesScreen } from './GroupesScreen.tsx'

afterEach(cleanup)

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

const createNamed = async (name: string) => {
  const user = userEvent.setup()
  const input = screen.getByLabelText('Nom')
  await user.clear(input)
  await user.type(input, name)
  await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))
}

test('creating a Groupe lists it and opens an empty ardoise', async () => {
  const client = memoryClient()
  render(<GroupesScreen client={client} />)

  await createNamed('Potes de Bob')
  const open = await screen.findByRole('button', { name: 'Potes de Bob' })
  await userEvent.click(open)

  expect(screen.getByRole('heading', { name: 'Potes de Bob' })).toBeTruthy()
  expect(screen.getByText('Aucune Dépense')).toBeTruthy()
  expect(screen.getByText('Aucun Service')).toBeTruthy()
  expect(screen.getByText('Aucun Règlement')).toBeTruthy()
  expect(screen.getByText('Léa 0')).toBeTruthy()
})

test('two Groupes created by the same User stay on two distinct lines', async () => {
  render(<GroupesScreen client={memoryClient()} />)

  await createNamed('Potes de Bob')
  await createNamed('Collègues')

  expect(
    (await screen.findAllByRole('button', { name: /Potes de Bob|Collègues/ })).map(
      button => button.textContent
    )
  ).toEqual(['Potes de Bob', 'Collègues'])
})

test('a failed list shows an error instead of throwing', async () => {
  render(
    <GroupesScreen
      client={{
        ...memoryClient(),
        list: async () => {
          throw new Error('Groupe introuvable')
        }
      }}
    />
  )

  await waitFor(() => {
    expect(screen.getByRole('alert').textContent).toBe('Impossible de lister les Groupes')
  })
})
