import { isVNode } from 'vue';

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

  if (typeof vnode.children === 'object') {
    Object.keys(vnode.children).forEach((slotName) => {
      if (typeof vnode.children[slotName] !== 'function') {
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
