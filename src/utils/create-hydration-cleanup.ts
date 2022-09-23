export default function createHydrationCleanup() {
  let cleanups: (() => void)[] = [];

  const onCleanup = (cb: () => void) => {
    cleanups.push(cb);
  };

  const cleanup = () => {
    // run each cleaning function then remove it from array
    cleanups = cleanups.filter((fn: () => void) => {
      fn();

      return false;
    });
  };

  return { cleanup, onCleanup };
}
