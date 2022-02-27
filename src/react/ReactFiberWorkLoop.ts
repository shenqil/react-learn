/* eslint-disable @typescript-eslint/no-use-before-define */
import {
  updataHostComponent,
  updateClassComponent,
  updateFunctionComponent,
  updateFragementComponent,
} from './ReactFiberReconciler';
import { isString, isFunction } from './utils';

let wipRoot:any = null;
let nextUnitOfwork:any = null;
// eslint-disable-next-line import/prefer-default-export
export function scheduleUpdateOnFiber(fiber:any) {
  wipRoot = fiber;
  wipRoot.sibling = null;
  nextUnitOfwork = wipRoot;
}

function workLoop(IdleDeadline:IdleDeadline) {
  while (nextUnitOfwork && IdleDeadline.timeRemaining() >= 0) {
    // 第一个阶段 Reconciliaton Phase
    nextUnitOfwork = performUnitOfWork(nextUnitOfwork);
  }

  if (!nextUnitOfwork && wipRoot) {
    // 第二阶段 Commit Phase
    commitRoot();
  }
}
window.requestIdleCallback(workLoop);

function performUnitOfWork(wip:any):any {
  const { type } = wip;
  if (isFunction(type)) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    type.prototype.isReactComponent
      ? updateClassComponent(wip)
      : updateFunctionComponent(wip);
  } else if (isString(type)) {
    updataHostComponent(wip);
  } else {
    updateFragementComponent(wip);
  }

  // 2.返回下一个wip,深度优先
  if (wip.child) {
    return wip.child;
  }

  let next:any = wip;
  while (next) {
    if (next.sibling) {
      return next.sibling;
    }
    next = wip.child;
  }

  return null;
}

function commitRoot() {
  commitWorker(wipRoot?.child);
  // wipRoot = null;
}

function commitWorker(wip:any) {
  if (!wip) {
    return;
  }

  // 将子节点挂载在父节点上
  const { stateNode } = wip;
  const parentNode = getParentNode(wip);

  if (stateNode) {
    parentNode.appendChild(stateNode);
  }

  // 递归
  commitWorker(wip.child);
  commitWorker(wip.sibling);
}

function getParentNode(fiber:any):HTMLElement {
  let nuxt = fiber;

  while (nuxt) {
    if (nuxt.return?.stateNode) {
      return nuxt.return?.stateNode;
    }
    nuxt = nuxt.return;
  }
  throw new Error('getParentNode is null');
}
