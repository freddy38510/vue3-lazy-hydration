import { useHydrateWhenVisible, useLazyHydration } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateWhenVisible(component, observerOpts) {
  return createHydrationWrapper(component, () => {
    const result = useLazyHydration();

    useHydrateWhenVisible(result, observerOpts);

    return result;
  });
}
