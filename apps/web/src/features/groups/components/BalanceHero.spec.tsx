/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import type { Group } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { BalanceHero } from './BalanceHero'

afterEach(cleanup)
afterEach(async () => {
  await api.close()
})

let api: TestApi
beforeEach(async () => {
  api = await createTestApi()
})

const groupWithExpense = async (payerId: string): Promise<Group> => {
  const client = api.groups(testUsers.lea)
  const group = await client.create('Potes de Bob')
  await api.groups(testUsers.bob).join(group.invite.secret)
  await api.groups(testUsers.camille).join(group.invite.secret)
  await api.expenses(payerId === 'lea' ? testUsers.lea : testUsers.bob).create(group.id, {
    label: 'Pizza',
    day: '2026-08-15',
    amount: 100,
    payerId,
    participantIds: ['lea', 'bob', 'camille']
  })
  return client.get(group.id)
}

describe('BalanceHero', () => {
  it('says the Group owes the self when the self Balance is positive', async () => {
    const group = await groupWithExpense('lea')

    render(<BalanceHero group={group} />)

    expect(screen.getByText('Ton solde')).toBeTruthy()
    expect(screen.getByText('On te doit 0,66 €')).toBeTruthy()
  })

  it('says the self owes the Group when the self Balance is negative', async () => {
    const group = await groupWithExpense('bob')

    render(<BalanceHero group={group} />)

    expect(screen.getByText('Ton solde')).toBeTruthy()
    expect(screen.getByText('Tu dois 0,33 €')).toBeTruthy()
  })
})
