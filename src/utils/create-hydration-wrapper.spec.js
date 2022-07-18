import { h, createApp as createClientApp, ref, nextTick } from 'vue';

import { renderToString } from '@vue/server-renderer';
import { flushPromises } from '@vue/test-utils';

import { expect } from 'vitest';
import { createApp, triggerEvent } from '../../test/utils';

import { createHydrationWrapper } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should handle error at server-side', async () => {
  const originalWindow = window;
  const handler = vi.fn();
  const err = new Error('foo');

  const WrappedComp = createHydrationWrapper(
    () => Promise.reject(err),
    () => {}
  );

  // make sure window is undefined at server-side
  vi.stubGlobal('window', undefined);

  const app = createApp(() => {
    return () => h(WrappedComp);
  });

  app.config.errorHandler = handler;

  await renderToString(app);

  expect(handler).toHaveBeenCalled();
  expect(handler.mock.calls[0][0]).toBe(err);

  // restore window
  vi.stubGlobal('window', originalWindow);
});

it('should handle error at client-side when hydrating', async () => {
  const handler = vi.fn();
  const spyClick = vi.fn();
  const err = new Error('foo');

  let resolve;
  let reject;
  let hydrate;

  // pre-rendered html
  const container = document.createElement('div');
  container.innerHTML = '<button>foo</button>';
  document.append(container);

  const WrappedComp = createHydrationWrapper(
    () =>
      new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      }),
    (result) => {
      hydrate = result.hydrate;
    }
  );

  const app = createApp(() => {
    return () => h(WrappedComp);
  });

  app.config.errorHandler = handler;

  // hydrate application
  app.mount(container);

  await flushPromises();

  // simulate error when loading component
  hydrate();
  reject(err);

  await flushPromises();

  // should not be hydrated yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(handler).toHaveBeenCalledOnce();
  expect(handler.mock.calls[0][0]).toBe(err);

  // successfully load component this time
  hydrate();
  resolve(() => h('button', { onClick: spyClick }, 'foo'));

  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should handle error at client-side without hydration', async () => {
  const handler = vi.fn();
  const err = new Error('foo');

  let resolve;
  let reject;

  const container = document.createElement('div');
  document.append(container);

  const WrappedComp = createHydrationWrapper(
    () =>
      new Promise((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
      }),
    () => {}
  );

  const toggle = ref(true);
  const app = createClientApp({
    setup() {
      return () => (toggle.value ? h(WrappedComp) : null);
    },
  });

  app.config.errorHandler = handler;

  app.mount(container);

  await flushPromises();
  expect(container.innerHTML).toBe('<!---->');

  // simulate error when loading component
  reject(err);
  await flushPromises();

  // should not be loaded yet
  expect(handler).toHaveBeenCalledOnce();
  expect(handler.mock.calls[0][0]).toBe(err);
  expect(container.innerHTML).toBe('<!---->');

  toggle.value = false;
  await nextTick();
  expect(container.innerHTML).toBe('<!---->');

  // errored out on previous load, toggle and mock success this time
  toggle.value = true;
  await nextTick();
  expect(container.innerHTML).toBe('<!---->');

  // should render this time
  resolve(() => 'resolved');
  await flushPromises();
  expect(container.innerHTML).toBe('resolved');
});

it('should handle error when load result is invalid', async () => {
  const originalWindow = window;
  const handler = vi.fn();
  const err = new Error(
    'Invalid async lazily hydrated wrapped component load result: invalid'
  );

  const WrappedComp = createHydrationWrapper(
    () => Promise.resolve('invalid'),
    () => {}
  );

  // make sure window is undefined at server-side
  vi.stubGlobal('window', undefined);

  const app = createApp(() => {
    return () => h(WrappedComp);
  });

  app.config.errorHandler = handler;

  await renderToString(app);

  expect(handler).toHaveBeenCalled();
  expect(handler.mock.calls[0][0]).toStrictEqual(err);

  // restore window
  vi.stubGlobal('window', originalWindow);
});

it('should warn when component loader resolved to undefined', async () => {
  const originalWindow = window;

  const WrappedComp = createHydrationWrapper(
    () => Promise.resolve(),
    () => {}
  );

  // make sure window is undefined at server-side
  vi.stubGlobal('window', undefined);

  const app = createApp(() => {
    return () => h(WrappedComp);
  });

  await renderToString(app);

  expect(
    'Invalid vnode type when creating vnode: undefined.'
  ).toHaveBeenWarned();

  expect(
    'Async lazily hydrated wrapped component loader resolved to undefined.'
  ).toHaveBeenWarned();

  // restore window
  vi.stubGlobal('window', originalWindow);
});
