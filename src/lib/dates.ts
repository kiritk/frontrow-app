// Event dates are stored as plain "YYYY-MM-DD" strings (no time, no timezone).
// `new Date("2026-05-01")` parses that as UTC midnight per the ECMA spec, so
// `.getDate()` / `.toLocaleDateString()` render the previous day in any
// negative-UTC zone. Parse the components manually to get a real local-time
// Date instead.
export function parseEventDate(dateString: string): Date {
  const [y, m, d] = dateString.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}
