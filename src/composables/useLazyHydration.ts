/* eslint-disable no-underscore-dangle */

import {
  type ComponentInternalInstance,
  type ConcreteComponent,
  getCurrentInstance,
  nextTick,
  onBeforeMount,
  onUnmounted,
  type VNodeTypes,
  type VNodeChild,
} from 'vue';

import {
  trackDepsOnRender,
  createHydrationPromise,
  createHydrationCleanup,
  waitForAsyncComponents,
  ensureParentHasSubTreeEl,
} from '../utils';

export type ExtendedVnodeTypes = VNodeTypes & { __isLazilyHydrated?: boolean };
export type ExtendedConcreteComponent = ConcreteComponent & {
  __asyncLoader?: () => Promise<void>;
};
export type ExtendedComponentInternalInstance = ComponentInternalInstance & {
  asyncDep: Promise<boolean> | null;
};

/**
 * @public A Vue.js composable to delay hydration until the hydrate function is called.
 */
export default function useLazyHydration() {
  const instance = getCurrentInstance();

  if (!instance || instance.isMounted) {
    throw new Error('useLazyHydration must be called from the setup method.');
  }

  const willPerformHydration = instance.vnode.el !== null;

  /**
   * Set hint on the component.
   *
   * One of the purposes is to help the server side renderer
   * to avoid injecting/preloading the lazily hydrated components chunks into the rendered html.
   * This way they can be loaded on-demand (when hydrating) at client side.
   *
   * Components should be wrapped with defineAsyncComponent()
   * to let the bundler doing code-splitting.
   */
  (instance.vnode.type as ExtendedVnodeTypes).__isLazilyHydrated = true;

  if (!willPerformHydration) {
    /**
     * The application is actually running at server-side
     * or subsequent navigation occurred at client-side after the first load.
     */
    return { willPerformHydration, onHydrated: () => {} };
  }

  const { cleanup, onCleanup } = createHydrationCleanup();

  const {
    promise,
    resolvePromise: hydrate,
    onResolvedPromise: onBeforeHydrate,
  } = createHydrationPromise(cleanup);

  const onHydrated = (cb: () => void) =>
    onBeforeHydrate(() => nextTick(() => waitForAsyncComponents(instance, cb)));

  /**
   * Move the render call into an async callback.
   * This delays hydration until the promise is resolved.
   * @see https://github.com/vuejs/core/blob/v3.2.36/packages/runtime-core/src/renderer.ts#L1361&L1369
   */
  (instance.type as ExtendedConcreteComponent).__asyncLoader = () => promise;

  /**
   * In some cases the parent subtree element might be set to null
   * which breaks DOM patching.
   *
   * It occurs when the parent is a renderless component (an async wrapper for example)
   * and has been updated before the actual component has been hydrated.
   */
  ensureParentHasSubTreeEl(
    instance.parent as ComponentInternalInstance & { u: null | (() => void)[] }
  );

  /**
   * In case a parent triggers an update,
   * trick the renderer to just update props and slots.
   * @see https://github.com/vuejs/core/blob/v3.2.36/packages/runtime-core/src/renderer.ts#L1269&L1275
   */
  onBeforeMount(() => {
    (instance as ExtendedComponentInternalInstance).asyncDep =
      new Promise<boolean>((r) => {
        r(true);
      });
  });

  onBeforeHydrate(() => {
    /**
     * The render call has been moved into an async callback
     * which means it won't track dependencies.
     *
     * Re-run the reactive effect in sync with the render call.
     */
    trackDepsOnRender(
      instance as ComponentInternalInstance & {
        render: () => VNodeChild;
      }
    );

    // allow subsequent full updates
    (instance as ExtendedComponentInternalInstance).asyncDep = null;
  });

  onUnmounted(cleanup);

  return { willPerformHydration, hydrate, onHydrated, onCleanup };
}
