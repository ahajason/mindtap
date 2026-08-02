// V0.2.2 P6 收尾:设置页(2026-08-03)。
// 通知开关 + 活动监听开关 + 时区偏移显示。

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/tauri-bridge';
import PageHeader from '@/components/style-guide/PageHeader';

const SETTING_KEYS = {
  notificationEnabled: 'notification_enabled',
  activityMonitor: 'activity_monitor_enabled',
  notificationLevelIdle: 'notification_level_idle',
  notificationLevelActivity: 'notification_level_activity',
  localTzOffset: 'local_tz_offset_secs',
  // V0.2.2 失真检测周期控制(分钟单位存储)
  dormantCoolingMin: 'dormant_cooling_min',
  idleAutoPauseMin: 'idle_auto_pause_min',
  dormantPollMin: 'dormant_poll_min',
  bgScanSec: 'bg_scan_sec',
  // V0.2.2 开发者选项
  developerMode: 'developer_mode_enabled',
} as const;

const DEFAULTS: Record<string, number> = {
  dormantCoolingMin: 120,    // 2 小时
  idleAutoPauseMin: 10,      // 10 分钟
  dormantPollMin: 5,         // 5 分钟
  bgScanSec: 30,             // 30 秒
};

export default function SettingsRoute() {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [activityMonitor, setActivityMonitor] = useState(false);
  const [tzOffset, setTzOffset] = useState<number | null>(null);
  // V0.2.2 失真检测周期控制
  const [dormantCoolingMin, setDormantCoolingMin] = useState(DEFAULTS.dormantCoolingMin);
  const [idleAutoPauseMin, setIdleAutoPauseMin] = useState(DEFAULTS.idleAutoPauseMin);
  const [dormantPollMin, setDormantPollMin] = useState(DEFAULTS.dormantPollMin);
  const [bgScanSec, setBgScanSec] = useState(DEFAULTS.bgScanSec);
  // V0.2.2 开发者选项
  const [developerMode, setDeveloperMode] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const [notif, monitor, tz, cooling, idle, poll, scan, devMode] = await Promise.all([
        api.setting.get(SETTING_KEYS.notificationEnabled),
        api.setting.get(SETTING_KEYS.activityMonitor),
        api.setting.get(SETTING_KEYS.localTzOffset),
        api.setting.get(SETTING_KEYS.dormantCoolingMin),
        api.setting.get(SETTING_KEYS.idleAutoPauseMin),
        api.setting.get(SETTING_KEYS.dormantPollMin),
        api.setting.get(SETTING_KEYS.bgScanSec),
        api.setting.get(SETTING_KEYS.developerMode),
      ]);
      setNotificationEnabled(notif !== 'false');
      setActivityMonitor(monitor === 'true');
      setTzOffset(tz != null ? Number(tz) : null);
      setDormantCoolingMin(cooling != null ? Number(cooling) : DEFAULTS.dormantCoolingMin);
      setIdleAutoPauseMin(idle != null ? Number(idle) : DEFAULTS.idleAutoPauseMin);
      setDormantPollMin(poll != null ? Number(poll) : DEFAULTS.dormantPollMin);
      setBgScanSec(scan != null ? Number(scan) : DEFAULTS.bgScanSec);
      setDeveloperMode(devMode === 'true');
    } catch (err) {
      console.error('[settings] load failed', err);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const toggleSetting = async (key: string, value: boolean) => {
    try {
      await api.setting.set(key, String(value));
      if (key === SETTING_KEYS.notificationEnabled) setNotificationEnabled(value);
      if (key === SETTING_KEYS.activityMonitor) setActivityMonitor(value);
      if (key === SETTING_KEYS.developerMode) setDeveloperMode(value);
    } catch (err) {
      console.error('[settings] save failed', err);
    }
  };

  // V0.2.2: 失真检测参数保存(即时生效,后端下次读取 app_setting 时使用新值)
  const saveNumericSetting = async (key: string, value: number, setter: (v: number) => void) => {
    try {
      await api.setting.set(key, String(value));
      setter(value);
    } catch (err) {
      console.error('[settings] save numeric failed', err);
    }
  };

  const resetDefaults = async () => {
    await Promise.all([
      saveNumericSetting(SETTING_KEYS.dormantCoolingMin, DEFAULTS.dormantCoolingMin, setDormantCoolingMin),
      saveNumericSetting(SETTING_KEYS.idleAutoPauseMin, DEFAULTS.idleAutoPauseMin, setIdleAutoPauseMin),
      saveNumericSetting(SETTING_KEYS.dormantPollMin, DEFAULTS.dormantPollMin, setDormantPollMin),
      saveNumericSetting(SETTING_KEYS.bgScanSec, DEFAULTS.bgScanSec, setBgScanSec),
    ]);
  };

  const tzHours = tzOffset != null ? (tzOffset / 3600).toFixed(0) : '--';
  const tzSign = tzOffset != null && tzOffset >= 0 ? '+' : '';

  return (
    <div>
      <PageHeader title="设置" description="通知与活动监听偏好" />

      <div className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)] space-y-4">
        {/* 通知开关 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-1">系统通知</p>
            <p className="text-xs text-text-3">空闲自动暂停、失真确认时推送</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={notificationEnabled}
              onChange={e => toggleSetting(SETTING_KEYS.notificationEnabled, e.target.checked)}
            />
            <div className="w-9 h-5 bg-inactive rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        {/* 活动监听开关 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-1">活动监听</p>
            <p className="text-xs text-text-3">检测前台应用变化，浮窗建议记录</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={activityMonitor}
              onChange={e => toggleSetting(SETTING_KEYS.activityMonitor, e.target.checked)}
            />
            <div className="w-9 h-5 bg-inactive rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        {/* 时区偏移(只读) */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-1">时区偏移</p>
            <p className="text-xs text-text-3">UTC{tzSign}{tzHours} 小时</p>
          </div>
          <span className="text-sm text-text-2 font-mono">
            UTC{tzSign}{tzHours}
          </span>
        </div>
      </div>

      {/* V0.2.2: 开发者选项面板（类比 Android 开发者选项） */}
      <div className="glass-l2 rounded-[var(--radius-card)] p-[var(--spacing-4)] space-y-4 mt-4">
        {/* 总开关 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-text-1">开发者选项</p>
            <p className="text-xs text-text-3">开启后显示失真测试按钮和检测参数调整</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={developerMode}
              onChange={e => toggleSetting(SETTING_KEYS.developerMode, e.target.checked)}
            />
            <div className="w-9 h-5 bg-inactive rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
          </label>
        </div>

        {/* 开发者选项内容：仅在总开关开启时显示 */}
        {developerMode && (
          <>
            <div className="border-t border-glass-3 pt-4" />

            {/* 失真检测参数 */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-text-1">失真检测周期</p>
              <button
                type="button"
                onClick={resetDefaults}
                className="text-xs text-primary hover:text-primary-hover transition-colors"
              >
                恢复默认值
              </button>
            </div>

            {/* 冷却阈值 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-1">冷却阈值</p>
                <p className="text-xs text-text-3">任务无操作超过此阈值触发失真确认</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={30}
                  max={1440}
                  value={dormantCoolingMin}
                  onChange={e => {
                    const v = Math.max(30, Math.min(1440, Number(e.target.value) || DEFAULTS.dormantCoolingMin));
                    setDormantCoolingMin(v);
                  }}
                  onBlur={() => saveNumericSetting(SETTING_KEYS.dormantCoolingMin, dormantCoolingMin, setDormantCoolingMin)}
                  className="w-20 rounded-[8px] bg-glass-2 px-2 py-1 text-sm text-text-1 text-right border border-glass-3 focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-text-3">分钟</span>
              </div>
            </div>

            {/* 空闲自动暂停超时 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-1">空闲自动暂停</p>
                <p className="text-xs text-text-3">系统无键鼠输入超过此阈值自动暂停</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={idleAutoPauseMin}
                  onChange={e => {
                    const v = Math.max(1, Math.min(120, Number(e.target.value) || DEFAULTS.idleAutoPauseMin));
                    setIdleAutoPauseMin(v);
                  }}
                  onBlur={() => saveNumericSetting(SETTING_KEYS.idleAutoPauseMin, idleAutoPauseMin, setIdleAutoPauseMin)}
                  className="w-20 rounded-[8px] bg-glass-2 px-2 py-1 text-sm text-text-1 text-right border border-glass-3 focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-text-3">分钟</span>
              </div>
            </div>

            {/* 失真检测轮询间隔(前端) */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-1">失真轮询间隔</p>
                <p className="text-xs text-text-3">浮窗气泡窗口轮询检测的间隔</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={dormantPollMin}
                  onChange={e => {
                    const v = Math.max(1, Math.min(60, Number(e.target.value) || DEFAULTS.dormantPollMin));
                    setDormantPollMin(v);
                  }}
                  onBlur={() => saveNumericSetting(SETTING_KEYS.dormantPollMin, dormantPollMin, setDormantPollMin)}
                  className="w-20 rounded-[8px] bg-glass-2 px-2 py-1 text-sm text-text-1 text-right border border-glass-3 focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-text-3">分钟</span>
              </div>
            </div>

            {/* 后台线程扫描间隔 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-1">后台扫描间隔</p>
                <p className="text-xs text-text-3">后端线程执行空闲+失真+前台监听的周期</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={10}
                  max={300}
                  value={bgScanSec}
                  onChange={e => {
                    const v = Math.max(10, Math.min(300, Number(e.target.value) || DEFAULTS.bgScanSec));
                    setBgScanSec(v);
                  }}
                  onBlur={() => saveNumericSetting(SETTING_KEYS.bgScanSec, bgScanSec, setBgScanSec)}
                  className="w-20 rounded-[8px] bg-glass-2 px-2 py-1 text-sm text-text-1 text-right border border-glass-3 focus:outline-none focus:border-primary"
                />
                <span className="text-xs text-text-3">秒</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}