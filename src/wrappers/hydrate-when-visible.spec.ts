import { h, onUpdated } from 'vue';
import { flushPromises } from '@vue/test-utils';

import { ensureMocksReset, intersectionObserver } from '../../test/dom-mocks';
import { withSSRSetup, triggerEvent } from '../../test/utils';

import { hydrateWhenVisible } from '.';

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  ensureMocksReset();
});

it('should load the wrapped component just before hydration when component element is visible', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();
  intersectionObserver.mock();

  const WrappedComp = hydrateWhenVisible({
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
  intersectionObserver.simulate({
    target: container.querySelector('button') || undefined,
    isIntersecting: true,
  });
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();

  intersectionObserver.restore();
});

it('should load the wrapped component just before hydration when component element is visible (with function)', async () => {
  const spyClick = vi.fn();
  const spyUpdated = vi.fn();
  intersectionObserver.mock();

  const WrappedComp = hydrateWhenVisible(() =>
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
  intersectionObserver.simulate({
    target: container.querySelector('button') || undefined,
    isIntersecting: true,
  });
  await flushPromises();

  // should be hydrated now
  triggerEvent('click', container.querySelector('button'));
  expect(spyClick).toHaveBeenCalledOnce();
  expect(spyUpdated).not.toHaveBeenCalled();
  expect('Hydration node mismatch').not.toHaveBeenWarned();

  intersectionObserver.restore();
});
