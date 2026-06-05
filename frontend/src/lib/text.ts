/**
 * Return the first sentence of a string — text up to and including the first
 * ".", "!", or "?" that is followed by whitespace or the end of the string.
 * Falls back to the full (trimmed) text when no sentence boundary is found.
 * The trailing lookahead avoids splitting on decimals like "3.5".
 */
export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/s);
  return (match ? match[0] : text).trim();
}
