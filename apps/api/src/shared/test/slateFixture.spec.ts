import { describe, expect, it } from 'vite-plus/test'
import { slateFixture } from './slateFixture'

describe('slateFixture', () => {
  it('defaults to two Members with zero Balances', () => {
    expect(slateFixture()).toMatchObject({
      id: 'g1',
      selfMemberId: 'u1',
      members: [
        { userId: 'u1', name: 'Léa' },
        { userId: 'u2', name: 'Bob' }
      ],
      balances: [
        { userId: 'u1', amount: 0 },
        { userId: 'u2', amount: 0 }
      ]
    })
  })

  it('honours explicit Members and Balances', () => {
    const slate = slateFixture({
      members: [{ userId: 'u1', name: 'Léa' }],
      balances: [{ userId: 'u1', name: 'Léa', amount: 66 }]
    })

    expect(slate.members).toEqual([{ userId: 'u1', name: 'Léa' }])
    expect(slate.balances).toEqual([{ userId: 'u1', name: 'Léa', amount: 66 }])
  })
})
