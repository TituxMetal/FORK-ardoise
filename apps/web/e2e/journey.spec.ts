import { expect, test, type Page } from '@playwright/test'
import {
  addExpense,
  addPayback,
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
    await expect(ownerPage.getByRole('heading', { name: 'Créer un compte' })).toBeVisible()
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
    await expect(guestPage.getByText('Potes de Bob')).toBeVisible()
    await expectNoAxeViolations(guestPage)
    await signUp(guestPage, 'Bob', uniqueEmail('bob'))
    await guestPage.getByRole('button', { name: 'Rejoindre le Groupe' }).click()

    await expect(guestPage.getByRole('listitem').filter({ hasText: 'Alice' })).toBeVisible()
    await expect(guestPage.getByRole('listitem').filter({ hasText: 'Bob' })).toBeVisible()
    await expectNoAxeViolations(guestPage)
  })

  test('adds an Expense then settles it with a Payback', async () => {
    await ownerPage.reload()
    await expect(ownerPage.getByRole('heading', { name: 'Potes de Bob' })).toBeVisible()

    await addExpense(ownerPage, 'Resteau', '10')
    await expect(ownerPage.getByText('On te doit 5,00 €')).toBeVisible()

    await addPayback(ownerPage, '5')
    await expect(ownerPage.getByText('Bob → Alice')).toBeVisible()
    await expect(ownerPage.getByText('5,00 €')).toBeVisible()
    await expect(ownerPage.getByText('On te doit 0,00 €')).toBeVisible()
    await expectNoAxeViolations(ownerPage)
  })

  test('edits an Expense from its row and deletes it behind a confirmation', async () => {
    await ownerPage.getByRole('tab', { name: 'Dépenses' }).click()
    await ownerPage.getByRole('button', { name: 'Modifier Resteau' }).click()
    const editForm = ownerPage.getByRole('form', { name: 'Modifier une Dépense' })
    await editForm.getByLabel('Libellé').fill('Resteau des familles')
    await editForm.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(ownerPage.getByText('Resteau des familles')).toBeVisible()

    await ownerPage.getByRole('button', { name: 'Supprimer Resteau des familles' }).click()
    await expect(
      ownerPage.getByRole('group', { name: 'Supprimer « Resteau des familles » ?' })
    ).toBeVisible()
    await ownerPage.getByRole('button', { name: 'Annuler' }).click()
    await expect(ownerPage.getByText('Resteau des familles')).toBeVisible()

    await ownerPage.getByRole('button', { name: 'Supprimer Resteau des familles' }).click()
    await ownerPage.getByRole('button', { name: 'Supprimer' }).click()
    await expect(ownerPage.getByText('Aucune Dépense')).toBeVisible()
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
    await expect(
      ownerPage.getByRole('complementary').getByText('Session ouverte : Aline')
    ).toBeVisible()

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
