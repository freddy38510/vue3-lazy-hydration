import { useHydrateWhenIdle, useLazyHydration } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateWhenIdle(component, timeout = 2000) {
  return createHydrationWrapper(component, () => {
    const result = useLazyHydration();

    useHydrateWhenIdle(result, timeout);

    return result;
  });
}
