/** @vitest-environment happy-dom */
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import type {
  CreateExpenseInput,
  CreatePaybackInput,
  CreateServiceInput,
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
  paybacks: [],
  balances: members.map(membre => ({ ...membre, amount: 0 }))
})

const equalParts = (amount: number, participantIds: string[], creditedId: string) => {
  const partEntiere = Math.floor(amount / participantIds.length)
  const reste = amount - partEntiere * participantIds.length
  const parts = participantIds.map(userId => ({
    userId,
    amount: userId === creditedId ? partEntiere + reste : partEntiere
  }))
  if (!participantIds.includes(creditedId) && reste > 0) {
    parts.push({ userId: creditedId, amount: reste })
  }
  return parts
}

const soldesFrom = (groupe: GroupeDto) =>
  groupe.members.map(membre => {
    let amount = 0
    for (const expense of groupe.expenses) {
      if (expense.payerId === membre.userId) {
        amount += expense.amount
      }
      for (const part of expense.parts) {
        if (part.userId === membre.userId) {
          amount -= part.amount
        }
      }
    }
    for (const service of groupe.services) {
      if (service.providerId === membre.userId) {
        amount += service.amount
      }
      for (const part of service.parts) {
        if (part.userId === membre.userId) {
          amount -= part.amount
        }
      }
    }
    for (const payback of groupe.paybacks) {
      if (payback.creditorId === membre.userId) {
        amount -= payback.amount
      }
      if (payback.debtorId === membre.userId) {
        amount += payback.amount
      }
    }
    return { ...membre, amount }
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
    createExpense: async (groupeId: string, input: CreateExpenseInput): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const participantIds = input.participantIds ?? groupe.members.map(membre => membre.userId)
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
            parts: equalParts(input.amount, participantIds, input.payerId)
          }
        ]
      }
      next.balances = soldesFrom(next)
      groupes.set(groupeId, next)
      return next
    },
    deleteExpense: async (groupeId: string, expenseId: string): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupeDto = {
        ...groupe,
        expenses: groupe.expenses.filter(expense => expense.id !== expenseId)
      }
      next.balances = soldesFrom(next)
      groupes.set(groupeId, next)
      return next
    },
    createService: async (groupeId: string, input: CreateServiceInput): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const participantIds = input.participantIds ?? groupe.members.map(membre => membre.userId)
      const next: GroupeDto = {
        ...groupe,
        services: [
          ...groupe.services,
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
      next.balances = soldesFrom(next)
      groupes.set(groupeId, next)
      return next
    },
    deleteService: async (groupeId: string, serviceId: string): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupeDto = {
        ...groupe,
        services: groupe.services.filter(service => service.id !== serviceId)
      }
      next.balances = soldesFrom(next)
      groupes.set(groupeId, next)
      return next
    },
    createPayback: async (groupeId: string, input: CreatePaybackInput): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupeDto = {
        ...groupe,
        paybacks: [
          ...groupe.paybacks,
          {
            id: crypto.randomUUID(),
            debtorId: input.debtorId,
            creditorId: input.creditorId,
            amount: input.amount
          }
        ]
      }
      next.balances = soldesFrom(next)
      groupes.set(groupeId, next)
      return next
    },
    deletePayback: async (groupeId: string, paybackId: string): Promise<GroupeDto> => {
      const groupe = groupes.get(groupeId)
      if (!groupe) {
        throw new Error('Groupe introuvable')
      }
      const next: GroupeDto = {
        ...groupe,
        paybacks: groupe.paybacks.filter(payback => payback.id !== paybackId)
      }
      next.balances = soldesFrom(next)
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

describe('GroupesScreen', () => {
  it('creates a Group, lists it and opens an empty board', async () => {
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

  it('keeps two Groups created by the same User on two distinct lines', async () => {
    render(<GroupesScreen client={memoryClient()} />)

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

  it('lets a Member copy the Invitation link of the opened Group', async () => {
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

  it('records an Expense, lists it and updates Balances', async () => {
    render(<GroupesScreen client={memoryClient()} />)
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
    render(<GroupesScreen client={memoryClient()} />)
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
    render(<GroupesScreen client={memoryClient()} />)
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
    render(<GroupesScreen client={memoryClient()} />)
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

  const constaterPizza = async () => {
    const user = userEvent.setup()
    const form = screen.getByRole('form', { name: 'Constater une Dépense' })
    await user.type(within(form).getByLabelText('Libellé'), 'Pizza')
    await user.type(within(form).getByLabelText('Jour'), '2026-08-15')
    await user.type(within(form).getByLabelText('Montant'), '1')
    await user.selectOptions(within(form).getByLabelText('Payeur'), 'lea')
    await user.click(screen.getByRole('button', { name: 'Constater la Dépense' }))
  }

  it('lists strictly positive Balances descending in who owes what and shows the cap', async () => {
    render(<GroupesScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await constaterPizza()

    expect(await screen.findByRole('heading', { name: 'Qui doit quoi' })).toBeTruthy()
    const form = screen.getByRole('form', { name: 'Constater un Règlement' })
    const creditors = within(form).getByLabelText('Créancier')
    expect([...creditors.querySelectorAll('option')].map(option => option.textContent)).toEqual([
      'Léa'
    ])
    expect(within(form).getByText('Plafond 0,33 €')).toBeTruthy()
  })

  it('records a Payback from the chosen creditor', async () => {
    render(<GroupesScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await constaterPizza()

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
    render(<GroupesScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await constaterPizza()

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
    render(<GroupesScreen client={memoryClient()} />)
    await openNamed('Potes de Bob')
    await constaterPizza()

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
