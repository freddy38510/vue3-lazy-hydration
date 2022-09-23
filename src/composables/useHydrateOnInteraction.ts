import { getCurrentInstance, onMounted, unref } from 'vue';
import getRootElements from '../utils/get-root-elements';
import type useLazyHydration from './useLazyHydration';

/**
 * @public A Vue.js composable to delay hydration until a specified HTML event occurs on any component element.
 */
export default function useHydrateOnInteraction(
  {
    willPerformHydration,
    hydrate,
    onCleanup,
  }: ReturnType<typeof useLazyHydration>,
  events: (keyof HTMLElementEventMap)[] = ['focus']
) {
  if (!willPerformHydration) {
    return;
  }

  const instance = getCurrentInstance();

  if (!instance || instance.isMounted) {
    throw new Error(
      'useHydrateOnInteraction must be called from the setup method.'
    );
  }

  const eventsTypes = unref(events);

  onMounted(() => {
    const targets = getRootElements(instance);

    // container is the single root element or the parent element of the multiple root elements
    const container: Element =
      targets.length > 1 ? targets[0].parentElement || document : targets[0];

    const eventListenerOptions = {
      capture: true,
      once: false,
      passive: true,
    };

    const listener = (event: Event & { path?: EventTarget }) => {
      event.stopPropagation();

      const paths = (event.composedPath && event.composedPath()) || event.path;

      if (!paths) {
        let el = event.target as HTMLElement | null;

        while (el) {
          if (targets.includes(el)) {
            hydrate();

            return;
          }

          if (el === container) {
            return;
          }

          el = el.parentElement;
        }

        return;
      }

      targets.forEach((target) => {
        if (paths.includes(target as EventTarget)) {
          hydrate();
        }
      });
    };

    eventsTypes.forEach((eventType) => {
      container.addEventListener(eventType, listener, eventListenerOptions);
    });

    onCleanup(() => {
      eventsTypes.forEach((eventType) => {
        container.removeEventListener(
          eventType,
          listener,
          eventListenerOptions
        );
      });
    });
  });
}
