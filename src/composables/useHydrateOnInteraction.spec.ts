import { h, onMounted, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { withSSRSetup, triggerEvent, createApp } from '../../test/utils';

import { useLazyHydration, useHydrateOnInteraction } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should hydrate on interaction with single root element', async () => {
  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateOnInteraction(result, ['focus']);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerEvent('focus', container.querySelector('button'));
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should hydrate on interaction with multiple root elements', async () => {
  const spyClick = vi.fn();

  const { container } = await withSSRSetup(() => {
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

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateOnInteraction(result, ['focus', 'select']);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  const spyRemoveEventListener = vi.spyOn(
    container.querySelector('button') as Element,
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

  const { container } = await withSSRSetup(() => {
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
    container.querySelector('button') as Element,
    'removeEventListener'
  );

  // trigger onUnmounted hook
  show.value = false;

  await flushPromises();

  expect(spyRemoveEventListener).toHaveBeenCalledTimes(2);
});

it('should hydrate on interaction when composedPath API is not supported', async () => {
  const spyClick = vi.fn();
  const triggerLegacyEvent = (type: string, el: Element) => {
    const event: (Omit<Event, 'composedPath'> & Partial<Event>) & {
      path?: EventTarget;
    } = new Event(type, { bubbles: true });

    event.path = undefined;
    event.composedPath = undefined;

    el.dispatchEvent(event as Event);
  };

  const { container } = await withSSRSetup(() => {
    const result = useLazyHydration();

    useHydrateOnInteraction(result, ['focus']);

    return () => h('div', h('button', { onClick: spyClick }, 'foo'));
  });

  // hydration not complete yet
  triggerLegacyEvent('click', container.querySelector('button') as Element);
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerLegacyEvent('focus', container.querySelector('button') as Element);
  await flushPromises();

  // should be hydrated now
  triggerLegacyEvent('click', container.querySelector('button') as Element);
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should throw error when used outside of the setup method', async () => {
  const handler = vi.fn();
  const err = new Error(
    'useHydrateOnInteraction must be called from the setup method.'
  );

  const container = document.createElement('div');
  container.innerHTML = 'foo';
  document.append(container);

  const app = createApp(() => {
    const result = useLazyHydration();

    onMounted(() => {
      useHydrateOnInteraction(result);
    });

    return () => 'foo';
  });

  app.config.errorHandler = handler;

  app.mount(container);

  expect(handler).toHaveBeenCalled();
  expect(handler.mock.calls[0][0]).toStrictEqual(err);
});
