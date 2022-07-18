import { isVNode } from 'vue';
import { isFunction, isObject } from './helpers';

export default function traverseChildren(vnode, fn) {
  if (!isVNode(vnode)) {
    return;
  }

  fn(vnode);

  if (vnode.children === null) {
    return;
  }

  if (Array.isArray(vnode.children)) {
    vnode.children.forEach((child) => traverseChildren(child, fn));

    return;
  }

  if (isObject(vnode.children)) {
    Object.keys(vnode.children).forEach((slotName) => {
      if (!isFunction(vnode.children[slotName])) {
        return;
      }

      const slotContent = vnode.children[slotName]();

      if (Array.isArray(slotContent)) {
        slotContent.forEach((child) => traverseChildren(child, fn));

        return;
      }

      traverseChildren(slotContent, fn);
    });
  }
}
