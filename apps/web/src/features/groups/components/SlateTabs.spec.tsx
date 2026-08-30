/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vite-plus/test'
import { $activeTab, $formOpen, clearGroup } from '../store'
import { SlateTabs } from './SlateTabs'

afterEach(cleanup)
beforeEach(() => {
  clearGroup()
})

describe('SlateTabs', () => {
  it('marks the active tab and switches it on click', async () => {
    render(<SlateTabs />)

    expect(screen.getByRole('tab', { name: 'Dépenses' }).getAttribute('aria-selected')).toBe('true')

    await userEvent.click(screen.getByRole('tab', { name: 'Services' }))

    expect($activeTab.get()).toBe('services')
    expect(screen.getByRole('tab', { name: 'Services' }).getAttribute('aria-selected')).toBe('true')
  })

  it('keeps the active tab in the tab order and the others out of it', () => {
    render(<SlateTabs />)

    expect(screen.getByRole('tab', { name: 'Dépenses' }).tabIndex).toBe(0)
    expect(screen.getByRole('tab', { name: 'Services' }).tabIndex).toBe(-1)
    expect(screen.getByRole('tab', { name: 'Remboursements' }).tabIndex).toBe(-1)
  })

  it('moves focus and selection with the arrow keys and Home/End', async () => {
    render(<SlateTabs />)
    const user = userEvent.setup()

    screen.getByRole('tab', { name: 'Dépenses' }).focus()
    await user.keyboard('{ArrowRight}')
    expect($activeTab.get()).toBe('services')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Services' }))

    await user.keyboard('{ArrowLeft}')
    expect($activeTab.get()).toBe('expenses')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Dépenses' }))

    await user.keyboard('{End}')
    expect($activeTab.get()).toBe('paybacks')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Remboursements' }))

    await user.keyboard('{Home}')
    expect($activeTab.get()).toBe('expenses')
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Dépenses' }))
  })

  it('wraps around the tab list with the arrow keys', async () => {
    render(<SlateTabs />)
    const user = userEvent.setup()

    screen.getByRole('tab', { name: 'Dépenses' }).focus()
    await user.keyboard('{ArrowLeft}')
    expect($activeTab.get()).toBe('paybacks')

    await user.keyboard('{ArrowRight}')
    expect($activeTab.get()).toBe('expenses')
  })

  it('opens the create form with + and never closes it', async () => {
    render(<SlateTabs />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Ajouter une Dépense' }))
    expect($formOpen.get()).toBe(true)

    await user.click(screen.getByRole('button', { name: 'Ajouter une Dépense' }))
    expect($formOpen.get()).toBe(true)
  })

  it('labels the add button after the active tab', async () => {
    render(<SlateTabs />)
    await userEvent.click(screen.getByRole('tab', { name: 'Remboursements' }))

    expect(screen.getByRole('button', { name: 'Ajouter un Remboursement' })).toBeTruthy()
  })

  it('keeps an open form when the active tab is re-clicked', async () => {
    render(<SlateTabs />)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: 'Ajouter une Dépense' }))
    expect($formOpen.get()).toBe(true)

    await user.click(screen.getByRole('tab', { name: 'Dépenses' }))
    expect($activeTab.get()).toBe('expenses')
    expect($formOpen.get()).toBe(true)
  })
})
