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
} as const;

export default function SettingsRoute() {
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [activityMonitor, setActivityMonitor] = useState(false);
  const [tzOffset, setTzOffset] = useState<number | null>(null);

  const loadSettings = useCallback(async () => {
    try {
      const [notif, monitor, tz] = await Promise.all([
        api.setting.get(SETTING_KEYS.notificationEnabled),
        api.setting.get(SETTING_KEYS.activityMonitor),
        api.setting.get(SETTING_KEYS.localTzOffset),
      ]);
      setNotificationEnabled(notif !== 'false');
      setActivityMonitor(monitor === 'true');
      setTzOffset(tz != null ? Number(tz) : null);
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
    } catch (err) {
      console.error('[settings] save failed', err);
    }
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
            <div className="w-9 h-5 bg-glass-2 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
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
            <div className="w-9 h-5 bg-glass-2 rounded-full peer peer-checked:bg-primary peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
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
    </div>
  );
}