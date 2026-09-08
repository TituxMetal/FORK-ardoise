/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { LandingPage } from './LandingPage'

afterEach(cleanup)

describe('LandingPage', () => {
  it('pitches the shared slate in French', () => {
    render(<LandingPage />)

    expect(
      screen.getByRole('heading', { name: 'Une ardoise partagée pour les comptes d’un Groupe' })
    ).toBeTruthy()
    expect(screen.getByText(/Ardoise en déduit le Solde de chaque membre/)).toBeTruthy()
  })

  it('states the truthful free, invitation-free offer', () => {
    render(<LandingPage />)

    expect(screen.getByText(/Créer un compte et un premier Groupe est gratuit/)).toBeTruthy()
  })

  it('makes the primary call-to-action lead to registration', () => {
    render(<LandingPage />)

    const cta = screen.getByRole('link', { name: 'Créer un compte' })
    expect(cta.getAttribute('href')).toBe('/session')
  })

  it('gives the visitor a path to the About page', () => {
    render(<LandingPage />)

    expect(screen.getByRole('link', { name: 'À propos' }).getAttribute('href')).toBe('/about')
  })
})
