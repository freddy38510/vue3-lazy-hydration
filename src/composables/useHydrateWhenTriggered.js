import { watch, isRef, getCurrentInstance } from 'vue';

export default function useHydrateWhenTriggered(
  { hydrate, onCleanup },
  trigger
) {
  if (!hydrate || typeof hydrate !== 'function') {
    return;
  }

  if (!getCurrentInstance()) {
    throw new Error(
      'useHydrateWhenTriggered must be called from the setup or lifecycle hook methods.'
    );
  }

  const unWatch = watch(
    isRef(trigger) ? trigger : () => trigger,
    (isTriggered) => {
      if (isTriggered) {
        hydrate();
      }
    },
    {
      immediate: true,
    }
  );

  onCleanup(unWatch);
}
