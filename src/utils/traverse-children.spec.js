import { getCurrentInstance, h, onMounted } from 'vue';

import { withSetup } from '../../test/utils';

import traverseChildren from './traverse-children';

beforeEach(() => {
  document.body.innerHTML = '';
});

it('should traverse slots children with single element', async () => {
  let foundSlotVnode = 0;

  const spyFn = vi.fn((vnode) => {
    if (vnode.type === 'p') {
      foundSlotVnode += 1;
    }
  });

  const Child = {
    setup(_, { slots }) {
      return () => slots.default();
    },
  };

  await withSetup(() => {
    const instance = getCurrentInstance();

    onMounted(() => {
      traverseChildren(instance.subTree, spyFn);
    });

    return () => h('div', h(Child, null, { default: () => h('p', 'foo') }));
  });

  // div, Child component, p
  expect(spyFn).toHaveBeenCalledTimes(3);
  // p
  expect(foundSlotVnode).toBe(1);
});

it('should traverse slots children with multiple elements', async () => {
  let foundSlotVnode = 0;

  const spyFn = vi.fn((vnode) => {
    if (vnode.type === 'p') {
      foundSlotVnode += 1;
    }
  });

  const Child = {
    setup(_, { slots }) {
      return () => slots.default();
    },
  };

  await withSetup(() => {
    const instance = getCurrentInstance();

    onMounted(() => {
      traverseChildren(instance.subTree, spyFn);
    });

    return () =>
      h(
        'div',
        h(Child, null, { default: () => [h('p', 'foo'), h('p', 'bar')] })
      );
  });

  // div, Child component, p, p
  expect(spyFn).toHaveBeenCalledTimes(4);
  // p, p
  expect(foundSlotVnode).toBe(2);
});
