/**
 * Lightweight server-side logger
 * --------------------------------
 * En développement  → tout est affiché
 * En production     → seuls error et warn sont émis (pas de console.log)
 *
 * Usage:
 *   import { logger } from '@/lib/utils/logger'
 *   logger.info('message', { extra: 'data' })
 *   logger.warn('something odd')
 *   logger.error('failed', error)
 */

const isDev = process.env.NODE_ENV === 'development';

function fmt(level: string, msg: string, meta?: unknown): string {
  const ts = new Date().toISOString();
  return meta !== undefined
    ? `[${ts}] [${level}] ${msg} ${JSON.stringify(meta)}`
    : `[${ts}] [${level}] ${msg}`;
}

export const logger = {
  debug(msg: string, meta?: unknown) {
    if (isDev) console.debug(fmt('DEBUG', msg, meta));
  },
  info(msg: string, meta?: unknown) {
    if (isDev) console.log(fmt('INFO', msg, meta));
  },
  warn(msg: string, meta?: unknown) {
    console.warn(fmt('WARN', msg, meta));
  },
  error(msg: string, meta?: unknown) {
    console.error(fmt('ERROR', msg, meta));
  },
};
