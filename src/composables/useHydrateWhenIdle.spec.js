import { flushPromises } from '@vue/test-utils';
import { expect, vi } from 'vitest';
import { h, ref } from 'vue';

import { ensureMocksReset, requestIdleCallback } from '../../test/dom-mocks';
import { withSetup, triggerEvent } from '../../test/utils';

import useLazyHydration from './useLazyHydration';
import useHydrateWhenIdle from './useHydrateWhenIdle';

beforeEach(() => {
  document.body.innerHTML = '';

  requestIdleCallback.mock();
});

afterEach(() => {
  requestIdleCallback.restore();

  ensureMocksReset();
});

it('should hydrate when idle', async () => {
  const spyClick = vi.fn();

  const { container } = await withSetup(() => {
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
});

it('should cancel Idle Callback when component has been hydrated', async () => {
  const spyCancelIdleCallback = vi.spyOn(window, 'cancelIdleCallback');

  await withSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenIdle(result);

    return () => h('button', 'foo');
  });

  // trigger hydration and wait for it to complete
  requestIdleCallback.runIdleCallbacks();
  await flushPromises();

  // should be hydrated now
  expect(spyCancelIdleCallback).toHaveBeenCalledOnce();
});

it('should cancel Idle Callback when component has been unmounted', async () => {
  const spyCancelIdleCallback = vi.spyOn(window, 'cancelIdleCallback');

  const show = ref(true);

  await withSetup(() => {
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
});

it('should hydrate when requestIdleCallback is unsupported', async () => {
  requestIdleCallback.restore();
  requestIdleCallback.mockAsUnsupported();

  const spyClick = vi.fn();

  const { container } = await withSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenIdle(result);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  expect(window.requestIdleCallback).toBeUndefined();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalled();
});
