export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** Safe parse of `<input type="datetime-local">` value; empty or invalid → null */
export function isoFromDatetimeLocal(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const d = new Date(trimmed)
  if (Number.isNaN(d.getTime())) return null
  return d.toISOString()
}

export function fromDatetimeLocalValue(value: string): string {
  const iso = isoFromDatetimeLocal(value)
  if (!iso) throw new Error('Valid start and end dates are required')
  return iso
}
