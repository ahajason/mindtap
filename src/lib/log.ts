import { invoke } from '@tauri-apps/api/core'
import { isDev } from './env'

async function send(level: 'error' | 'warn' | 'info' | 'debug', msg: string, rest: unknown[]) {
  if (isDev) {
    // eslint-disable-next-line no-console
    console[level === 'debug' ? 'log' : level](msg, ...rest)
  }
  try {
    await invoke('frontend_log', { level, message: msg, args: rest.map(String).join(' ') })
  } catch { /* silent */ }
}

export const log = {
  error: (msg: string, ...rest: unknown[]) => send('error', msg, rest),
  warn: (msg: string, ...rest: unknown[]) => send('warn', msg, rest),
  info: (msg: string, ...rest: unknown[]) => isDev && send('info', msg, rest),
  debug: (msg: string, ...rest: unknown[]) => isDev && send('debug', msg, rest),
}
