import { defineComponent, markRaw, getCurrentInstance, h } from 'vue';

export default function createHydrationWrapper(component, onSetup, opts = {}) {
  return markRaw(
    defineComponent({
      name: 'LazyHydrationWrapper',
      inheritAttrs: false,
      suspensible: false,
      emits: ['hydrated'],
      ...opts,

      setup(props, { attrs, slots, emit, expose }) {
        const { onHydrated } = onSetup(props);

        onHydrated(() => emit('hydrated'));

        expose({});

        if (component === null) {
          return () => {
            const slotContent = slots.default();

            return slotContent.length === 1 ? slotContent[0] : slotContent;
          };
        }

        const {
          vnode: { ref },
        } = getCurrentInstance();

        return () => h(component, { ...attrs, ref }, slots);
      },
    })
  );
}
