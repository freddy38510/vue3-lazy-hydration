export default function createHydrationPromise(cleanup) {
  let resolvePromise = () => {};

  const promise = new Promise((resolve) => {
    resolvePromise = () => {
      cleanup();

      resolve();
    };
  });

  const onResolvedPromise = (cb) => {
    promise.then(cb);
  };

  return {
    promise,
    resolvePromise,
    onResolvedPromise,
  };
}
