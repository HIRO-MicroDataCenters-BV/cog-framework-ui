/**
 * Convert an arbitrary model name into an RFC 1123-compliant prefix for an
 * InferenceService (KServe) name.
 *
 * Backend rules: lowercase a-z, 0-9, hyphens; must start and end with an
 * alphanumeric. Periods, underscores, spaces, etc. are rejected.
 *
 * The caller typically appends `-serving` (or similar) to the returned value.
 * Returns '' if nothing alphanumeric remains.
 */
export const sanitizeIsvcName = (modelName: string): string =>
  modelName
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
