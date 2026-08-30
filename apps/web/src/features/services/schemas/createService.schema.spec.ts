import { describe, expect, it } from 'vite-plus/test'
import { createServiceSchema } from './createService.schema'

describe('createServiceSchema', () => {
  it('accepts a valid Service input', () => {
    const input = {
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: '10',
      providerId: 'bob',
      participantIds: ['lea', 'bob']
    }

    expect(createServiceSchema.parse(input)).toEqual(input)
  })

  it('accepts a French decimal Amount', () => {
    expect(
      createServiceSchema.parse({
        label: 'Ordi Bob',
        day: '2026-08-15',
        amount: '0,90',
        providerId: 'bob'
      }).amount
    ).toBe('0,90')
  })

  it('trims the label and the day', () => {
    expect(
      createServiceSchema.parse({
        label: '  Ordi Bob  ',
        day: ' 2026-08-15 ',
        amount: '10',
        providerId: 'bob'
      })
    ).toEqual({ label: 'Ordi Bob', day: '2026-08-15', amount: '10', providerId: 'bob' })
  })

  it('accepts an omitted participant list', () => {
    expect(
      createServiceSchema.parse({
        label: 'Ordi Bob',
        day: '2026-08-15',
        amount: '10',
        providerId: 'bob'
      })
    ).toEqual({ label: 'Ordi Bob', day: '2026-08-15', amount: '10', providerId: 'bob' })
  })

  it('rejects a blank label with a French message', () => {
    const result = createServiceSchema.safeParse({
      label: '   ',
      day: '2026-08-15',
      amount: '10',
      providerId: 'bob'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Libellé requis')
  })

  it('rejects a malformed day with a French message', () => {
    const result = createServiceSchema.safeParse({
      label: 'Ordi Bob',
      day: '15/08/2026',
      amount: '10',
      providerId: 'bob'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Jour requis')
  })

  it('rejects a non-positive Amount with a French message', () => {
    const result = createServiceSchema.safeParse({
      label: 'Ordi Bob',
      day: '2026-08-15',
      amount: '0',
      providerId: 'bob'
    })

    expect(result.success).toBe(false)
    if (result.success) return

    expect(result.error.issues[0]?.message).toBe('Montant > 0 requis')
  })
})
