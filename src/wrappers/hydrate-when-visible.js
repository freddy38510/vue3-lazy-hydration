import { useHydrateWhenVisible } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateWhenVisible(component, observerOpts) {
  return createHydrationWrapper(component, (result) => {
    useHydrateWhenVisible(result, observerOpts);
  });
}
