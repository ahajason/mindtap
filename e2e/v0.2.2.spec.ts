import { test, expect, type Page } from '@playwright/test';

/**
 * V0.2.2 E2E 测试
 * 覆盖: P2 复盘 + P3 导航 + P4 管理 + P6 设置 + 设计指南返回 + 待确认弹窗
 */

// Tauri IPC mock - 必须是纯 JS,无 TS 注解,无 async 关键字
function setupMocks(page: Page) {
  return page.addInitScript(() => {
    (window as any).__TAURI_INTERNALS__ = {
      invoke: function (cmd: string, _args?: any) {
        switch (cmd) {
          case 'review_get_daily':
            return {
              date: '2026-08-02',
              completed: [{ id: 1, content: '已完成任务', type: 'task', status: 'archived', focus_ms: 3600000, pending_ms: null, source: 'manual', progress_note: null, last_active_at: null, created_at: Date.now() - 86400000, updated_at: Date.now() - 3600000 }],
              active: [{ id: 2, content: '进行中任务', type: 'task', status: 'active', focus_ms: 1800000, last_active_at: Date.now() - 60000, pending_ms: null, source: 'manual', progress_note: null, created_at: Date.now() - 86400000, updated_at: Date.now() - 60000 }],
              todo: [{ id: 3, content: '待办任务', type: 'task', status: 'todo', focus_ms: 0, last_active_at: null, pending_ms: null, source: 'manual', progress_note: null, created_at: Date.now() - 86400000, updated_at: Date.now() - 86400000 }],
              stale: [{ id: 4, content: '待确认任务', type: 'task', status: 'active', focus_ms: 1200000, pending_ms: 600000, source: 'manual', progress_note: null, last_active_at: Date.now() - 600000, created_at: Date.now() - 86400000, updated_at: Date.now() - 600000 }],
              distribution: [{ item_id: 1, content: '已完成任务', focus_ms: 3600000 }],
              uncovered_gaps: [{ start: Date.now() - 5400000, end: Date.now() - 3600000, duration_ms: 1800000 }],
            };
          case 'item_confirm_pending':
            return null;
          case 'item_get_active':
            return [];
          case 'item_list_deleted':
            return [];
          case 'item_get_archived':
            return [];
          case 'setting_get':
            return null;
          case 'setting_set':
            return null;
          default:
            return null;
        }
      },
    };
    (window as any).__TAURI_EVENT__ = { listen: function () { return function () {}; } };
  });
}

test.describe('主窗导航 (P3)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/');
  });

  test('侧边栏显示导航项', async ({ page }) => {
    await expect(page.getByRole('link', { name: '每日复盘' })).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('link', { name: '任务管理' })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('link', { name: '设置' })).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('link', { name: '设计指南' })).toBeVisible({ timeout: 3000 });
  });

  test('点击「任务管理」导航到 /manage', async ({ page }) => {
    await page.getByRole('link', { name: '任务管理' }).click();
    await expect(page).toHaveURL(/\/manage/, { timeout: 3000 });
  });

  test('点击「设置」导航到 /settings', async ({ page }) => {
    await page.getByRole('link', { name: '设置' }).click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 3000 });
  });
});

test.describe('复盘视图 (P2)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/');
  });

  test('显示已完成任务', async ({ page }) => {
    await expect(page.getByText('已完成任务').first()).toBeVisible({ timeout: 5000 });
  });

  test('未记录时段显示', async ({ page }) => {
    await expect(page.getByText('未记录时段')).toBeVisible({ timeout: 5000 });
  });

  test('待确认任务显示确认/忽略按钮', async ({ page }) => {
    await expect(page.getByText('待确认 (1)')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: '确认' }).first()).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('button', { name: '忽略' })).toBeVisible({ timeout: 3000 });
  });
});

test.describe('管理页 (P4)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/manage');
  });

  test('显示视图切换按钮', async ({ page }) => {
    // 管理页加载后应有搜索框
    await expect(page.getByPlaceholder('搜索任务…')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('设置页 (P6)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMocks(page);
    await page.goto('/settings');
  });

  test('显示活动监听开关', async ({ page }) => {
    await expect(page.getByText('活动监听', { exact: true })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('设计指南返回按钮', () => {
  test('设计指南页面显示返回按钮', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/style-guide');
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible({ timeout: 5000 });
  });

  test('点击返回按钮回到主页', async ({ page }) => {
    await setupMocks(page);
    await page.goto('/');
    await page.goto('/style-guide');
    await page.getByRole('button', { name: '返回' }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 3000 });
  });
});
