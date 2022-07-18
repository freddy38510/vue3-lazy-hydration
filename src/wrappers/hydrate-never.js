import { createHydrationWrapper } from '../utils';

export default function hydrateNever(loader) {
  return createHydrationWrapper(loader, () => {});
}
