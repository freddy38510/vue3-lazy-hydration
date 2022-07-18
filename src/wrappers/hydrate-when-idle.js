import { useHydrateWhenIdle } from '../composables';
import { createHydrationWrapper } from '../utils';

export default function hydrateWhenIdle(component, timeout = 2000) {
  return createHydrationWrapper(component, (result) => {
    useHydrateWhenIdle(result, timeout);
  });
}
