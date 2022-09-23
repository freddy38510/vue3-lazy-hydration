/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
import {
  defineComponent,
  markRaw,
  getCurrentInstance,
  ref,
  createVNode,
  handleError,
  type Component,
  type ComponentInternalInstance,
  type ConcreteComponent,
  type AsyncComponentLoader,
} from 'vue';
import { isFunction, isObject } from './helpers';
import { useLazyHydration } from '../composables';

function createInnerComp(
  comp: ConcreteComponent,
  { vnode: { ref: refOwner, props, children } }: ComponentInternalInstance
) {
  const vnode = createVNode(comp, props, children);

  // ensure inner component inherits the lazy hydrate wrapper's ref owner
  vnode.ref = refOwner;

  return vnode;
}

export default function createHydrationWrapper(
  source: Component | AsyncComponentLoader,
  onSetup: (result: ReturnType<typeof useLazyHydration>) => void
): Component {
  let pendingRequest: Promise<ConcreteComponent> | null = null;
  let resolvedComp: ConcreteComponent | undefined;

  const loader = isFunction(source)
    ? (source as AsyncComponentLoader)
    : () => Promise.resolve(source);

  const load = () => {
    let thisRequest: Promise<ConcreteComponent>;

    if (pendingRequest !== null) {
      return pendingRequest;
    }

    // eslint-disable-next-line no-return-assign, no-multi-assign
    return (thisRequest = pendingRequest =
      loader()
        .catch((err) => {
          throw err instanceof Error ? err : new Error(String(err));
        })
        .then((comp: any) => {
          if (thisRequest !== pendingRequest && pendingRequest !== null) {
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
              `Invalid async lazily hydrated wrapped component load result: ${
                comp as string
              }`
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

        const onError = (err: unknown) => {
          pendingRequest = null;

          handleError(err, instance, 13);
        };

        const loaded = ref(false);
        const result = useLazyHydration();

        if (typeof window === 'undefined') {
          // on Server-side
          return load()
            .then((comp) => () => createInnerComp(comp, instance!))
            .catch((err) => {
              onError(err);

              return () => null;
            });
        }

        if (!result.willPerformHydration) {
          // already resolved
          if (resolvedComp) {
            return () => createInnerComp(resolvedComp!, instance!);
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
              return createInnerComp(resolvedComp, instance!);
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

              // eslint-disable-next-line no-void
              void hydrate();
            })
            .catch((err) => {
              onError(err);
            });

        result.onHydrated(() => emit('hydrated'));

        onSetup(result);

        return () => createInnerComp(resolvedComp!, instance!);
      },
    })
  );
}
