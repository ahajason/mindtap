/**
 * Floating window v3 — 12-scenario visual baseline.
 *
 * Chromium-only baseline. webkit is not downloaded in this sandbox
 * (sandbox blocks MS CDN). To add webkit baseline:
 *   1. Manually run `npx playwright install webkit` outside sandbox
 *   2. Run `npx playwright test` (no --project filter) to update both browsers
 *
 * Scenarios (4 backgrounds × 3 states):
 *   1.  folded-no-task  + light bg
 *   2.  folded-no-task  + dark bg
 *   3.  folded-active   + light bg
 *   4.  folded-active   + dark bg
 *   5.  expanded-form-empty    + light bg
 *   6.  expanded-form-content  + light bg
 *   7.  expanded-form-content  + dark bg
 *   8.  expanded-timer-active  + light bg
 *   9.  expanded-timer-active  + busy bg
 *   10. expanded-timer-paused  + light bg
 *   11. expanded-with-close    + light bg
 *   12. expanded-segment-timer + light bg  (default form → click ⏱)
 */

import { test, expect, type Page } from '@playwright/test'

const BASE = 'http://localhost:1420'
const VIEWPORT = { width: 1280, height: 800 } as const

// ---------------------------------------------------------------------------
// Tauri API mock — injected before page load so app renders without errors.
// The non-Tauri Vite preview has no IPC backend; without this mock the app
// crashes and the screenshot is empty. We mock recordGetActiveTask and
// task_aggregate_today per test via overrides.
// ---------------------------------------------------------------------------

async function injectTauriMock(
  page: Page,
  opts: { activeTask?: any | null; aggregate?: any } = {},
) {
  const activeJson = JSON.stringify(opts.activeTask ?? null)
  const aggregateJson = JSON.stringify(
    opts.aggregate ?? { total_ms: 2 * 3600_000 + 15 * 60_000 + 42_000, segment_count: 6 },
  )

  await page.addInitScript(
    ({ activeJson, aggregateJson }) => {
      // @ts-ignore
      window.__TAURI_INTERNALS__ = {
        invoke: async (cmd: string, _args?: any) => {
          if (cmd === 'record_get_active_task') return JSON.parse(activeJson)
          if (cmd === 'task_aggregate_today') return JSON.parse(aggregateJson)
          if (cmd === 'frontend_log') return null
          // events.listen / etc — return a noop unlisten
          return null
        },
        metadata: { currentWindow: { label: 'floating' }, currentWebview: { label: 'floating' } },
      }
      // @ts-ignore
      window.__TAURI__ = {
        window: {
          getCurrentWindow: () => ({
            label: 'floating',
            close: () => {},
            hide: () => {},
            show: () => {},
            setFocus: () => {},
          }),
        },
      }
    },
    { activeJson, aggregateJson },
  )
}

async function gotoFloating(page: Page) {
  await page.setViewportSize(VIEWPORT)
  await page.goto(`${BASE}/floating.html`)
}

// ---------------------------------------------------------------------------
// Helpers — DOM selectors matching src/floating/* as of v3 redesign.
// FloatShell has no data-testid; we target its root div via a CSS selector
// that's unique (only fixed-position element with select-none cursor-grab).
// We also target inner landmarks for state assertions.
// ---------------------------------------------------------------------------

const FLOAT_SHELL = '.select-none.cursor-grab'
const FOLDED_BAR = `${FLOAT_SHELL} > div` // FoldedBar root when collapsed
const EXPAND_PANEL = '[data-float-expand]'
const SEGMENTED_TABS = '[role="tablist"] [role="tab"]'
const SEGMENTED_TIMER = `${SEGMENTED_TABS}[aria-selected="false"][aria-label="计时"], ${SEGMENTED_TABS}:nth-child(1)`
const SEGMENTED_FORM = `${SEGMENTED_TABS}[aria-selected="false"][aria-label="记录"], ${SEGMENTED_TABS}:nth-child(2)`
const CLOSE_BTN = '[data-close]'
const FORM_PANEL = '[data-segment="form"]'
const TIMER_PANEL = '[data-segment="timer"]'

async function waitShell(page: Page) {
  // Wait for any rendered DOM inside FloatShell
  await page.waitForSelector(`${FOLDED_BAR}, ${EXPAND_PANEL}`, { state: 'attached' })
}

