import { flushPromises } from '@vue/test-utils';
import { expect, vi } from 'vitest';
import { h, ref } from 'vue';

import { withSetup, triggerEvent } from '../../test/utils';

import useLazyHydration from './useLazyHydration';
import useHydrateWhenTriggered from './useHydrateWhenTriggered';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should hydrate when trigger is true', async () => {
  const spyClick = vi.fn();
  const trigger = ref(false);

  const { container } = await withSetup(() => {
    const result = useLazyHydration();

    useHydrateWhenTriggered(result, trigger);

    return () => h('button', { onClick: spyClick }, 'foo');
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  trigger.value = true;
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
});

it('should unWatch trigger when component has been unmounted', async () => {
  const show = ref(true);
  const trigger = ref(false);

  let spyHydrate;

  await withSetup((isClient) => {
    const LazyComp = {
      setup() {
        const result = useLazyHydration();

        if (isClient) {
          spyHydrate = vi.spyOn(result, 'hydrate');
        }

        useHydrateWhenTriggered(result, trigger);

        return () => h('button', 'foo');
      },
    };

    return () => h('div', [show.value ? h(LazyComp) : h('div', 'hi')]);
  });

  // trigger onUnmounted hook
  show.value = false;
  await flushPromises();

  // run watch effect
  trigger.value = true;
  await flushPromises();

  // watch effect should have been stopped
  expect(spyHydrate).not.toHaveBeenCalledOnce();
});
