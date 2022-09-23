import type { AsyncComponentLoader, Component } from 'vue';
import { useHydrateWhenIdle } from '../composables';
import { createHydrationWrapper } from '../utils';

/**
 * @public Wrap a component in a renderless component so that it is hydrated when the browser is idle.
 */
export default function hydrateWhenIdle(
  source: Component | AsyncComponentLoader,
  timeout = 2000
) {
  return createHydrationWrapper(source, (result) => {
    useHydrateWhenIdle(result, timeout);
  });
}
