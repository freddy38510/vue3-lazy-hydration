import { h, onUpdated } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { withSSRSetup, triggerEvent } from '../../test/utils';

import { hydrateNever } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should never hydrate and load the component', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();

  const WrappedComp = hydrateNever({
    setup() {
      onUpdated(spyUpdated);

      return () => h('button', { onClick: spyClick }, 'foo');
    },
  });

  const { container } = await withSSRSetup(() => {
    return () => h(WrappedComp);
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // should not be hydrated
  await flushPromises();
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();
});

it('should never hydrate and load the component (with function)', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();

  const WrappedComp = hydrateNever(() =>
    Promise.resolve({
      setup() {
        onUpdated(spyUpdated);

        return () => h('button', { onClick: spyClick }, 'foo');
      },
    })
  );

  const { container } = await withSSRSetup(() => {
    return () => h(WrappedComp);
  });

  // hydration not complete yet
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();

  // should not be hydrated
  await flushPromises();
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).not.toHaveBeenCalled();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();
});
