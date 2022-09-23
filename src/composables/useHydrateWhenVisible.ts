import { getCurrentInstance, onMounted } from 'vue';
import { createHydrationObserver, getRootElements } from '../utils';
import type useLazyHydration from './useLazyHydration';

/**
 * @public A Vue.js composable to delay hydration until one of the component's root elements is visible.
 */
export default function useHydrateWhenVisible(
  {
    willPerformHydration,
    hydrate,
    onCleanup,
  }: ReturnType<typeof useLazyHydration>,
  observerOptions?: IntersectionObserverInit
) {
  if (!willPerformHydration) {
    return;
  }

  const instance = getCurrentInstance();

  if (!instance || instance.isMounted) {
    throw new Error(
      'useHydrateWhenVisible must be called from the setup method.'
    );
  }

  const { supported, observer } = createHydrationObserver(observerOptions);

  // If Intersection Observer API is not supported, hydrate immediately.
  if (!supported) {
    hydrate();

    return;
  }

  onMounted(() => {
    const els = getRootElements(instance);

    els.forEach((target) => {
      target.hydrate = hydrate;

      observer!.observe(target as Element);
    });

    onCleanup(() => {
      els.forEach((target) => {
        delete target.hydrate;

        observer!.unobserve(target as Element);
      });
    });
  });
}
