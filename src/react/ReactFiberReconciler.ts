/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
import { createFiber } from './createFiber';
import { renderHooks } from './hooks';
import { updateNode, isStringOrNumber, Update } from './utils';

export function updataHostComponent(wip:any) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, {}, wip.props);
  }

  reconcileChildren(wip, wip.props.children);
}

export function updateClassComponent(wip:any) {
  const { type, props } = wip;
  // eslint-disable-next-line new-cap
  const instance = new type(props);
  const children = instance.render();

  reconcileChildren(wip, children);
}

export function updateFunctionComponent(wip:any) {
  renderHooks(wip);
  const { type, props } = wip;
  const children = type(props);

  reconcileChildren(wip, children);
}

export function updateFragementComponent(wip:any) {
  reconcileChildren(wip, wip.props.children);
}

function reconcileChildren(returnFiber:any, children:any) {
  if (isStringOrNumber(children)) {
    return;
  }

  const newChildren = Array.isArray(children) ? children : [children];
  let previousNewFiber:any | null = null;

  let oldFiber = returnFiber.alternate && returnFiber.alternate.child;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < newChildren.length; i++) {
    const child = newChildren[i];
    const newFiber = createFiber(child, returnFiber);

    if (sameNode(newFiber, oldFiber)) {
      // 更新
      Object.assign(newFiber, {
        alternate: oldFiber,
        stateNode: oldFiber.stateNode,
        flags: Update,
      });
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }

    if (previousNewFiber === null) {
      // parentFiber的child指向第一个fiber
      returnFiber.child = newFiber;
    } else {
      // 否则将上一个fiber,指向当前fiber
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }
}

function sameNode(a:any, b:any) {
  return !!(a && b && a.type === b.type && a.key === b.key);
}

export default {
  updataHostComponent,
  updateClassComponent,
  updateFunctionComponent,
  updateFragementComponent,
};