async function clickFoldedBarToExpand(page: Page) {
  // FloatShell mousedown/mouseup <4px = short click = toggle expand.
  // FloatShell is at viewport (-640, ...) — off-screen left due to OuterShell's
  // transform: translate(-50%, -50%) centering. Playwright's coordinate-based
  // mouse.down/up won't hit off-screen elements, so dispatch events directly.
  await page.evaluate(() => {
    const el = document.querySelector('.select-none.cursor-grab') as HTMLElement
    if (!el) throw new Error('float shell not found')
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    el.dispatchEvent(new MouseEvent('mousedown', { clientX: x, clientY: y, bubbles: true, button: 0 }))
    document.dispatchEvent(new MouseEvent('mouseup', { clientX: x, clientY: y, bubbles: true, button: 0 }))
  })
  // Wait for expand animation (320ms transition)
  await page.waitForTimeout(450)
  await expect(page.locator(EXPAND_PANEL)).toBeVisible()
}

// Click any element via JS-dispatched MouseEvent. Bypasses viewport checks.
async function clickViaJs(page: Page, selector: string, nth = 0) {
  await page.evaluate(
    ({ sel, i }) => {
      const els = document.querySelectorAll(sel)
      const el = els[i] as HTMLElement
      if (!el) throw new Error(`no element at ${sel}[${i}]`)
      el.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 0 }))
      // also fire pointerdown/up for ARIA + pointer-event handlers
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }))
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0 }))
    },
    { sel: selector, i: nth },
  )
  await page.waitForTimeout(120)
}

