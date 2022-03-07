/* eslint-disable no-multi-assign */
import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';
import { IFiber } from './createFiber';

let workInProgressHook:any = null;
// 当前工作的fiber
let currentlyRenderingFiber:IFiber | null = null;

export function renderHooks(wip:any) {
  currentlyRenderingFiber = wip as IFiber;
  currentlyRenderingFiber.memoizedState = null;
  workInProgressHook = null;
}

export interface IHook{
  memoizedState:any,
  next:IHook | null
}
// fiber(memoizedState)->hook0(next)->hook1(next)->hook2(next)->null
// workInProgressHook=hook2 当前的hook
export function updateWorkInProgressHook():IHook {
  let hook:IHook = {
    memoizedState: null,
    next: null,
  };

  if (!currentlyRenderingFiber) {
    return hook;
  }

  // 拿到老节点
  const current = currentlyRenderingFiber.alternate;
  if (current) {
    // 将老节点的 hook 移到新节点之上
    currentlyRenderingFiber.memoizedState = current.memoizedState;

    if (workInProgressHook) {
      // 否则依次返回下一个
      hook = workInProgressHook = workInProgressHook.next;
    } else {
      // 不存在从第一个开始
      hook = workInProgressHook = currentlyRenderingFiber.memoizedState;
    }
  } else {
    // 初次渲染,初始化hook

    // eslint-disable-next-line no-lonely-if
    if (workInProgressHook) {
      // 存在，直接加载链表的最后面，并且将指针移到当前hook
      workInProgressHook = workInProgressHook.next = hook;
    } else {
      // 不存在，使用当前hook 初始化当前fiber的memoizedState,并且记录当前hook
      workInProgressHook = currentlyRenderingFiber.memoizedState = hook;
    }
  }

  return hook;
}

export function useReducer<T>(reducer:Function, initialState:T) {
  // 按照顺序拿到对应的hook值
  const hook = updateWorkInProgressHook();

  if (!currentlyRenderingFiber?.alternate) {
    // 第一次渲染
    hook.memoizedState = initialState;
  }

  const dispatch = (action:any) => {
    hook.memoizedState = reducer(hook.memoizedState, action);
    scheduleUpdateOnFiber(currentlyRenderingFiber);
  };

  return [hook.memoizedState, dispatch];
}

export function useState<T>(initialState:T) {
  const hook = updateWorkInProgressHook();

  if (!currentlyRenderingFiber?.alternate) {
    // 第一次渲染
    hook.memoizedState = initialState;
  }

  const dispatch = (state:T) => {
    hook.memoizedState = state;
    scheduleUpdateOnFiber(currentlyRenderingFiber);
  };

  return [hook.memoizedState, dispatch];
}
