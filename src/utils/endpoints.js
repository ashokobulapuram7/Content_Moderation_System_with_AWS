/**
 * Returns a normalized http/https endpoint URL, or null when the value is missing or malformed.
 */
export const getSafeEndpoint = (value) => {
  if (!value || typeof value !== 'string') return null;

  try {
    const url = new URL(value.trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};
