// Escaping, in one place.
//
// Report sections build HTML as strings, because the print and text exports have
// to be produced from the same source and a DOM is not always around. That means
// every module would otherwise write its own escape. Three copies of an escape
// is two copies waiting to fall behind.

const ENTITIES: Readonly<Record<string, string>> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Safe for both text nodes and quoted attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ENTITIES[character] ?? character);
}
