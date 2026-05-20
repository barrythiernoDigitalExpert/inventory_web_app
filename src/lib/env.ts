/**
 * Environment Variable Validation
 * --------------------------------
 * Valide toutes les variables d'environnement requises au démarrage.
 * Importer ce fichier dans les points d'entrée critiques (auth, prisma).
 * En production, une variable manquante provoque une erreur explicite immédiatement.
 */

type EnvKey =
  | 'DATABASE_URL'
  | 'NEXTAUTH_SECRET'
  | 'NEXTAUTH_URL'
  | 'GOOGLE_CLIENT_ID'
  | 'GOOGLE_CLIENT_SECRET'
  | 'CLOUDINARY_CLOUD_NAME'
  | 'CLOUDINARY_API_KEY'
  | 'CLOUDINARY_API_SECRET'
  | 'CRON_SECRET';

const REQUIRED_VARS: EnvKey[] = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'CRON_SECRET',
];

function validateEnv(): Record<EnvKey, string> {
  const missing: string[] = [];

  for (const key of REQUIRED_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    const isProd = process.env.NODE_ENV === 'production';
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    const msg = `[env] Variables d'environnement manquantes : ${missing.join(', ')}`;
    if (isProd && !isBuildPhase) {
      throw new Error(msg);
    } else {
      console.warn(`\x1b[33m⚠ ${msg}\x1b[0m`);
    }
  }

  return Object.fromEntries(
    REQUIRED_VARS.map((k) => [k, process.env[k] ?? ''])
  ) as Record<EnvKey, string>;
}

export const env = validateEnv();
