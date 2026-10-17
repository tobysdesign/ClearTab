import { test, expect, type Page } from '@playwright/test'

// Needs: @playwright/test, a Playwright config with baseURL, a dev server on
// localhost, and the dummy dev account signed in (see project memory).

// Chromium needs fake media flags for the mic prompt to resolve headlessly:
// test.use({ launchOptions: { args: [FAKE_MEDIA...] } })
const FAKE_MEDIA = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream']
test.use({ launchOptions: { args: FAKE_MEDIA } })

const VALID_KEY = 'AIzaSyA_1234567890abcdefghij'

async function stubRecording(page: Page) {
  await page.addInitScript(() => {
    ;(window as unknown as Record<string, unknown>).__CLEARTAB_FAKE_LOCAL_ASR__ = true
  })
  await page.route('**/api/transcribe', (r) =>
    r.fulfill({ status: 200, json: { success: true, data: { text: 'ok' } } }),
  )
}

async function recordAndStop(page: Page) {
  await page.getByRole('button', { name: 'Start recording' }).first().click()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: /Stop recording and transcribe/i }).first().click()
}

test('first run shows the 3-way choice; later runs show change', async ({ page, context }) => {
  await context.grantPermissions(['microphone'])
  await stubRecording(page)
  await page.goto('/tab')
  await page.evaluate(() => window.localStorage.removeItem('cleartab-transcription-config'))
  await page.reload()

  await recordAndStop(page)
  await expect(page.getByTestId('transcription-choice')).toBeVisible()
  await page.getByTestId('choice-local-en').click()
  await expect(page.getByTestId('transcription-choice')).toBeHidden()

  // let the ~2s "Saved to Notes" reset finish before recording again
  await page.waitForTimeout(2500)
  await recordAndStop(page)
  // remembered engine: no choice card on the 2nd run
  await expect(page.getByTestId('transcription-choice')).toBeHidden()
})

test('choosing Gemini without a key shows onboarding and validates the key', async ({ page, context }) => {
  await context.grantPermissions(['microphone'])
  await stubRecording(page)
  await page.goto('/tab')
  await page.evaluate(() => window.localStorage.removeItem('cleartab-transcription-config'))
  await page.reload()

  await recordAndStop(page)
  await page.getByTestId('choice-gemini').click()
  await expect(page.getByTestId('gemini-onboarding')).toBeVisible()
  await expect(page.getByTestId('gemini-key-save')).toBeDisabled()
  await page.getByTestId('gemini-key-input').fill(VALID_KEY)
  await expect(page.getByTestId('gemini-key-save')).toBeEnabled()
})
