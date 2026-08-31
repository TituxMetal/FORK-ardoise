import { expect, type APIRequestContext, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

export const PASSWORD = 'password-123'

export const uniqueEmail = (name: string) =>
  `${name}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`

export const waitForApi = async (request: APIRequestContext) => {
  await expect
    .poll(
      async () => {
        try {
          return (await request.get('/api/ping')).status()
        } catch {
          return -1
        }
      },
      { timeout: 60_000, message: 'API did not answer /api/ping' }
    )
    .toBe(200)
}

export const expectNoAxeViolations = async (page: Page) => {
  const results = await new AxeBuilder({ page }).analyze()
  const violations = results.violations.map(v => `${v.id}: ${v.help}`)
  expect(violations, 'axe-core must find no accessibility violations').toEqual([])
}

export const signUp = async (page: Page, name: string, email: string) => {
  const form = page
    .locator('form')
    .filter({ has: page.getByRole('heading', { name: 'Créer un User' }) })
  await form.getByLabel('Nom affiché').fill(name)
  await form.getByLabel('E-mail').fill(email)
  await form.getByLabel('Mot de passe').fill(PASSWORD)
  await form.getByRole('button', { name: 'Créer le User' }).click()
}

export const createGroup = async (page: Page, name: string) => {
  await page.getByLabel('Nom').fill(name)
  await page.getByRole('button', { name: 'Créer le Groupe' }).click()
  await page.getByRole('link', { name }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

export const captureInviteWrites = (page: Page) =>
  page.addInitScript(() => {
    const writes: string[] = []
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          writes.push(text)
        }
      }
    })
    ;(globalThis as { __inviteWrites?: string[] }).__inviteWrites = writes
  })

export const copyInvite = async (page: Page) => {
  await page.getByRole('button', { name: 'Copier le lien d’Invitation' }).click()
  return page.evaluate(
    () => (globalThis as { __inviteWrites?: string[] }).__inviteWrites?.at(-1) ?? ''
  )
}

export const joinInvite = async (
  page: Page,
  inviteUrl: string,
  name: string,
  email: string,
  groupName: string
) => {
  await page.goto(inviteUrl)
  await expect(page.getByRole('heading', { name: 'Invitation' })).toBeVisible()
  await expect(page.getByText(groupName)).toBeVisible()
  await signUp(page, name, email)
  await page.getByRole('button', { name: 'Rejoindre le Groupe' }).click()
  await expect(page.getByRole('listitem').filter({ hasText: name })).toBeVisible()
}

export const addExpense = async (page: Page, label: string, amount: string) => {
  await page.getByRole('button', { name: 'Ajouter une Dépense' }).click()
  const form = page.getByRole('form', { name: 'Constater une Dépense' })
  await form.getByLabel('Libellé').fill(label)
  await form.getByLabel('Jour').fill('2026-08-18')
  await form.getByLabel('Montant').fill(amount)
  await form.getByRole('button', { name: 'Constater la Dépense' }).click()
  await expect(page.getByText(label, { exact: true })).toBeVisible()
}

export const addPayback = async (page: Page, amount: string) => {
  await page.getByRole('tab', { name: 'Remboursements' }).click()
  await page.getByRole('button', { name: 'Ajouter un Remboursement' }).click()
  const form = page.getByRole('form', { name: 'Constater un Règlement' })
  await form.getByLabel('Jour').fill('2026-08-18')
  await form.getByLabel('Montant').fill(amount)
  await form.getByRole('button', { name: 'Constater le Règlement' }).click()
}
