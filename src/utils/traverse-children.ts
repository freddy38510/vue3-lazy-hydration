import type { ExtendedConcreteComponent } from 'src/composables/useLazyHydration';
import { isVNode, type Slots, type VNode, type VNodeChild } from 'vue';
import { isFunction, isObject } from './helpers';

export default function traverseChildren(
  vnode:
    | (VNode & {
        type: ExtendedConcreteComponent;
      })
    | VNodeChild,
  fn: (
    vnode: VNode & {
      type: ExtendedConcreteComponent;
    }
  ) => void
) {
  if (!isVNode(vnode)) {
    return;
  }

  fn(
    vnode as VNode & {
      type: ExtendedConcreteComponent;
    }
  );

  if (vnode.children === null) {
    return;
  }

  if (Array.isArray(vnode.children)) {
    vnode.children.forEach((child) => traverseChildren(child, fn));

    return;
  }

  if (isObject(vnode.children)) {
    Object.keys(vnode.children).forEach((slotName) => {
      if (!isFunction((vnode.children as Slots)[slotName])) {
        return;
      }

      const slotContent = (vnode.children as Slots)[slotName]!();

      if (Array.isArray(slotContent)) {
        slotContent.forEach((child) => traverseChildren(child, fn));

        return;
      }

      traverseChildren(slotContent, fn);
    });
  }
}
