import { watch, isRef, getCurrentInstance, type Ref } from 'vue';
import type useLazyHydration from './useLazyHydration';

/**
 * @public A Vue.js composable to manually trigger hydration.
 */
export default function useHydrateWhenTriggered(
  {
    willPerformHydration,
    hydrate,
    onCleanup,
  }: ReturnType<typeof useLazyHydration>,
  trigger: Ref | (() => boolean)
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
