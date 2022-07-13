export default function ensureParentHasSubTreeEl(parent) {
  if (!parent || !parent.subTree) {
    return;
  }

  // Backup the parent subtree element and onUpdated hook.
  const parentSubTreeEl = parent.subTree.el;
  const parentOnUpdatedHook = parent.u;

  if (parent.u === null) {
    parent.u = [];
  }

  // onUpdated hook
  parent.u.push(() => {
    if (parent.subTree.el === null) {
      // Restore the parent subtree element.
      parent.subTree.el = parentSubTreeEl;
    }

    // Restore the parent onUpdated hook.
    parent.u = parentOnUpdatedHook;
  });
}
