import { fileURLToPath } from 'node:url'
import { isWindows } from 'std-env'
import { expect, test } from './test-utils'

const fixtureDir = fileURLToPath(new URL('../fixtures/hydration-navigation', import.meta.url))

test.use({
  nuxt: {
    rootDir: fixtureDir,
    server: true,
    browser: true,
    setupTimeout: (isWindows ? 360 : 120) * 1000,
  },
})

test.describe('Navigation during hydration', () => {
  test('completes a back navigation pressed while hydration is pending', async ({ page, goto }) => {
    await goto('/')
    await expect(page.getByTestId('index-title')).toBeVisible()

    // create a same-document history entry, so a later browser back is a popstate
    await page.getByTestId('link-hydrating').click()
    await page.waitForFunction(() => window.useNuxtApp?.()._route.path === '/hydrating')
    await expect(page.getByTestId('hydrating-content')).toBeVisible()

    // after a reload, the slow widget's setup keeps the hydration suspense pending
    await page.reload()

    // go back once the app has mounted (`__vue_app__` is set) but is still hydrating
    await page.waitForFunction(() => window.useNuxtApp?.().isHydrating === true
      && !!(document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__)
    await page.goBack()

    // once hydration settles the held navigation completes: url, route and DOM agree
    await page.waitForFunction(() => window.useNuxtApp?.()._route.path === '/')
    await expect(page.getByTestId('index-title')).toBeVisible()
    await expect(page.getByTestId('hydrating-content')).not.toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/')

    expect(page).toHaveNoErrorsOrWarnings()
  })
})
