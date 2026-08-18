/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import type {
  CreateExpenseInput,
  CreatePaybackInput,
  CreateServiceInput,
  GroupDto,
  GroupSummary
} from '../infrastructure/CreateGroups.client.ts'
import { GroupsScreen } from './GroupsScreen.tsx'

afterEach(cleanup)

const emptyGroup = (id: string, name: string, members: GroupDto['members']): GroupDto => ({
  id,
  name,
  members,
  invite: { secret: 'invite-secret' },
  expenses: [],
  services: [],
  paybacks: [],
  balances: members.map(member => ({ ...member, amount: 0 }))
})

const equalParts = (amount: number, participantIds: string[], creditedId: string) => {
  const wholePart = Math.floor(amount / participantIds.length)
  const remainder = amount - wholePart * participantIds.length
  const parts = participantIds.map(userId => ({
    userId,
    amount: userId === creditedId ? wholePart + remainder : wholePart
  }))
  if (!participantIds.includes(creditedId) && remainder > 0) {
    parts.push({ userId: creditedId, amount: remainder })
  }
  return parts
}

const balancesFrom = (group: GroupDto) =>
  group.members.map(member => {
    let amount = 0
    for (const expense of group.expenses) {
      if (expense.payerId === member.userId) {
        amount += expense.amount
      }
      for (const part of expense.parts) {
        if (part.userId === member.userId) {
          amount -= part.amount
        }
      }
    }
    for (const service of group.services) {
      if (service.providerId === member.userId) {
        amount += service.amount
      }
      for (const part of service.parts) {
        if (part.userId === member.userId) {
          amount -= part.amount
        }
      }
    }
    for (const payback of group.paybacks) {
      if (payback.creditorId === member.userId) {
        amount -= payback.amount
      }
      if (payback.debtorId === member.userId) {
        amount += payback.amount
      }
    }
    return { ...member, amount }
  })

