const HTML_TAG = /<[^>]*>/g
const SCRIPT_PROTOCOL = /javascript:/gi
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

/** Strip HTML and dangerous patterns from user-provided display text. */
export function sanitizeText(input: string, maxLength = 10_000): string {
  return input
    .replace(CONTROL_CHARS, '')
    .replace(SCRIPT_PROTOCOL, '')
    .replace(HTML_TAG, '')
    .trim()
    .slice(0, maxLength)
}

/** Use when binding untrusted strings into HTML attributes (still prefer React text nodes). */
export function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
