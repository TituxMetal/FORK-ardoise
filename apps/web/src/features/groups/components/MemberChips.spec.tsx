/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import type { Group } from '~features/groups'
import { createTestApi, testUsers, type TestApi } from '~/lib/testApi'
import { MemberChips } from './MemberChips'

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

describe('MemberChips', () => {
  it('shows each member name and signed Balance and marks the self chip', async () => {
    const group = await groupWithExpense('lea')

    render(<MemberChips group={group} />)

    const chips = screen.getAllByRole('listitem')
    expect(chips).toHaveLength(3)
    const chipTexts = chips.map(chip => chip.textContent ?? '')
    expect(chipTexts).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Léa'),
        expect.stringContaining('Bob'),
        expect.stringContaining('Camille'),
        expect.stringContaining('+0,66 €'),
        expect.stringContaining('−0,33 €')
      ])
    )
    expect(screen.getByText('c’est vous')).toBeTruthy()
  })

  it('announces the self once when the self Balance is negative', async () => {
    const group = await groupWithExpense('bob')

    render(<MemberChips group={group} />)

    expect(screen.getAllByText('c’est vous')).toHaveLength(1)
  })
})
