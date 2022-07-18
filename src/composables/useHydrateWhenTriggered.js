import { watch, isRef, getCurrentInstance } from 'vue';

export default function useHydrateWhenTriggered(
  { willPerformHydration, hydrate, onCleanup },
  trigger
) {
  if (!willPerformHydration) {
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
