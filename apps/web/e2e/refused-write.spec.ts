import { expect, test } from '@playwright/test'
import {
  addExpense,
  addPayback,
  captureInviteWrites,
  copyInvite,
  createGroup,
  joinInvite,
  signUp,
  uniqueEmail,
  waitForApi
} from './helpers'

test.describe('refused writes', () => {
  test.beforeAll(async ({ request }) => {
    await waitForApi(request)
  })

  test('renders the API error when a Payback exceeds its cap', async ({ browser }) => {
    const owner = await browser.newPage()
    await captureInviteWrites(owner)
    await owner.goto('/')
    await signUp(owner, 'Carol', uniqueEmail('carol'))
    await expect(owner.getByRole('heading', { name: 'Créer un Groupe' })).toBeVisible()
    await createGroup(owner, 'Potes de Carol')

    const guest = await browser.newPage()
    await joinInvite(guest, await copyInvite(owner), 'Dan', uniqueEmail('dan'), 'Potes de Carol')

    await owner.reload()
    await addExpense(owner, 'Resteau', '10')

    await addPayback(owner, '10')

    await expect(owner.getByRole('alert')).toHaveText('Montant au-dessus du plafond')
  })

  test('renders the API error when the session is missing', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto('/')
    await signUp(page, 'Dave', uniqueEmail('dave'))
    await expect(page.getByRole('heading', { name: 'Créer un Groupe' })).toBeVisible()

    await context.clearCookies()

    await page.getByLabel('Nom').fill('Groupe orphelin')
    await page.getByRole('button', { name: 'Créer le Groupe' }).click()

    await expect(page.getByRole('alert')).toHaveText('Session requise')
  })
})
