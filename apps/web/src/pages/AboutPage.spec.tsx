/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vite-plus/test'
import { AboutPage } from './AboutPage'

afterEach(cleanup)

describe('AboutPage', () => {
  it('introduces the page in French', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { name: 'À propos d’Ardoise' })).toBeTruthy()
  })

  it('states that balances derive from what members record, never typed in', () => {
    render(<AboutPage />)

    expect(screen.getByText(/Aucun Solde n’est saisi à la main/)).toBeTruthy()
    expect(screen.getByText(/les Soldes découlent de ce que les membres enregistrent/)).toBeTruthy()
  })

  it('renders one anchored lexicon entry per domain term', () => {
    render(<AboutPage />)

    const anchors = [
      ['groupe', 'Groupe'],
      ['depense', 'Dépense'],
      ['service', 'Service'],
      ['reglement', 'Règlement'],
      ['solde', 'Solde'],
      ['invitation', 'Invitation']
    ] as const

    for (const [anchor, term] of anchors) {
      const entry = document.getElementById(anchor)
      expect(entry).toBeTruthy()
      expect(entry!.querySelector('h3')?.textContent).toBe(term)
    }
  })

  it('defines Groupe with a concrete example mirroring the app copy', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { name: 'Groupe' }).closest('article')!.textContent).toMatch(
      /réunit des personnes autour d’une seule ardoise/
    )
    expect(screen.getByText(/« Potes de Bob » est un Groupe/)).toBeTruthy()
    expect(screen.getByText(/la liste « Mes Groupes »/)).toBeTruthy()
  })

  it('defines Dépense with a concrete example mirroring the app copy', () => {
    render(<AboutPage />)

    expect(
      screen.getByRole('heading', { name: 'Dépense' }).closest('article')!.textContent
    ).toMatch(/réellement sorti de la poche d’un membre/)
    expect(screen.getByText(/« Pizza », 24,00 € payés par Léa/)).toBeTruthy()
    expect(screen.getByText(/l’onglet « Dépenses »/)).toBeTruthy()
  })

  it('defines Service with a concrete example mirroring the app copy', () => {
    render(<AboutPage />)

    expect(
      screen.getByRole('heading', { name: 'Service' }).closest('article')!.textContent
    ).toMatch(/valeur accordée à un membre pour un acte/)
    expect(screen.getByText(/un Service de 30,00 € avec Bob comme Prestataire/)).toBeTruthy()
    expect(screen.getByText(/l’onglet « Services »/)).toBeTruthy()
  })

  it('defines Règlement with a concrete example mirroring the app copy', () => {
    render(<AboutPage />)

    expect(
      screen.getByRole('heading', { name: 'Règlement' }).closest('article')!.textContent
    ).toMatch(/versement d’un membre à un autre/)
    expect(screen.getByText(/« Ajouter un Règlement »/)).toBeTruthy()
    expect(screen.getByText(/l’onglet « Règlements »/)).toBeTruthy()
  })

  it('defines Solde with a concrete example mirroring the app copy', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { name: 'Solde' }).closest('article')!.textContent).toMatch(
      /sa position nette dans le Groupe/
    )
    expect(screen.getByText(/« Ton solde »/)).toBeTruthy()
    expect(screen.getByText(/« On te doit 12,00 € »/)).toBeTruthy()
  })

  it('defines Invitation with a concrete example mirroring the app copy', () => {
    render(<AboutPage />)

    expect(
      screen.getByRole('heading', { name: 'Invitation' }).closest('article')!.textContent
    ).toMatch(/lien secret qu’un membre copie/)
    expect(screen.getByText(/« Copier le lien d’Invitation »/)).toBeTruthy()
  })

  it('states the honest boundaries', () => {
    render(<AboutPage />)

    expect(screen.getByRole('heading', { name: 'Ce qu’Ardoise ne fait pas' })).toBeTruthy()
    expect(screen.getByText(/Les Groupes sont des pièces fermées/)).toBeTruthy()
    expect(screen.getByText(/ne passent jamais d’un Groupe à un autre/)).toBeTruthy()
    expect(screen.getByText(/seul un membre du Groupe peut en créer une/)).toBeTruthy()
    expect(screen.getByText(/elle ne détient pas d’argent et n’en déplace pas/)).toBeTruthy()
  })

  it('offers free registration to a signed-out visitor', () => {
    render(<AboutPage />)

    const cta = screen.getByRole('link', { name: 'Créer un compte' })
    expect(cta.getAttribute('href')).toBe('/session')
    expect(screen.getByText(/gratuit : aucune invitation n’est nécessaire/)).toBeTruthy()
  })

  it('does not push registration at a Member', () => {
    render(<AboutPage session={{ name: 'Léa' }} />)

    expect(screen.getByRole('heading', { name: 'À propos d’Ardoise' })).toBeTruthy()
    expect(screen.queryByRole('link', { name: 'Créer un compte' })).toBeNull()
  })
})
