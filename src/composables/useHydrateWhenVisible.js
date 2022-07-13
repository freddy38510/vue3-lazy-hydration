import { getCurrentInstance, onMounted } from 'vue';
import { createHydrationObserver, getRootElements } from '../utils';

export default function useHydrateWhenVisible(
  { hydrate, onCleanup },
  observerOptions
) {
  if (!hydrate || typeof hydrate !== 'function') {
    return;
  }

  const instance = getCurrentInstance();

  if (!instance || instance.isMounted) {
    throw new Error(
      'useHydrateWhenVisible must be called from the setup method.'
    );
  }

  const { supported, observer } = createHydrationObserver(observerOptions);

  // If Intersection Observer API is not supported, hydrate immediately.
  if (!supported) {
    hydrate();

    return;
  }

  onMounted(() => {
    const els = getRootElements(instance);

    els.forEach((target) => {
      target.hydrate = hydrate;

      observer.observe(target);
    });

    onCleanup(() => {
      els.forEach((target) => {
        delete target.hydrate;

        observer.unobserve(target);
      });
    });
  });
}
