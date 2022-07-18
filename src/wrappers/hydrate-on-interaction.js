import { useHydrateOnInteraction } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateOnInteraction(component, events = ['focus']) {
  return createHydrationWrapper(component, (result) => {
    useHydrateOnInteraction(result, events);
  });
}
