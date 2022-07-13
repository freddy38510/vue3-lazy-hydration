/* eslint-disable no-underscore-dangle */

import traverseChildren from './traverse-children';

function isAsyncWrapper(vnode) {
  return (
    vnode.type &&
    vnode.type.__asyncLoader &&
    vnode.type.name === 'AsyncComponentWrapper'
  );
}

export default function waitForAsyncComponents({ subTree }, cb) {
  const promises = [];

  traverseChildren(subTree, (vnode) => {
    if (isAsyncWrapper(vnode)) {
      promises.push(vnode.type.__asyncLoader());
    }
  });

  if (promises.length > 0) {
    Promise.all(promises).then(cb);

    return;
  }

  cb();
}
