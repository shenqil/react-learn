import {
  updataHostComponent,
  updateClassComponent,
  updateFunctionComponent,
  updateFragementComponent,
} from './ReactFiberReconciler';
import { schedulerCallback } from './scheduler';
import {
  isString, isFunction, updateNode, Placement, Update,
} from './utils';

let wipRoot:any = null;
let nextUnitOfwork:any = null;

export function scheduleUpdateOnFiber(fiber:any) {
  fiber.alternate = { ...fiber };
  wipRoot = fiber;
  wipRoot.sibling = null;
  nextUnitOfwork = wipRoot;
  schedulerCallback(workLoop);
}

// ------- window.requestIdleCallback 可能存在浏览器兼容性问题 --------
// function workLoop(IdleDeadline:IdleDeadline) {
//   while (nextUnitOfwork && IdleDeadline.timeRemaining() >= 0) {
//     // 第一个阶段 Reconciliaton Phase
//     nextUnitOfwork = performUnitOfWork(nextUnitOfwork);
//   }

//   if (!nextUnitOfwork && wipRoot) {
//     // 第二阶段 Commit Phase
//     commitRoot();
//   }
// }
// window.requestIdleCallback(workLoop);

// 使用自己实现的调度，返回值：true 执行完成, false 还没有执行完成
function workLoop() {
  if (nextUnitOfwork) {
    nextUnitOfwork = performUnitOfWork(nextUnitOfwork);

    // // 模拟大量计算
    // let j = 0;
    // for (let i = 0; i < 500000; i++) {
    //   j += i;
    // }
    // console.log(j);
  } else {
    if (wipRoot) {
      commitRoot();
    }

    return true;
  }

  return false;
}

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
  isFunction(wipRoot.type) ? commitWorker(wipRoot) : commitWorker(wipRoot?.child);
}

function commitWorker(wip:any) {
  if (!wip) {
    return;
  }

  const { stateNode, flags, type } = wip;

  if (isFunction(type)) {
    invokesHooks(wip);
  }

  // 将子节点挂载在父节点上
  const parentNode = getParentNode(wip);

  // 新增
  if (stateNode && flags & Placement) {
    parentNode.appendChild(stateNode);
  }

  // 更新
  if (stateNode && flags & Update) {
    updateNode(stateNode, wip.alternate.props, wip.props);
  }

  // 递归
  commitWorker(wip.child);
  commitWorker(wip.sibling);
}

function getParentNode(fiber:any):HTMLElement {
  let nuxt = fiber;

  while (nuxt) {
    // 函数组件也是一个fiber,但是不存在stateNode
    if (nuxt.return?.stateNode) {
      return nuxt.return?.stateNode;
    }
    nuxt = nuxt.return;
  }
  throw new Error('getParentNode is null');
}

function invokesHooks(wip:any) {
  const { updateQueueOfEffect, updateQueueOfLayout } = wip;

  if (updateQueueOfEffect && updateQueueOfEffect.length) {
    updateQueueOfEffect.forEach(({ create }:any) => schedulerCallback(() => {
      create();
      return true;
    }));
  }

  if (updateQueueOfLayout && updateQueueOfLayout.length) {
    updateQueueOfLayout.forEach(({ create }:any) => create());
  }
}
