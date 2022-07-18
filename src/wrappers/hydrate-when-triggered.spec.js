import { h, onUpdated, ref } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { withSSRSetup, triggerEvent } from '../../test/utils';

import { hydrateWhenTriggered } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should load the wrapped component just before hydration when triggered', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();
  const trigger = ref(false);

  const WrappedComp = hydrateWhenTriggered(
    {
      setup() {
        onUpdated(spyUpdated);

        return () => h('button', { onClick: spyClick }, 'foo');
      },
    },
    trigger
  );

  const { container } = await withSSRSetup(() => {
    return () => h(WrappedComp);
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
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();
});

it('should load the wrapped component just before hydration when triggered (with function)', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();
  const trigger = ref(false);

  const WrappedComp = hydrateWhenTriggered(
    () =>
      Promise.resolve({
        setup() {
          onUpdated(spyUpdated);

          return () => h('button', { onClick: spyClick }, 'foo');
        },
      }),
    trigger
  );

  const { container } = await withSSRSetup(() => {
    return () => h(WrappedComp);
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
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();
});
