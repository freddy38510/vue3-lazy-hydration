import { useHydrateOnInteraction, useLazyHydration } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateOnInteraction(component, events = ['focus']) {
  return createHydrationWrapper(component, () => {
    const result = useLazyHydration();

    useHydrateOnInteraction(result, events);

    return result;
  });
}
