/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, test } from 'vite-plus/test'
import type {
  CreateDepenseInput,
  GroupeDto,
  GroupeSummary
} from '../infrastructure/CreateGroupes.client.ts'
import { GroupesScreen } from './GroupesScreen.tsx'

afterEach(cleanup)

const emptyGroupe = (id: string, name: string, members: GroupeDto['members']): GroupeDto => ({
  id,
  name,
  members,
  invitation: { secret: 'invite-secret' },
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
      const groupe = emptyGroupe(crypto.randomUUID(), name, [
        { userId: 'lea', name: 'Léa' },
        { userId: 'bob', name: 'Bob' },
        { userId: 'camille', name: 'Camille' }
      ])
      groupes.set(groupe.id, groupe)
      return groupe
    },
    get: async (id: string): Promise<GroupeDto> => {
      const groupe = groupes.get(id)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      return groupe
    },
    join: async () => {
      throw new Error('Invitation introuvable')
    },
    createExpense: async (groupeId: string, input: CreateDepenseInput): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const participantIds = input.participantIds ?? groupe.members.map(membre => membre.userId)
      const partEntiere = Math.floor(input.amount / participantIds.length)
      const reste = input.amount - partEntiere * participantIds.length
      const parts = participantIds.map(userId => ({
        userId,
        amount: userId === input.payerId ? partEntiere + reste : partEntiere
      }))
      if (!participantIds.includes(input.payerId) && reste > 0) {
        parts.push({ userId: input.payerId, amount: reste })
      }
      const next: GroupeDto = {
        ...groupe,
        expenses: [
          ...groupe.expenses,
          {
            id: crypto.randomUUID(),
            label: input.label,
            day: input.day,
            amount: input.amount,
            payerId: input.payerId,
            participantIds,
            parts
          }
        ]
      }
      next.balances = groupe.members.map(membre => {
        let amount = 0
        for (const depense of next.expenses) {
          if (depense.payerId === membre.userId) {
            amount += depense.amount
          }
          for (const part of depense.parts) {
            if (part.userId === membre.userId) {
              amount -= part.amount
            }
          }
        }
        return { ...membre, amount }
      })
      groupes.set(groupeId, next)
      return next
    },
    deleteExpense: async (groupeId: string, expenseId: string): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const expenses = groupe.expenses.filter(depense => depense.id !== expenseId)
      const next: GroupeDto = {
        ...groupe,
        expenses,
        balances: groupe.members.map(membre => ({ ...membre, amount: 0 }))
      }
      groupes.set(groupeId, next)
      return next
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

const openNamed = async (name: string) => {
  await createNamed(name)
  await userEvent.click(await screen.findByRole('button', { name }))
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
  expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
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

test('a Membre copies the Invitation link of the opened Groupe', async () => {
  const written: string[] = []
  render(
    <GroupesScreen
      client={memoryClient()}
      copy={async text => {
        written.push(text)
      }}
    />
  )

  await createNamed('Potes de Bob')
  await userEvent.click(await screen.findByRole('button', { name: 'Potes de Bob' }))
  await userEvent.click(screen.getByRole('button', { name: 'Copier le lien d’Invitation' }))

  expect(written).toEqual([`${window.location.origin}/invitations/invite-secret`])
})

test('constater a Dépense lists it and updates Soldes', async () => {
  render(<GroupesScreen client={memoryClient()} />)
  await openNamed('Potes de Bob')

  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Libellé'), 'Pizza')
  await user.type(screen.getByLabelText('Jour'), '2026-08-15')
  await user.type(screen.getByLabelText('Montant'), '1')
  await user.selectOptions(screen.getByLabelText('Payeur'), 'lea')
  await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

  expect(await screen.findByText('Pizza')).toBeTruthy()
  expect(screen.getByText('2026-08-15')).toBeTruthy()
  expect(screen.getByText('Léa 0,66 €')).toBeTruthy()
  expect(screen.getByText('Bob −0,33 €')).toBeTruthy()
  expect(screen.getByText('Camille −0,33 €')).toBeTruthy()
})

test('any Membre can delete a Dépense from the list', async () => {
  render(<GroupesScreen client={memoryClient()} />)
  await openNamed('Potes de Bob')

  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Libellé'), 'Pizza')
  await user.type(screen.getByLabelText('Jour'), '2026-08-15')
  await user.type(screen.getByLabelText('Montant'), '1')
  await user.selectOptions(screen.getByLabelText('Payeur'), 'lea')
  await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))
  await user.click(await screen.findByRole('button', { name: 'Supprimer Pizza' }))

  expect(await screen.findByText('Aucune Dépense')).toBeTruthy()
  expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
})
