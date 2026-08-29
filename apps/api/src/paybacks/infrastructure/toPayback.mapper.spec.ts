import { describe, expect, it } from 'vite-plus/test'
import { toPayback } from './toPayback.mapper'

describe('toPayback', () => {
  it('maps a row to a Payback entity', () => {
    const payback = toPayback({
      id: 'p1',
      groupId: 'g1',
      debtorId: 'u-bob',
      creditorId: 'u-lea',
      amount: 500
    })

    expect(payback).toEqual({
      id: 'p1',
      groupId: 'g1',
      debtorId: 'u-bob',
      creditorId: 'u-lea',
      amount: { value: 500 }
    })
  })
})
