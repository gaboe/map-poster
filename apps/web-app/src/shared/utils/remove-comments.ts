/**
 * Removes comment lines from code snippets before copying.
 * Preserves the code structure and indentation while removing educational comments.
 *
 * @param code - The code string with comments
 * @param language - The programming language (to determine comment syntax)
 * @returns Code without comment-only lines
 */
export function removeComments(
  code: string,
  language:
    | "typescript"
    | "javascript"
    | "java"
    | "csharp"
    | "python"
    | "bash"
): string {
  const lines = code.split("\n");
  const commentPatterns: Record<string, RegExp[]> = {
    typescript: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*\//],
    javascript: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*\//],
    java: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*\//],
    csharp: [/^\s*\/\//, /^\s*\/\*/, /^\s*\*\//],
    python: [/^\s*#/],
    bash: [/^\s*#/],
  };

  const patterns = commentPatterns[language] ?? [];
  if (patterns.length === 0) {
    return code;
  }

  const filteredLines = lines.filter((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine === "") {
      return true;
    }

    return !patterns.some((pattern) => pattern.test(line));
  });

  return filteredLines.join("\n");
}
