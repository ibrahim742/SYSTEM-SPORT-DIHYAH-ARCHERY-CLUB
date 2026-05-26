export function normalizeClockInput(value: string) {
  const trimmed = value.trim().replace(".", ":");
  const compact = trimmed.replace(/[^\d]/g, "");

  if (/^\d{3,4}$/.test(compact)) {
    const padded = compact.padStart(4, "0");
    return `${padded.slice(0, 2)}:${padded.slice(2, 4)}`;
  }

  return trimmed;
}

export function isValidClock(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(normalizeClockInput(value));
}

export function formatClock(value: string | null | undefined) {
  if (!value) return "-";
  const normalized = normalizeClockInput(value);
  if (!isValidClock(normalized)) return value;
  return normalized.replace(":", ".");
}
