import type { AsyncComponentLoader, Component } from 'vue';
import { createHydrationWrapper } from '../utils';

/**
 * @public Wrap a Vue.js component in a renderless component so that it is never hydrated.
 */
export default function hydrateNever(
  source: Component | AsyncComponentLoader
): Component {
  return createHydrationWrapper(source, () => {});
}
