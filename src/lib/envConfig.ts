// HIET Digital Campus — Environment & Security Configuration Utility
// Enforces environment separation: development | staging | production

export type AppEnvironment = 'development' | 'staging' | 'production';

/**
 * Returns the current application environment.
 * Default is 'development' unless explicitly set to 'staging' or 'production'.
 */
export function getAppEnvironment(): AppEnvironment {
  const envVal = (import.meta.env.VITE_APP_ENV || '').toLowerCase().trim();
  if (envVal === 'production') return 'production';
  if (envVal === 'staging') return 'staging';
  return 'development';
}

export function isProduction(): boolean {
  return getAppEnvironment() === 'production';
}

export function isStaging(): boolean {
  return getAppEnvironment() === 'staging';
}

export function isDevelopment(): boolean {
  return getAppEnvironment() === 'development';
}

/**
 * Demo seed is strictly disabled in production.
 * In development or staging, controlled by DEMO_SEED_ENABLED or VITE_ENABLE_DEMO_LOGIN.
 */
export function isDemoSeedEnabled(): boolean {
  if (isProduction()) return false;
  return import.meta.env.DEMO_SEED_ENABLED === 'true' || import.meta.env.VITE_ENABLE_DEMO_LOGIN === 'true';
}

/**
 * Demo login switcher / credentials display is strictly forbidden in production.
 */
export function isDemoLoginAllowed(): boolean {
  if (isProduction()) return false;
  return import.meta.env.VITE_ENABLE_DEMO_LOGIN !== 'false';
}

/**
 * Development routes (such as /dev/demo-accounts or ?previewRole=...) are disabled in production.
 */
export function areDevRoutesEnabled(): boolean {
  if (isProduction()) return false;
  return import.meta.env.DEV || isDevelopment() || isStaging();
}
