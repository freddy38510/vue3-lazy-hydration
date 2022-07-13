import { getCurrentInstance, onMounted, unref } from 'vue';
import getRootElements from '../utils/get-root-elements';

export default function useHydrateOnInteraction(
  { hydrate, onCleanup },
  events = ['focus']
) {
  if (!hydrate || typeof hydrate !== 'function') {
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
    const container =
      targets.length > 1 ? targets[0].parentElement || document : targets[0];

    const eventListenerOptions = {
      capture: true,
      once: false,
      passive: true,
    };

    const listener = (event) => {
      event.stopPropagation();

      const paths = event.path || (event.composedPath && event.composedPath());

      if (!paths) {
        let el = event.target;

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
        if (paths.includes(target)) {
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
