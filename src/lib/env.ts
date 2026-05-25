/**
 * Environment Variable Validation
 * --------------------------------
 * Core vars are required in production runtime (DB + auth).
 * Optional vars only warn — validated per feature (upload, cron, NextAuth URL).
 */

const CORE_VARS = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
] as const;

const OPTIONAL_VARS = [
  'NEXTAUTH_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CRON_SECRET',
] as const;

export type CoreEnvKey = (typeof CORE_VARS)[number];
export type OptionalEnvKey = (typeof OPTIONAL_VARS)[number];
export type EnvKey = CoreEnvKey | OptionalEnvKey;

function isProductionRuntime(): boolean {
  return (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PHASE !== 'phase-production-build'
  );
}

function validateCoreEnv(): void {
  const missing = CORE_VARS.filter((key) => !process.env[key]);

  if (missing.length === 0) return;

  const msg = `[env] Variables d'environnement manquantes (core) : ${missing.join(', ')}`;

  if (isProductionRuntime()) {
    throw new Error(msg);
  }
  console.warn(`\x1b[33m⚠ ${msg}\x1b[0m`);
}

function warnOptionalEnv(): void {
  const missing = OPTIONAL_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(
      `\x1b[33m⚠ [env] Variables optionnelles absentes : ${missing.join(', ')}\x1b[0m`
    );
  }
}

validateCoreEnv();
warnOptionalEnv();

/** Read a variable; throws in production runtime if core key is missing. */
export function getEnv(key: CoreEnvKey): string;
export function getEnv(key: OptionalEnvKey): string | undefined;
export function getEnv(key: EnvKey): string | undefined {
  const value = process.env[key];
  if (value) return value;
  if ((CORE_VARS as readonly string[]).includes(key) && isProductionRuntime()) {
    throw new Error(`[env] Variable manquante : ${key}`);
  }
  return undefined;
}

/** Use in routes that need a specific optional variable (cron, Cloudinary, etc.). */
export function requireEnv(key: EnvKey): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`[env] Variable requise pour cette opération : ${key}`);
  }
  return value;
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? '',
  nextAuthSecret: process.env.NEXTAUTH_SECRET ?? '',
  nextAuthUrl: process.env.NEXTAUTH_URL,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cronSecret: process.env.CRON_SECRET,
};
