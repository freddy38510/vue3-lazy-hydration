import { useLazyHydration } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateNever(component) {
  return createHydrationWrapper(component, useLazyHydration);
}