// Fill an input/textarea via JS — for off-screen elements Playwright's .fill() can't scroll into view.
async function fillViaJs(page: Page, selector: string, value: string) {
  await page.evaluate(
    ({ sel, v }) => {
      const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement
      if (!el) throw new Error(`no element at ${sel}`)
      const proto = Object.getPrototypeOf(el)
      const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
      setter?.call(el, v)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { sel: selector, v: value },
  )
  await page.waitForTimeout(80)
}

// ---------------------------------------------------------------------------
// Backgrounds
// ---------------------------------------------------------------------------

const BG_LIGHT = '#ffffff'
const BG_DARK = '#0e0e16'
const BG_BUSY =
  'linear-gradient(135deg, #f6d365 0%, #fda085 35%, #ff7eb3 70%, #7afcff 100%)'

async function setBodyBg(page: Page, bg: string) {
  await page.evaluate((b) => {
    document.body.style.background = b
    document.body.style.backgroundColor = b
    document.documentElement.style.background = b
  }, bg)
}

// ---------------------------------------------------------------------------
// 12 scenarios
// ---------------------------------------------------------------------------

test.describe('floating v3 visual baseline', () => {
  test('01 · folded · no task · light bg', async ({ page }) => {
    await injectTauriMock(page, { activeTask: null })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await page.waitForTimeout(200)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-01-folded-no-task-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('02 · folded · no task · dark bg', async ({ page }) => {
    await injectTauriMock(page, { activeTask: null })
    await gotoFloating(page)
    await setBodyBg(page, BG_DARK)
    await waitShell(page)
    await page.waitForTimeout(200)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-02-folded-no-task-dark.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('03 · folded · active task · light bg', async ({ page }) => {
    await injectTauriMock(page, {
      activeTask: {
        id: 1,
        content: '写浮窗 v3 baseline',
        status: 'active',
        duration_ms: 5 * 60_000,
        first_focused_at: Date.now() - 6 * 60_000,
        focus_started_at: Date.now() - 60_000,
        paused_at: null,
        focused_count: 1,
        due_at: null,
        created_at: Date.now() - 10 * 60_000,
        updated_at: Date.now(),
        archived_at: null,
      },
    })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await page.waitForTimeout(200)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-03-folded-active-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('04 · folded · active task · dark bg', async ({ page }) => {
    await injectTauriMock(page, {
      activeTask: {
        id: 1,
        content: '写浮窗 v3 baseline',
        status: 'active',
        duration_ms: 5 * 60_000,
        first_focused_at: Date.now() - 6 * 60_000,
        focus_started_at: Date.now() - 60_000,
        paused_at: null,
        focused_count: 1,
        due_at: null,
        created_at: Date.now() - 10 * 60_000,
        updated_at: Date.now(),
        archived_at: null,
      },
    })
    await gotoFloating(page)
    await setBodyBg(page, BG_DARK)
    await waitShell(page)
    await page.waitForTimeout(200)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-04-folded-active-dark.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('05 · expanded · form empty · light bg', async ({ page }) => {
    await injectTauriMock(page, { activeTask: null })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    await expect(page.locator(FORM_PANEL)).toBeVisible()
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-05-expanded-form-empty-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('06 · expanded · form with content · light bg', async ({ page }) => {
    await injectTauriMock(page, { activeTask: null })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    await expect(page.locator(FORM_PANEL)).toBeVisible()
    await fillViaJs(page, `${FORM_PANEL} textarea`, '重写 FloatShell 让折叠↔展开用 CSS grid')
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-06-expanded-form-content-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('07 · expanded · form with content · dark bg', async ({ page }) => {
    await injectTauriMock(page, { activeTask: null })
    await gotoFloating(page)
    await setBodyBg(page, BG_DARK)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    await expect(page.locator(FORM_PANEL)).toBeVisible()
    await fillViaJs(page, `${FORM_PANEL} textarea`, '重写 FloatShell 让折叠↔展开用 CSS grid')
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-07-expanded-form-content-dark.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('08 · expanded · timer active · light bg', async ({ page }) => {
    await injectTauriMock(page, {
      activeTask: {
        id: 1,
        content: '写浮窗 v3 baseline',
        status: 'active',
        duration_ms: 12 * 60_000 + 34_000,
        first_focused_at: Date.now() - 13 * 60_000,
        focus_started_at: Date.now() - 34_000,
        paused_at: null,
        focused_count: 1,
        due_at: null,
        created_at: Date.now() - 15 * 60_000,
        updated_at: Date.now(),
        archived_at: null,
      },
    })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    // Switch to timer segment (default is form per D-07)
    await clickViaJs(page, SEGMENTED_TABS, 0)
    await expect(page.locator(TIMER_PANEL)).toBeVisible()
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-08-expanded-timer-active-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('09 · expanded · timer active · busy bg', async ({ page }) => {
    await injectTauriMock(page, {
      activeTask: {
        id: 1,
        content: '写浮窗 v3 baseline',
        status: 'active',
        duration_ms: 12 * 60_000 + 34_000,
        first_focused_at: Date.now() - 13 * 60_000,
        focus_started_at: Date.now() - 34_000,
        paused_at: null,
        focused_count: 1,
        due_at: null,
        created_at: Date.now() - 15 * 60_000,
        updated_at: Date.now(),
        archived_at: null,
      },
    })
    await gotoFloating(page)
    await setBodyBg(page, BG_BUSY)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    await clickViaJs(page, SEGMENTED_TABS, 0)
    await expect(page.locator(TIMER_PANEL)).toBeVisible()
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-09-expanded-timer-active-busy.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('10 · expanded · timer paused · light bg', async ({ page }) => {
    await injectTauriMock(page, {
      activeTask: {
        id: 1,
        content: '写浮窗 v3 baseline',
        status: 'paused',
        duration_ms: 18 * 60_000 + 42_000,
        first_focused_at: Date.now() - 20 * 60_000,
        focus_started_at: null,
        paused_at: Date.now() - 60_000,
        focused_count: 1,
        due_at: null,
        created_at: Date.now() - 25 * 60_000,
        updated_at: Date.now(),
        archived_at: null,
      },
    })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    await clickViaJs(page, SEGMENTED_TABS, 0)
    await expect(page.locator(TIMER_PANEL)).toBeVisible()
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-10-expanded-timer-paused-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('11 · expanded · close button visible · light bg', async ({ page }) => {
    await injectTauriMock(page, { activeTask: null })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    await expect(page.locator(CLOSE_BTN)).toBeVisible()
    await expect(page.locator(FORM_PANEL)).toBeVisible()
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-11-expanded-close-button-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })

  test('12 · expanded · segment switch to timer · light bg', async ({ page }) => {
    await injectTauriMock(page, {
      activeTask: {
        id: 1,
        content: '写浮窗 v3 baseline',
        status: 'active',
        duration_ms: 4 * 60_000,
        first_focused_at: Date.now() - 5 * 60_000,
        focus_started_at: Date.now() - 60_000,
        paused_at: null,
        focused_count: 1,
        due_at: null,
        created_at: Date.now() - 8 * 60_000,
        updated_at: Date.now(),
        archived_at: null,
      },
    })
    await gotoFloating(page)
    await setBodyBg(page, BG_LIGHT)
    await waitShell(page)
    await clickFoldedBarToExpand(page)
    // Form is default; click ⏱ segmented to switch to timer
    await clickViaJs(page, SEGMENTED_TABS, 0)
    await expect(page.locator(TIMER_PANEL)).toBeVisible()
    await page.waitForTimeout(150)
    await expect(page.locator(FLOAT_SHELL)).toHaveScreenshot(
      'floating-12-expanded-segment-timer-light.png',
      { maxDiffPixelRatio: 0.001 },
    )
  })
})
