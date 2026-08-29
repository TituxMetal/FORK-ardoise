/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { Alert } from './Alert'

afterEach(cleanup)

describe('Alert', () => {
  it('renders the message as an alert', () => {
    render(<Alert message="Groupe introuvable" />)

    expect(screen.getByRole('alert').textContent).toBe('Groupe introuvable')
  })
})
