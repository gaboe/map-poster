/**
 * Filters out undefined values and specified keys from an object
 */
export const filterUndefinedValues = <
  T extends Record<string, unknown>,
>(
  obj: T,
  excludeKeys: string[] = []
): Partial<T> => {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) =>
        !excludeKeys.includes(key) && value !== undefined
    )
  ) as Partial<T>;
};

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
