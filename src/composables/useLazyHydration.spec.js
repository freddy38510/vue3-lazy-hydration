/* eslint-disable no-underscore-dangle */
import {
  defineAsyncComponent,
  defineComponent,
  getCurrentInstance,
  h,
  ref,
} from 'vue';
import { flushPromises } from '@vue/test-utils';

import { withSetup, triggerEvent } from '../../test/utils';

import useLazyHydration from './useLazyHydration';

it('should delay hydration', async () => {
  const result = {
    client: {},
    server: {},
  };

  const spyClick = vi.fn();

  const { container } = await withSetup((isClient) => {
    result[isClient ? 'client' : 'server'] = useLazyHydration();

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  expect(result.client.willPerformHydration).toBe(true);
  expect(result.server.willPerformHydration).toBe(false);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  result.client.hydrate();
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalled();
});

it('should run onCleanup hook when component has been unmounted', async () => {
  const result = {
    client: {},
    server: {},
  };

  const spyCleanup = vi.fn();

  const show = ref(true);

  await withSetup((isClient) => {
    const LazyComp = {
      setup() {
        result[isClient ? 'client' : 'server'] = useLazyHydration();

        if (isClient) {
          result.client.onCleanup(spyCleanup);
        }

        return () => h('button', 'foo');
      },
    };

    return () => h('div', [show.value ? h(LazyComp) : h('div', 'hi')]);
  });

  // trigger onUnmounted hook
  show.value = false;

  await flushPromises();

  expect(spyCleanup).toHaveBeenCalledOnce();
});

it('should not update component if hydration is delayed', async () => {
  const result = {
    client: {},
    server: {},
  };

  const spyClick = vi.fn();

  const color = ref('red');

  const { container } = await withSetup((isClient) => {
    const LazyComp = {
      setup() {
        result[isClient ? 'client' : 'server'] = useLazyHydration();

        return () => h('button', { onClick: spyClick }, 'foo');
      },
    };

    return () => h('div', h(LazyComp, { style: { color: color.value } }));
  });

  expect(result.client.willPerformHydration).toBe(true);
  expect(result.server.willPerformHydration).toBe(false);

  // should have not been hydrated
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger an update and wait for it to complete
  color.value = 'yellow';
  await flushPromises();

  // should have not been updated
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(container.querySelector('button').style.color).toBe('red');
});

it('should update props even if hydration is delayed', async () => {
  const result = {
    client: {},
    server: {},
  };

  const spyClick = vi.fn();

  const bar = ref(false);

  let lazyCompInstance;

  const { container } = await withSetup((isClient) => {
    const LazyComp = {
      props: ['foo'],
      setup(props) {
        result[isClient ? 'client' : 'server'] = useLazyHydration();

        lazyCompInstance = getCurrentInstance();

        return () => h('button', { onClick: spyClick }, props.foo);
      },
    };

    return () => h('div', h(LazyComp, { foo: bar.value }));
  });

  expect(result.client.willPerformHydration).toBe(true);
  expect(result.server.willPerformHydration).toBe(false);

  // should have not been hydrated
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(container.querySelector('button').innerText).toBe('false');
  expect(lazyCompInstance.props.foo).toBeFalsy();

  // update props and wait for it to complete
  bar.value = true;
  await flushPromises();

  // should have only updated props
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(container.querySelector('button').innerText).toBe('false');
  expect(lazyCompInstance.props.foo).toBeTruthy();
});

it('should not break if the parent is a renderless component and has been updated', async () => {
  const result = {
    client: {},
    server: {},
  };

  const spyClick = vi.fn();

  const foo = ref(false);

  let lazyCompInstance;

  const { container } = await withSetup((isClient) => {
    const LazyComp = defineComponent({
      setup() {
        result[isClient ? 'client' : 'server'] = useLazyHydration();

        lazyCompInstance = getCurrentInstance();

        return () => h('button', { onClick: spyClick });
      },
    });

    const AsyncComp = defineAsyncComponent(
      () =>
        new Promise((resolve) => {
          resolve(LazyComp);
        })
    );

    return () =>
      h(
        'div',
        h(AsyncComp, {
          foo: foo.value,
        })
      );
  });

  expect(result.client.willPerformHydration).toBeUndefined();
  expect(result.server.willPerformHydration).toBe(false);

  // wait for the lazy hydrated component to be resolved by async wrapper
  await flushPromises();

  expect(result.client.willPerformHydration).toBe(true);
  expect(result.server.willPerformHydration).toBe(false);

  // should have not been hydrated yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // update parent component
  foo.value = true;
  await flushPromises();

  // parent component should still have a subtree element
  expect(lazyCompInstance.parent.subTree.el).not.toBeNull();

  // should have not been hydrated yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // update parent component
  foo.value = false;
  await flushPromises();

  // DOM patching should not be broken
  expect(
    'Unhandled error during execution of scheduler flush'
  ).not.toHaveBeenWarned();

  // trigger hydration and wait for it to complete
  result.client.hydrate();
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalled();
  expect(
    'Unhandled error during execution of scheduler flush'
  ).not.toHaveBeenWarned();
});

it('should run onHydrated hook when component has been hydrated', async () => {
  const result = {
    client: {},
    server: {},
  };

  const spyClick = vi.fn();
  const spyOnHydratedHook = vi.fn();

  const { container } = await withSetup((isClient) => {
    const LazyComp = {
      setup() {
        result[isClient ? 'client' : 'server'] = useLazyHydration();

        if (isClient) {
          result.client.onHydrated(spyOnHydratedHook);
        }

        return () => h('button', { onClick: spyClick }, 'foo');
      },
    };

    return () => h(LazyComp);
  });

  expect(result.client.willPerformHydration).toBe(true);
  expect(result.server.willPerformHydration).toBe(false);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(spyOnHydratedHook).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  result.client.hydrate();
  expect(spyOnHydratedHook).not.toHaveBeenCalled();
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalled();
  expect(spyOnHydratedHook).toHaveBeenCalledOnce();
});

it('should run onHydrated hook when component has been hydrated and its children async components resolved', async () => {
  const result = {
    client: {},
    server: {},
  };

  const spyClick = vi.fn();
  const spyAsyncCompClick = vi.fn();
  const spyOnHydratedHook = vi.fn();

  const { container } = await withSetup((isClient) => {
    const LazyComp = {
      setup() {
        result[isClient ? 'client' : 'server'] = useLazyHydration();

        let resolveAsyncComp;

        const promise = new Promise((resolve) => {
          resolveAsyncComp = () =>
            resolve({
              setup() {
                return () =>
                  h(
                    'button',
                    { class: 'async', onClick: spyAsyncCompClick },
                    'foo'
                  );
              },
            });
        });

        if (!isClient) {
          resolveAsyncComp();
        } else {
          result.client.resolveAsyncComp = resolveAsyncComp;
          result.client.onHydrated(spyOnHydratedHook);
        }

        return () => [
          h('button', { class: 'lazy', onClick: spyClick }, 'foo'),
          h(defineAsyncComponent(() => promise)),
        ];
      },
    };

    return () => h(LazyComp);
  });

  expect(result.client.willPerformHydration).toBe(true);
  expect(result.server.willPerformHydration).toBe(false);

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button.lazy'));
  triggerEvent('click', container.querySelector('button.async'));

  expect(spyClick).not.toHaveBeenCalled();
  expect(spyAsyncCompClick).not.toHaveBeenCalled();
  expect(spyOnHydratedHook).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  result.client.hydrate();
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button.lazy'));
  triggerEvent('click', container.querySelector('button.async'));
  expect(spyClick).toHaveBeenCalled();

  // but did not run onHydrated hook yet
  expect(spyOnHydratedHook).not.toHaveBeenCalled();

  // wait for resolved async component
  result.client.resolveAsyncComp();
  await flushPromises();

  triggerEvent('click', container.querySelector('button.async'));
  expect(spyAsyncCompClick).toHaveBeenCalled();
  expect(spyOnHydratedHook).toHaveBeenCalledOnce();
});
