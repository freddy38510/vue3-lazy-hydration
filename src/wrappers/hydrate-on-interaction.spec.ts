import { h, onUpdated } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { withSSRSetup, triggerEvent } from '../../test/utils';

import { hydrateOnInteraction } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should load the wrapped component just before hydration on interaction', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();

  const WrappedComp = hydrateOnInteraction({
    setup() {
      onUpdated(spyUpdated);

      return () => h('button', { onClick: spyClick }, 'foo');
    },
  });

  const { container } = await withSSRSetup(() => () => h(WrappedComp));

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerEvent('focus', container.querySelector('button'));
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();
});

it('should load the wrapped component just before hydration on interaction (with function)', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();

  const WrappedComp = hydrateOnInteraction(() =>
    Promise.resolve({
      setup() {
        onUpdated(spyUpdated);

        return () => h('button', { onClick: spyClick }, 'foo');
      },
    })
  );

  const { container } = await withSSRSetup(() => () => h(WrappedComp));

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // trigger hydration and wait for it to complete
  triggerEvent('focus', container.querySelector('button'));
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();
});
