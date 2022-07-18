/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import {
  defineComponent,
  markRaw,
  getCurrentInstance,
  ref,
  createVNode,
  handleError,
} from 'vue';
import { isFunction, isObject } from './helpers';
import { useLazyHydration } from '../composables';

function createInnerComp(comp, { vnode: { ref: refOwner, props, children } }) {
  const vnode = createVNode(comp, props, children);

  // ensure inner component inherits the lazy hydrate wrapper's ref owner
  vnode.ref = refOwner;

  return vnode;
}

export default function createHydrationWrapper(source, onSetup) {
  let pendingRequest;
  let resolvedComp;

  const loader = isFunction(source) ? source : () => Promise.resolve(source);

  const load = () => {
    let thisRequest;

    if (pendingRequest) {
      return pendingRequest;
    }

    // eslint-disable-next-line no-return-assign, no-multi-assign
    return (thisRequest = pendingRequest =
      loader()
        .catch((err) => {
          throw err instanceof Error ? err : new Error(String(err));
        })
        .then((comp) => {
          if (thisRequest !== pendingRequest && pendingRequest) {
            return pendingRequest;
          }

          if (__DEV__ && !comp) {
            console.warn(
              `Async lazily hydrated wrapped component loader resolved to undefined.`
            );
          }

          // interop module default
          if (
            comp &&
            (comp.__esModule || comp[Symbol.toStringTag] === 'Module')
          ) {
            // eslint-disable-next-line no-param-reassign
            comp = comp.default;
          }

          if (__DEV__ && comp && !isObject(comp) && !isFunction(comp)) {
            throw new Error(
              `Invalid async lazily hydrated wrapped component load result: ${comp}`
            );
          }

          resolvedComp = comp;

          return comp;
        }));
  };

  return markRaw(
    defineComponent({
      name: 'LazyHydrationWrapper',
      inheritAttrs: false,
      suspensible: false,
      emits: ['hydrated'],

      get __asyncResolved() {
        return resolvedComp;
      },

      setup(_, { emit }) {
        const instance = getCurrentInstance();

        const onError = (err) => {
          pendingRequest = null;

          handleError(err, instance, 'async component loader');
        };

        if (typeof window === 'undefined') {
          // on Server-side
          return load()
            .then((comp) => {
              return () => createInnerComp(comp, instance);
            })
            .catch((err) => {
              onError(err);

              return () => null;
            });
        }

        const loaded = ref(false);
        const result = useLazyHydration();

        if (!result.willPerformHydration) {
          // already resolved
          if (resolvedComp) {
            return () => createInnerComp(resolvedComp, instance);
          }

          load()
            .then(() => {
              loaded.value = true;
            })
            .catch((err) => {
              onError(err);
            });

          return () => {
            if (loaded.value && resolvedComp) {
              return createInnerComp(resolvedComp, instance);
            }

            return null;
          };
        }

        const { hydrate } = result;

        // load component before hydrate
        result.hydrate = () =>
          load()
            .then(() => {
              loaded.value = true;

              hydrate();
            })
            .catch((err) => {
              onError(err);
            });

        result.onHydrated(() => emit('hydrated'));

        onSetup(result);

        return () => createInnerComp(resolvedComp, instance);
      },
    })
  );
}
