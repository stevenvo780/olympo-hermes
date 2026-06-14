// Auth configuration — secrets come ONLY from the environment. No fallbacks:
// a missing secret means the app cannot authenticate anyone (fail closed),
// instead of shipping a guessable default baked into the source/git history.
//
// These are pure env reads so the file is safe to import from edge middleware.

export function appPassword(): string | null {
  const v = process.env.LOGISTICA_APP_PASSWORD;
  return v && v.length > 0 ? v : null;
}

/** Opaque, high-entropy session-cookie secret (set per deployment). */
export function sessionToken(): string | null {
  const v = process.env.LOGISTICA_AUTH_TOKEN;
  return v && v.length >= 16 ? v : null;
}

/** Distinct server-to-server key for the x-internal-key header (e.g. cron sync). */
export function internalKey(): string | null {
  const v = process.env.LOGISTICA_INTERNAL_KEY;
  return v && v.length >= 16 ? v : null;
}

export const AUTH_COOKIE = "gl_auth";
