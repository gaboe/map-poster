/**
 * Determines if new items should inherit a boolean property based on existing items.
 *
 * Logic:
 * - If ALL existing items have the property set to true → returns true
 * - If ANY existing item has the property set to false → returns false
 * - If no existing items → returns true (default enabled)
 *
 * @example
 * const tools = [{ isEnabled: true }, { isEnabled: true }];
 * shouldInheritBooleanProperty(tools, "isEnabled"); // true
 *
 * @example
 * const tools = [{ isEnabled: true }, { isEnabled: false }];
 * shouldInheritBooleanProperty(tools, "isEnabled"); // false
 */
export function shouldInheritBooleanProperty<
  T extends Record<string, boolean>,
>(existingItems: T[], property: keyof T): boolean {
  if (existingItems.length === 0) return true;
  return existingItems.every((item) => item[property]);
}
