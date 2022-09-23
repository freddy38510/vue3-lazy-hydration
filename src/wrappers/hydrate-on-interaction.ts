import type { AsyncComponentLoader, Component } from 'vue';
import { useHydrateOnInteraction } from '../composables';
import { createHydrationWrapper } from '../utils';

/**
 * @public Wrap a component in a renderless component so that it is hydrated when a specified HTML event occurs on one of its elements.
 */
export default function hydrateOnInteraction(
  source: Component | AsyncComponentLoader,
  events: (keyof HTMLElementEventMap)[] = ['focus']
) {
  return createHydrationWrapper(source, (result) => {
    useHydrateOnInteraction(result, events);
  });
}