const memoryClient = () => {
  const groups = new Map<string, GroupDto>()
  return {
    list: async (): Promise<GroupSummary[]> =>
      [...groups.values()].map(group => ({ id: group.id, name: group.name })),
    create: async (name: string): Promise<GroupDto> => {
      const group = emptyGroup(crypto.randomUUID(), name, [
        { userId: 'lea', name: 'Léa' },
        { userId: 'bob', name: 'Bob' },
        { userId: 'camille', name: 'Camille' }
      ])
      groups.set(group.id, group)
      return group
    },
    get: async (id: string): Promise<GroupDto> => {
      const group = groups.get(id)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      return group
    },
    join: async () => {
      throw new Error('Invitation introuvable')
    },
    createExpense: async (groupeId: string, input: CreateExpenseInput): Promise<GroupDto> => {
      const group = groups.get(groupeId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const participantIds = input.participantIds ?? group.members.map(member => member.userId)
      const next: GroupDto = {
        ...group,
        expenses: [
          ...group.expenses,
          {
            id: crypto.randomUUID(),
            label: input.label,
            day: input.day,
            amount: input.amount,
            payerId: input.payerId,
            participantIds,
            parts: equalParts(input.amount, participantIds, input.payerId)
          }
        ]
      }
      next.balances = balancesFrom(next)
      groups.set(groupeId, next)
      return next
    },
    deleteExpense: async (groupeId: string, expenseId: string): Promise<GroupDto> => {
      const group = groups.get(groupeId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        expenses: group.expenses.filter(expense => expense.id !== expenseId)
      }
      next.balances = balancesFrom(next)
      groups.set(groupeId, next)
      return next
    },
    createService: async (groupeId: string, input: CreateServiceInput): Promise<GroupDto> => {
      const group = groups.get(groupeId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const participantIds = input.participantIds ?? group.members.map(member => member.userId)
      const next: GroupDto = {
        ...group,
        services: [
          ...group.services,
          {
            id: crypto.randomUUID(),
            label: input.label,
            day: input.day,
            amount: input.amount,
            providerId: input.providerId,
            participantIds,
            parts: equalParts(input.amount, participantIds, input.providerId)
          }
        ]
      }
      next.balances = balancesFrom(next)
      groups.set(groupeId, next)
      return next
    },
    deleteService: async (groupeId: string, serviceId: string): Promise<GroupDto> => {
      const group = groups.get(groupeId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        services: group.services.filter(service => service.id !== serviceId)
      }
      next.balances = balancesFrom(next)
      groups.set(groupeId, next)
      return next
    },
    createPayback: async (groupeId: string, input: CreatePaybackInput): Promise<GroupDto> => {
      const group = groups.get(groupeId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        paybacks: [
          ...group.paybacks,
          {
            id: crypto.randomUUID(),
            debtorId: input.debtorId,
            creditorId: input.creditorId,
            amount: input.amount
          }
        ]
      }
      next.balances = balancesFrom(next)
      groups.set(groupeId, next)
      return next
    },
    deletePayback: async (groupeId: string, paybackId: string): Promise<GroupDto> => {
      const group = groups.get(groupeId)
      if (!group) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupDto = {
        ...group,
        paybacks: group.paybacks.filter(payback => payback.id !== paybackId)
      }
      next.balances = balancesFrom(next)
      groups.set(groupeId, next)
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

describe('GroupsScreen', () => {
  it('creates a Group, lists it and opens an empty board', async () => {
    const client = memoryClient()
    render(<GroupsScreen client={client} />)

    await createNamed('Potes de Bob')
    const open = await screen.findByRole('button', { name: 'Potes de Bob' })
    await userEvent.click(open)

    expect(screen.getByRole('heading', { name: 'Potes de Bob' })).toBeTruthy()
    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
    expect(screen.getByText('Aucun Service')).toBeTruthy()
    expect(screen.getByText('Aucun Règlement')).toBeTruthy()
    expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
  })

  it('keeps two Groups created by the same User on two distinct lines', async () => {
    render(<GroupsScreen client={memoryClient()} />)

    await createNamed('Potes de Bob')
    await createNamed('Collègues')

    expect(
      (await screen.findAllByRole('button', { name: /Potes de Bob|Collègues/ })).map(
        button => button.textContent
      )
    ).toEqual(['Potes de Bob', 'Collègues'])
  })

  it('shows an error instead of throwing when the list fails', async () => {
    render(
      <GroupsScreen
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

  it('lets a Member copy the Invite link of the opened Group', async () => {
    const written: string[] = []
    render(
      <GroupsScreen
        client={memoryClient()}
        copy={async text => {
          written.push(text)
        }}
      />
    )

    await createNamed('Potes de Bob')
    await userEvent.click(await screen.findByRole('button', { name: 'Potes de Bob' }))
    await userEvent.click(screen.getByRole('button', { name: 'Copier le lien d’Invitation' }))

    expect(written).toEqual([`${window.location.origin}/invites/invite-secret`])
  })

  it('records an Expense, lists it and updates Balances', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))

    expect(await screen.findByText('Pizza')).toBeTruthy()
    expect(screen.getByText('2026-08-15')).toBeTruthy()
    expect(screen.getByText('Léa 0,66 €')).toBeTruthy()
    expect(screen.getByText('Bob −0,33 €')).toBeTruthy()
    expect(screen.getByText('Camille −0,33 €')).toBeTruthy()
  })

  it('lets any Member delete an Expense from the list', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))
    await user.click(await screen.findByRole('button', { name: 'Supprimer Pizza' }))

    expect(await screen.findByText('Aucune Dépense')).toBeTruthy()
    expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
  })

  it('records a Service, lists it apart from Expenses and updates Balances', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Service' })
    await user.type(within(form).getByLabelText('Libellé'), 'Ordi Bob')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Prestataire'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater le Service' }))

    expect(await screen.findByText('Ordi Bob')).toBeTruthy()
    expect(screen.getByText('Aucune Dépense')).toBeTruthy()
    expect(screen.getByText('Léa 0,66 €')).toBeTruthy()
    expect(screen.getByText('Bob −0,33 €')).toBeTruthy()
    expect(screen.getByText('Camille −0,33 €')).toBeTruthy()
  })

  it('lets any Member delete a Service from the list', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Service' })
    await user.type(within(form).getByLabelText('Libellé'), 'Ordi Bob')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Prestataire'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater le Service' }))
    await user.click(await screen.findByRole('button', { name: 'Supprimer Ordi Bob' }))

    expect(await screen.findByText('Aucun Service')).toBeTruthy()
    expect(screen.getByText('Léa 0,00 €')).toBeTruthy()
  })

  const recordPizza = async () => {
    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))
  }

  it('lists strictly positive Balances descending in who owes what and shows the cap', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await recordPizza()

    expect(await screen.findByRole('heading', { name: 'Qui doit quoi' })).toBeTruthy()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    const creditors = within(form).getByLabelText('Créancier')
    expect([...creditors.querySelectorAll('option')].map(option => option.textContent)).toEqual([
      'Léa'
    ])
    expect(within(form).getByText('Plafond 0,33 €')).toBeTruthy()
  })

  it('records a Payback from the chosen creditor', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await recordPizza()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    await user.selectOptions(within(form).getByLabelText('Débiteur'), 'bob')
    await user.selectOptions(within(form).getByLabelText('Créancier'), 'lea')
    await user.type(within(form).getByLabelText('Montant'), '0,20')
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))

    expect(await screen.findByText('Bob → Léa 0,20 €')).toBeTruthy()
    expect(screen.getByText('Léa 0,46 €')).toBeTruthy()
    expect(screen.getByText('Bob −0,13 €')).toBeTruthy()
  })

  it('lets any Member delete a Payback from the list', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await recordPizza()

    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    await user.selectOptions(within(form).getByLabelText('Débiteur'), 'bob')
    await user.selectOptions(within(form).getByLabelText('Créancier'), 'lea')
    await user.type(within(form).getByLabelText('Montant'), '0,20')
    await user.click(screen.getByRole('button', { name: 'Constater le Règlement' }))
    await user.click(
      await screen.findByRole('button', { name: 'Supprimer le Règlement Bob → Léa' })
    )

    expect(await screen.findByText('Aucun Règlement')).toBeTruthy()
    expect(screen.getByText('Léa 0,66 €')).toBeTruthy()
  })

  it('updates the displayed cap when the debtor or the creditor changes', async () => {
    render(<GroupsScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await recordPizza()

    const user = userEvent.setup()
    const service = screen.getByRole('form', { name: 'Constater un Service' })
    await user.type(within(service).getByLabelText('Libellé'), 'Ordi Bob')
    await user.type(within(service).getByLabelText('Jour'), '2026-08-16')
    await user.type(within(service).getByLabelText('Montant'), '0.90')
    await user.selectOptions(within(service).getByLabelText('Prestataire'), 'bob')
    await user.click(screen.getByRole('button', { name: 'Constater le Service' }))

    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    const creditors = within(form).getByLabelText('Créancier')
    expect([...creditors.querySelectorAll('option')].map(option => option.textContent)).toEqual([
      'Léa',
      'Bob'
    ])
    expect(within(form).getByText('Plafond 0,36 €')).toBeTruthy()

    await user.selectOptions(within(form).getByLabelText('Créancier'), 'bob')
    expect(within(form).getByText('Plafond 0,27 €')).toBeTruthy()
  })
})
