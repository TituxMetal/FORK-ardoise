/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { Button } from './Button'

afterEach(cleanup)

describe('Button', () => {
  it('renders a button that forwards its type and click', async () => {
    const user = userEvent.setup()
    const clicks: string[] = []
    render(
      <Button
        type="button"
        onClick={() => {
          clicks.push('clicked')
        }}
      >
        Créer le Groupe
      </Button>
    )

    await user.click(screen.getByRole('button', { name: 'Créer le Groupe' }))

    expect(clicks).toEqual(['clicked'])
    expect(screen.getByRole('button').getAttribute('type')).toBe('button')
  })

  it('styles the primary variant by default', () => {
    render(<Button>Aller</Button>)

    expect(screen.getByRole('button').className).toContain('bg-zinc-100')
  })

  it('styles the secondary variant on request', () => {
    render(<Button variant="secondary">Supprimer</Button>)

    expect(screen.getByRole('button').className).toContain('bg-zinc-800')
  })
})
