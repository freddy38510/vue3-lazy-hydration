const DOMNodeTypes = {
  ELEMENT: 1,
  TEXT: 3,
  COMMENT: 8,
};

const isElement = (node) => node && node.nodeType === DOMNodeTypes.ELEMENT;
const isComment = (node) => node && node.nodeType === DOMNodeTypes.COMMENT;
const isFragmentStart = (node) => isComment(node) && node.data === '[';
const isFragmentEnd = (node) => isComment(node) && node.data === ']';

export default function getRootElements({ vnode, subTree }) {
  if (!vnode || vnode.el === null) {
    return [];
  }

  // single Root Element
  if (isElement(vnode.el)) {
    return [vnode.el];
  }

  const els = [];

  // multiple Root Elements
  if (subTree && isFragmentStart(subTree.el) && isFragmentEnd(subTree.anchor)) {
    let node = vnode.el.nextSibling;

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
