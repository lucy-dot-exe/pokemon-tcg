/**
 * Repairs "mojibake" text: UTF-8 bytes that got decoded as Latin-1 somewhere
 * upstream (e.g. "PokÃ©mon" instead of "Pokémon"). Detected via the telltale
 * "Ã" (U+00C3) lead byte, which legitimate Pokémon card text never contains.
 */
export function fixMojibake(text: string): string {
  if (!text.includes('Ã')) return text
  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0))
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return text
  }
}
