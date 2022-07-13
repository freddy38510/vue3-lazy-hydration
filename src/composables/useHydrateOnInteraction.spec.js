import { flushPromises } from '@vue/test-utils';
import { expect, vi } from 'vitest';
import { h, ref } from 'vue';

import { withSetup, triggerEvent } from '../../test/utils';

import useLazyHydration from './useLazyHydration';
import useHydrateOnInteraction from './useHydrateOnInteraction';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should hydrate on interaction with single root element', async () => {
  const spyClick = vi.fn();

  const { container } = await withSetup(() => {
    const result = useLazyHydration();

    useHydrateOnInteraction(result, ['click', 'focus']);

    return () => h('div', h('button', { onClick: spyClick }, 'foo'));
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerEvent('click', container.querySelector('div'));
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should hydrate on interaction with multiple root elements', async () => {
  const spyClick = vi.fn();

  const { container } = await withSetup(() => {
    const result = useLazyHydration();

    useHydrateOnInteraction(result, ['click', 'focus']);

    return () => [
      h('div', h('button', { onClick: spyClick }, 'foo')),
      h('p', 'bar'),
    ];
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerEvent('focus', container.querySelector('p'));
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should remove listeners when component has been hydrated', async () => {
  const spyClick = vi.fn();

  const { container } = await withSetup(() => {
    const result = useLazyHydration();

    useHydrateOnInteraction(result, ['focus', 'select']);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  const spyRemoveEventListener = vi.spyOn(
    container.querySelector('button'),
    'removeEventListener'
  );

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerEvent('focus', container.querySelector('button'));
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(spyRemoveEventListener).toHaveBeenCalledTimes(2);
});

it('should remove listeners when component has been unmounted', async () => {
  const show = ref(true);

  const { container } = await withSetup(() => {
    const LazyComp = {
      setup() {
        const result = useLazyHydration();

        useHydrateOnInteraction(result, ['focus', 'select']);

        return () => h('button', 'foo');
      },
    };

    return () => h('div', [show.value ? h(LazyComp) : h('div', 'hi')]);
  });

  const spyRemoveEventListener = vi.spyOn(
    container.querySelector('button'),
    'removeEventListener'
  );

  // trigger onUnmounted hook
  show.value = false;

  await flushPromises();

  expect(spyRemoveEventListener).toHaveBeenCalledTimes(2);
});
