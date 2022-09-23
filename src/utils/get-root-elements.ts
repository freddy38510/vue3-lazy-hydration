import type { ComponentInternalInstance, RendererNode } from 'vue';

const DOMNodeTypes = {
  ELEMENT: 1,
  TEXT: 3,
  COMMENT: 8,
};

const isElement = (node: RendererNode | null) =>
  node && node.nodeType === DOMNodeTypes.ELEMENT;
const isComment = (node: RendererNode | null) =>
  node && node.nodeType === DOMNodeTypes.COMMENT;
const isFragmentStart = (node: RendererNode | null) =>
  isComment(node) && node?.data === '[';
const isFragmentEnd = (node: RendererNode | null) =>
  isComment(node) && node?.data === ']';

export default function getRootElements({
  vnode,
  subTree,
}: ComponentInternalInstance) {
  if (!vnode || vnode.el === null) {
    return [];
  }

  // single Root Element
  if (isElement(vnode.el)) {
    return [vnode.el];
  }

  const els: Node[] = [];

  // multiple Root Elements
  if (subTree && isFragmentStart(subTree.el) && isFragmentEnd(subTree.anchor)) {
    let node = (vnode.el as Node).nextSibling;

    while (node) {
      if (node && isElement(node)) {
        els.push(node);
      }

      if (node === subTree.anchor) {
        return els;
      }

      node = node.nextSibling;
    }
  }

  // no elements found
  return els;
}
