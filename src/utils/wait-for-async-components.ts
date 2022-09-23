/* eslint-disable no-underscore-dangle */

import type { ExtendedConcreteComponent } from 'src/composables/useLazyHydration';
import type { ComponentInternalInstance, VNode } from 'vue';
import traverseChildren from './traverse-children';

function isAsyncWrapper(
  vnode:
    | VNode & {
        type: ExtendedConcreteComponent;
      }
) {
  return (
    vnode.type?.__asyncLoader && vnode.type?.name === 'AsyncComponentWrapper'
  );
}

export default function waitForAsyncComponents(
  { subTree }: ComponentInternalInstance,
  cb: () => void
) {
  const promises: Promise<void>[] = [];

  traverseChildren(subTree, (vnode) => {
    if (isAsyncWrapper(vnode)) {
      promises.push(vnode.type.__asyncLoader!());
    }
  });

  if (promises.length > 0) {
    // eslint-disable-next-line no-void
    void Promise.all(promises).then(cb);

    return;
  }

  cb();
}
