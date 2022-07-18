import { flushPromises } from '@vue/test-utils';
import { expect, vi } from 'vitest';
import { h, ref } from 'vue';

import { ensureMocksReset, intersectionObserver } from '../../test/dom-mocks';
import { withSSRSetup, triggerEvent } from '../../test/utils';

import { createHydrationObserver } from '../utils';

import useLazyHydration from './useLazyHydration';
import useHydrateWhenVisible from './useHydrateWhenVisible';

beforeEach(() => {
  document.body.innerHTML = '';

  intersectionObserver.mock();
});

afterEach(() => {
  intersectionObserver.restore();

  ensureMocksReset();
});

it('should hydrate when single root element is visible', async () => {
  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenVisible(result);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(container.querySelector('button').hydrate).toBeDefined();

  // trigger hydration and wait for it to complete
  intersectionObserver.simulate({
    target: container.querySelector('button'),
    isIntersecting: true,
  });
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(container.querySelector('button').hydrate).toBeUndefined();
});

it('should hydrate when one of multiple root elements is visible', async () => {
  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenVisible(result);

    return () => [
      h('button', { onClick: spyClick }, 'first element'),
      h('span', 'second element'),
      h('p', 'last element'),
    ];
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration (intersect on second root element) and wait for it to complete
  intersectionObserver.simulate({
    target: container.querySelector('span'),
    isIntersecting: true,
  });
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should hydrate when IntersectionObserver API is unsupported', async () => {
  intersectionObserver.restore();
  intersectionObserver.mockAsUnsupported();

  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenVisible(result);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  expect(window.IntersectionObserver).toBeUndefined();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalled();
});

it('should unobserve root elements when component has been unmounted', async () => {
  const show = ref(true);

  const { observer } = createHydrationObserver();
  const spyUnobserve = vi.spyOn(observer, 'unobserve');

  await withSSRSetup(() => {
    const LazyComp = {
      setup() {
        const result = useLazyHydration();

        useHydrateWhenVisible(result);

        return () => [
          h('button', 'first element'),
          h('span', 'second element'),
          h('p', 'last element'),
        ];
      },
    };

    return () => h('div', [show.value ? h(LazyComp) : h('div', 'hi')]);
  });

  // trigger onUnmounted hook
  show.value = false;

  await flushPromises();

  expect(spyUnobserve).toHaveBeenCalledTimes(3);
});
