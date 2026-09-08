import { expect, test } from '@playwright/test'
import {
  expectNoAxeViolations,
  reachRegistration,
  signUp,
  uniqueEmail,
  waitForApi
} from './helpers'

const MOBILE = { width: 390, height: 844 }
const DESKTOP = { width: 1280, height: 800 }

test.describe('app shell', () => {
  test.beforeAll(async ({ request }) => {
    await waitForApi(request)
  })

  test('shows a sticky bottom tab bar below the breakpoint and navigates to real pages', async ({
    browser
  }) => {
    const context = await browser.newContext({ viewport: MOBILE })
    const page = await context.newPage()
    await reachRegistration(page)
    await signUp(page, 'Nino', uniqueEmail('nino'))

    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toHaveCount(1)
    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toHaveCSS(
      'position',
      'sticky'
    )
    await expect(page.getByRole('link', { name: 'Mes Groupes' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Profil' })).toBeVisible()
    await expect(page.locator('aside')).toBeHidden()

    await page.getByRole('link', { name: 'Profil' }).click()
    await expect(page).toHaveURL(/\/profile/)
    await expect(page.getByRole('heading', { name: 'Profil' })).toBeVisible()

    await page.getByRole('link', { name: 'Mes Groupes' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Mes Groupes' })).toBeVisible()
    await expectNoAxeViolations(page)
  })

  test('meets the auth card signed-out on protected deep links without private chrome', async ({
    browser
  }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    for (const path of ['/profile', '/groups/some-group']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { name: 'Créer un compte' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Se connecter' })).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'Mes Groupes' })).toHaveCount(0)
      await expect(page.getByRole('link', { name: 'Profil' })).toHaveCount(0)
    }
  })

  test('shows a sticky sidebar at and above the breakpoint and navigates to real pages', async ({
    browser
  }) => {
    const context = await browser.newContext({ viewport: DESKTOP })
    const page = await context.newPage()
    await reachRegistration(page)
    await signUp(page, 'Mina', uniqueEmail('mina'))

    await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toHaveCount(1)
    await expect(page.locator('aside')).toBeVisible()
    await expect(page.locator('aside')).toHaveCSS('position', 'sticky')
    await expect(page.getByRole('link', { name: 'Mes Groupes' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Profil' })).toBeVisible()

    await page.getByRole('link', { name: 'Profil' }).click()
    await expect(page).toHaveURL(/\/profile/)
    await expect(page.getByRole('heading', { name: 'Profil' })).toBeVisible()

    await page.getByRole('link', { name: 'Mes Groupes' }).click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('heading', { name: 'Mes Groupes' })).toBeVisible()
    await expectNoAxeViolations(page)
  })
})
