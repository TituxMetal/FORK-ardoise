/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { SlateTabs } from './SlateTabs'

afterEach(cleanup)

describe('SlateTabs', () => {
  it('marks the active tab and reports a click on another', async () => {
    const onChange = vi.fn()
    render(<SlateTabs active="expenses" onChange={onChange} onAdd={vi.fn()} />)

    expect(screen.getByRole('tab', { name: 'Dépenses' }).getAttribute('aria-selected')).toBe('true')
    expect(screen.getByRole('tab', { name: 'Services' }).getAttribute('aria-selected')).toBe(
      'false'
    )

    await userEvent.click(screen.getByRole('tab', { name: 'Services' }))

    expect(onChange).toHaveBeenCalledWith('services')
  })

  it('labels the add button after the active tab and reports a click', async () => {
    const onAdd = vi.fn()
    render(<SlateTabs active="paybacks" onChange={vi.fn()} onAdd={onAdd} />)

    const add = screen.getByRole('button', { name: 'Ajouter un Remboursement' })
    expect(add).toBeTruthy()

    await userEvent.click(add)

    expect(onAdd).toHaveBeenCalled()
  })
})
