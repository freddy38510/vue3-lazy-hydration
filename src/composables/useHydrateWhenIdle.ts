import { getCurrentInstance } from 'vue';
import type useLazyHydration from './useLazyHydration';

/**
 * @public A Vue.js composable to delay hydration until the browser is idle.
 */
export default function useHydrateWhenIdle(
  {
    willPerformHydration,
    hydrate,
    onCleanup,
  }: ReturnType<typeof useLazyHydration>,
  timeout = 2000
) {
  if (!willPerformHydration) {
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
