export const unstable_cache = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  _keyParts?: string[],
  _options?: { revalidate?: number | false; tags?: string[] },
): T => {
  return ((...args: Parameters<T>) => fn(...args)) as T;
};

export const revalidateTag = (_tag: string) => {};
export const revalidatePath = (_path: string) => {};
