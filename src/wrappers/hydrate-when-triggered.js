import { useHydrateWhenTriggered } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateWhenTriggered(source, triggered) {
  return createHydrationWrapper(source, (result) => {
    useHydrateWhenTriggered(result, triggered);
  });
}
