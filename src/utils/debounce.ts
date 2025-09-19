// biome-ignore lint/suspicious/noExplicitAny: generic debounce function needs any
export function debounce(func: (...args: any) => void, delay: number) {
  let timeoutId: number;

  // biome-ignore lint/suspicious/noExplicitAny: hi
  return function (...args: any) {
    // @ts-expect-error wow
    // biome-ignore lint/complexity/noUselessThisAlias: jh
    const context = this;

    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      func.apply(context, args);
    }, delay);
  };
}
