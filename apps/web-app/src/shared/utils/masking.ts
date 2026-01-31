/**
 * Masks the middle part of a string while preserving start and end characters
 * Preserves dashes and other special characters in their original positions
 * @param value - The string to mask
 * @param startChars - Number of characters to show at the start (default: 6)
 * @param endChars - Number of characters to show at the end (default: 4)
 * @param maskChar - Character to use for masking (default: '*')
 * @param shortFormat - Use short format like "start...end" (default: false)
 * @returns The masked string
 */
export function maskMiddle(
  value: string,
  startChars: number = 6,
  endChars: number = 4,
  maskChar: string = "*",
  shortFormat: boolean = false
): string {
  if (!value || value.length <= startChars + endChars) {
    return value;
  }

  if (shortFormat) {
    const start = value.slice(0, startChars);
    const end = value.slice(-endChars);
    return `${start}...${end}`;
  }

  const chars = value.split("");
  const result = [...chars];

  // Mask characters in the middle, but preserve dashes and special chars
  for (
    let i = startChars;
    i < value.length - endChars;
    i++
  ) {
    if (chars[i] !== "-" && chars[i] !== "_") {
      result[i] = maskChar;
    }
  }

  return result.join("");
}

/**
 * Masks an API key in Bearer token format
 * @param apiKey - The API key to mask
 * @returns Bearer token with masked API key
 */
export function maskBearerToken(apiKey: string): string {
  return `Bearer ${maskMiddle(apiKey)}`;
}
