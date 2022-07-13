import { useHydrateWhenTriggered, useLazyHydration } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateWhenTriggered(component, triggered) {
  return createHydrationWrapper(component, () => {
    const result = useLazyHydration();

    useHydrateWhenTriggered(result, triggered);

    return result;
  });
}
