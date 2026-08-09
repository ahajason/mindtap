import { chromium } from '@playwright/test';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const executable = process.env.MINDTAP_EXE
  ? resolve(process.env.MINDTAP_EXE)
  : resolve(projectRoot, 'build', 'mindtap.exe');
const port = Number(process.env.MINDTAP_CDP_PORT ?? 9333);
const endpoint = `http://127.0.0.1:${port}`;
const exactSymptom = "state not managed for field `state` on command `review_get_daily`";

if (!existsSync(executable)) {
  console.error(`[repro] 缺少生产 EXE：${executable}`);
  process.exit(2);
}

const existing = spawnSync(
  'powershell.exe',
  [
    '-NoProfile',
    '-Command',
    `$target = '${executable.replaceAll("'", "''")}'; Get-CimInstance Win32_Process -Filter \"Name='mindtap.exe'\" | Where-Object { $_.ExecutablePath -eq $target } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`,
  ],
  { stdio: 'inherit' },
);
if (existing.status !== 0) {
  console.error('[repro] 无法结束此前从 build\\mindtap.exe 启动的实例');
  process.exit(2);
}

const child = spawn(executable, [], {
  cwd: projectRoot,
  env: {
    ...process.env,
    WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${port}`,
  },
  stdio: 'ignore',
  windowsHide: false,
});

let browser;
try {
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${endpoint}/json/version`);
      if (response.ok) break;
    } catch {}
    await new Promise(resolvePromise => setTimeout(resolvePromise, 100));
  }

  browser = await chromium.connectOverCDP(endpoint);
  const context = browser.contexts()[0];
  if (!context) throw new Error('WebView2 未暴露 browser context');

  const deadlinePage = Date.now() + 10_000;
  let mainPage;
  while (Date.now() < deadlinePage) {
    for (const page of context.pages()) {
      const body = await page.locator('body').innerText().catch(() => '');
      if (body.includes('每日复盘')) {
        mainPage = page;
        break;
      }
    }
    if (mainPage) break;
    await new Promise(resolvePromise => setTimeout(resolvePromise, 100));
  }
  if (!mainPage) throw new Error('未找到 Mindtap 主窗的“每日复盘”页面');

  await mainPage.waitForTimeout(500);
  let body = await mainPage.locator('body').innerText();
  if (body.includes(exactSymptom) && process.argv.includes('--retry')) {
    const retry = mainPage.getByRole('button', { name: '重试' });
    await retry.click();
    await mainPage.waitForTimeout(500);
    body = await mainPage.locator('body').innerText();
  }
  if (body.includes(exactSymptom)) {
    throw new Error(`复现用户原始故障：${exactSymptom}`);
  }
  if (body.includes('加载失败')) {
    throw new Error(`复盘仍加载失败，但错误不同：\n${body}`);
  }
  if (!body.includes('已完成') || !body.includes('专注分布')) {
    throw new Error(`复盘未进入成功态：\n${body}`);
  }

  console.log('[repro] PASS：生产 EXE 已注册 DbState，review_get_daily 正常加载');
} catch (error) {
  console.error(`[repro] FAIL：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (child.pid) {
    spawnSync('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  }
}
