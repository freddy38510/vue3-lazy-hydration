import { createSSRApp, h, ref } from 'vue';
import { renderToString } from '@vue/server-renderer';
import { flushPromises } from '@vue/test-utils';

import { ensureMocksReset, requestIdleCallback } from '../../test/dom-mocks';
import { withSSRSetup, triggerEvent } from '../../test/utils';

import { useLazyHydration, useHydrateWhenIdle } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  ensureMocksReset();
});

it('should hydrate when idle', async () => {
  requestIdleCallback.mock();
  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenIdle(result);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  requestIdleCallback.runIdleCallbacks();
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();

  requestIdleCallback.restore();
});

it('should cancel Idle Callback when component has been hydrated', async () => {
  requestIdleCallback.mock();
  const spyCancelIdleCallback = vi.spyOn(window, 'cancelIdleCallback');

  await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenIdle(result);

    return () => h('button', 'foo');
  });

  // trigger hydration and wait for it to complete
  requestIdleCallback.runIdleCallbacks();
  await flushPromises();

  // should be hydrated now
  expect(spyCancelIdleCallback).toHaveBeenCalledOnce();

  requestIdleCallback.restore();
});

it('should cancel Idle Callback when component has been unmounted', async () => {
  requestIdleCallback.mock();
  const spyCancelIdleCallback = vi.spyOn(window, 'cancelIdleCallback');

  const show = ref(true);

  await withSSRSetup(() => {
    const LazyComp = {
      setup() {
        const result = useLazyHydration();

        useHydrateWhenIdle(result);

        return () => h('button', 'foo');
      },
    };

    return () => h('div', [show.value ? h(LazyComp) : h('div', 'hi')]);
  });

  // trigger onUnmounted hook
  show.value = false;

  await flushPromises();

  expect(spyCancelIdleCallback).toHaveBeenCalledOnce();

  requestIdleCallback.restore();
});

it('should hydrate when requestIdleCallback is unsupported', async () => {
  requestIdleCallback.mockAsUnsupported();

  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenIdle(result);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  expect(window.requestIdleCallback).toBeUndefined();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalled();

  requestIdleCallback.restore();
});

it('should throw error when used outside of the setup or lifecycle hook method', async () => {
  const originalWindow = window;
  const handler = vi.fn();
  const err = new Error(
    'useHydrateWhenIdle must be called from the setup or lifecycle hook methods.'
  );

  let result;

  const LazyComp = {
    setup() {
      result = useLazyHydration();

      return () => h('foo');
    },
  };

  const App = {
    setup() {
      function onClick() {
        useHydrateWhenIdle(result);
      }

      return () => [h('button', { onClick }, 'foo'), h(LazyComp)];
    },
  };

  const app = createSSRApp(App);

  // make sure window is undefined at server-side
  vi.stubGlobal('window', undefined);

  // render at server-side
  const html = await renderToString(app);

  // restore window for client-side
  vi.stubGlobal('window', originalWindow);

  const container = document.createElement('div');

  container.innerHTML = html;

  document.append(container);

  app.config.errorHandler = handler;

  // hydrate application
  app.mount(container);

  // trigger error
  triggerEvent('click', container.querySelector('button'));

  expect(handler).toHaveBeenCalled();
  expect(handler.mock.calls[0][0]).toStrictEqual(err);
});
