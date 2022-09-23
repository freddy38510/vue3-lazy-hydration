import { h, onMounted, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { ensureMocksReset, intersectionObserver } from '../../test/dom-mocks';
import { withSSRSetup, triggerEvent, createApp } from '../../test/utils';

import { createHydrationObserver } from '../utils';
import { useLazyHydration, useHydrateWhenVisible } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  ensureMocksReset();
});

it('should hydrate when single root element is visible', async () => {
  intersectionObserver.mock();
  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenVisible(result);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(
    (
      container.querySelector('button') as Element & {
        hydrate?: () => Promise<void>;
      }
    ).hydrate
  ).toBeDefined();

  // make an element outside lazily hydrated component visible
  intersectionObserver.simulate({
    target: container.querySelector('div') || undefined,
    isIntersecting: false,
  });
  await flushPromises();

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(
    (
      container.querySelector('button') as Element & {
        hydrate?: () => Promise<void>;
      }
    ).hydrate
  ).toBeDefined();

  // trigger hydration and wait for it to complete
  intersectionObserver.simulate({
    target: container.querySelector('button') || undefined,
    isIntersecting: true,
  });
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(
    (
      container.querySelector('button') as Element & {
        hydrate?: () => Promise<void>;
      }
    ).hydrate
  ).toBeUndefined();

  intersectionObserver.restore();
});

it('should hydrate when one of multiple root elements is visible', async () => {
  intersectionObserver.mock();
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
    target: container.querySelector('span') || undefined,
    isIntersecting: true,
  });
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();

  intersectionObserver.restore();
});

it('should hydrate when IntersectionObserver API is unsupported', async () => {
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

  intersectionObserver.restore();
});

it('should unobserve root elements when component has been unmounted', async () => {
  intersectionObserver.mock();
  const show = ref(true);

  const { observer } = createHydrationObserver();
  const spyUnobserve = vi.spyOn(observer!, 'unobserve');

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

  intersectionObserver.restore();
});

it('should throw error when used outside of the setup method', async () => {
  const handler = vi.fn();
  const err = new Error(
    'useHydrateWhenVisible must be called from the setup method.'
  );

  const container = document.createElement('div');
  container.innerHTML = 'foo';
  document.append(container);

  const app = createApp(() => {
    const result = useLazyHydration();

    onMounted(() => {
      useHydrateWhenVisible(result);
    });

    return () => 'foo';
  });

  app.config.errorHandler = handler;

  app.mount(container);

  expect(handler).toHaveBeenCalled();
  expect(handler.mock.calls[0][0]).toStrictEqual(err);
});
