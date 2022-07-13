import { getCurrentInstance } from 'vue';

export default function useHydrateWhenIdle(
  { hydrate, onCleanup },
  timeout = 2000
) {
  if (!hydrate || typeof hydrate !== 'function') {
    return;
  }

  if (!getCurrentInstance()) {
    throw new Error(
      'useHydrateWhenIdle must be called from the setup or lifecycle hook methods.'
    );
  }

  // If `requestIdleCallback()` is not supported, hydrate immediately.
  if (!('requestIdleCallback' in window)) {
    hydrate();

    return;
  }

  const idleId = requestIdleCallback(
    () => {
      hydrate();
    },
    { timeout }
  );

  onCleanup(() => {
    cancelIdleCallback(idleId);
  });
}
