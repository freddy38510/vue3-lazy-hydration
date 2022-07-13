export default function createHydrationCleanup() {
  let cleanups = [];

  const onCleanup = (cb) => {
    cleanups.push(cb);
  };

  const cleanup = () => {
    // run each cleaning function then remove it from array
    cleanups = cleanups.filter((fn) => {
      fn();

      return false;
    });
  };

  return { cleanup, onCleanup };
}
