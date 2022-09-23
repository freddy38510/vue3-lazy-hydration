import type { AsyncComponentLoader, Component } from 'vue';
import { useHydrateWhenVisible } from '../composables';
import { createHydrationWrapper } from '../utils';

/**
 * @public Wrap a Vue.js component in a renderless component so that it is hydrated when one of the component's root elements is visible.
 */
export default function hydrateWhenVisible(
  source: Component | AsyncComponentLoader,
  observerOpts?: IntersectionObserverInit
) {
  return createHydrationWrapper(source, (result) => {
    useHydrateWhenVisible(result, observerOpts);
  });
}
