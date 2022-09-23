import type { AsyncComponentLoader, Component, Ref } from 'vue';
import { useHydrateWhenTriggered } from '../composables';
import { createHydrationWrapper } from '../utils';

/**
 * @public Wrap a component in a renderless component so that it is hydrated when triggered.
 */
export default function hydrateWhenTriggered(
  source: Component | AsyncComponentLoader,
  triggered: Ref | (() => boolean)
) {
  return createHydrationWrapper(source, (result) => {
    useHydrateWhenTriggered(result, triggered);
  });
}
