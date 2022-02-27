/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-param-reassign */
import { createFiber } from './createFiber';
import { updateNode, isString } from './utils';

export function updataHostComponent(wip:any) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, wip.props);
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
  const { type, props } = wip;
  const children = type(props);

  reconcileChildren(wip, children);
}

export function updateFragementComponent(wip:any) {
  reconcileChildren(wip, wip.props.children);
}

function reconcileChildren(returnFiber:any, children:any) {
  if (isString(children)) {
    return;
  }

  const newChildren = Array.isArray(children) ? children : [children];
  let previousNewFiber:any | null = null;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < newChildren.length; i++) {
    const child = newChildren[i];
    const newFiber = createFiber(child, returnFiber);

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

export default {
  updataHostComponent,
  updateClassComponent,
  updateFunctionComponent,
  updateFragementComponent,
};
