import { expect, test, type Page } from '@playwright/test'
import {
  addExpense,
  captureInviteWrites,
  copyInvite,
  createGroup,
  expectNoAxeViolations,
  signUp,
  uniqueEmail,
  waitForApi
} from './helpers'

let ownerPage: Page
let inviteUrl = ''

test.describe('core journey', () => {
  test.describe.configure({ mode: 'serial' })

  test.beforeAll(async ({ request }) => {
    await waitForApi(request)
  })

  test('signs up, creates a Group and copies its Invite link', async ({ browser }) => {
    const context = await browser.newContext()
    ownerPage = await context.newPage()
    await captureInviteWrites(ownerPage)
    await ownerPage.goto('/')
    await expect(ownerPage.getByRole('heading', { name: 'Créer un User' })).toBeVisible()
    await expectNoAxeViolations(ownerPage)
    await signUp(ownerPage, 'Alice', uniqueEmail('alice'))
    await expect(ownerPage.getByRole('heading', { name: 'Créer un Groupe' })).toBeVisible()
    await expectNoAxeViolations(ownerPage)

    await createGroup(ownerPage, 'Potes de Bob')
    await expectNoAxeViolations(ownerPage)

    inviteUrl = await copyInvite(ownerPage)
    expect(inviteUrl).toMatch(/\/invites\/[^/]+$/)
  })

  test('joins the Group from another session via the Invite link', async ({ browser }) => {
    const context = await browser.newContext()
    const guestPage = await context.newPage()
    await guestPage.goto(inviteUrl)
    await expect(guestPage.getByRole('heading', { name: 'Invitation' })).toBeVisible()
    await expectNoAxeViolations(guestPage)
    await signUp(guestPage, 'Bob', uniqueEmail('bob'))
    await expect(guestPage.getByRole('heading', { name: 'Potes de Bob' })).toBeVisible()

    await expect(guestPage.getByRole('listitem').filter({ hasText: 'Alice' })).toBeVisible()
    await expect(guestPage.getByRole('listitem').filter({ hasText: 'Bob' })).toBeVisible()
    await expectNoAxeViolations(guestPage)
  })

  test('adds an Expense then settles it with a Payback', async () => {
    await ownerPage.reload()
    await expect(ownerPage.getByRole('heading', { name: 'Potes de Bob' })).toBeVisible()

    await addExpense(ownerPage, 'Resteau', '10')

    const paybackForm = ownerPage.getByRole('form', { name: 'Constater un Règlement' })
    await paybackForm.getByLabel('Montant').fill('5')
    await paybackForm.getByRole('button', { name: 'Constater le Règlement' }).click()
    await expect(ownerPage.getByText('Bob → Alice 5,00 €')).toBeVisible()
    await expectNoAxeViolations(ownerPage)
  })

  test('renames the profile and keeps the new name across reloads', async () => {
    await ownerPage.getByRole('link', { name: 'Profil' }).click()
    await expect(ownerPage).toHaveURL(/\/profile/)
    await expect(ownerPage.getByRole('heading', { name: 'Profil' })).toBeVisible()
    await expectNoAxeViolations(ownerPage)

    const form = ownerPage.getByRole('form', { name: 'Modifier mon nom' })
    await form.getByLabel('Nom').fill('Aline')
    await form.getByRole('button', { name: 'Enregistrer' }).click()

    await expect(ownerPage.getByText('Nom modifié')).toBeVisible()
    await expect(ownerPage.getByText('Session ouverte : Aline')).toBeVisible()

    await ownerPage.goto('/profile')
    await expect(form.getByLabel('Nom')).toHaveValue('Aline')
    await expectNoAxeViolations(ownerPage)
  })

  test('renames the Group and leaves it behind a confirmation', async () => {
    await ownerPage.goto('/')
    await expect(ownerPage.getByRole('heading', { name: 'Mes Groupes' })).toBeVisible()
    await expectNoAxeViolations(ownerPage)

    await ownerPage.getByRole('button', { name: 'Renommer Potes de Bob' }).click()
    const renameForm = ownerPage.getByRole('form', { name: 'Renommer le Groupe' })
    await renameForm.getByLabel('Nom').fill('Soirée de Bob')
    await renameForm.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(ownerPage.getByRole('link', { name: 'Soirée de Bob' })).toBeVisible()
    await expectNoAxeViolations(ownerPage)

    await ownerPage.getByRole('button', { name: 'Quitter Soirée de Bob' }).click()
    await expect(ownerPage.getByRole('group', { name: 'Quitter le Groupe' })).toBeVisible()
    await expectNoAxeViolations(ownerPage)
    await ownerPage.getByRole('button', { name: 'Quitter' }).click()

    await expect(ownerPage.getByRole('link', { name: 'Soirée de Bob' })).toHaveCount(0)
    await expectNoAxeViolations(ownerPage)
  })
})
