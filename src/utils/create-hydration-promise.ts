export default function createHydrationPromise(cleanup: () => void) {
  let resolvePromise: () => void | Promise<void> = () => {};

  const promise = new Promise<void>((resolve) => {
    resolvePromise = () => {
      cleanup();

      resolve();
    };
  });

  const onResolvedPromise = (cb: () => void | Promise<void>) => {
    // eslint-disable-next-line no-void
    void promise.then(cb);
  };

  return {
    promise,
    resolvePromise,
    onResolvedPromise,
  };
}
