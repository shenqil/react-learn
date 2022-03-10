# 在[上一篇博客](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%813-hook)，初步使用了 `useReducer`, `useState`; 现在接着实现`useEffect`, `useLayoutEffect`

+ `useEffect`和`useLayoutEffect`功能类似，`useLayoutEffect`是在`cimmit` 阶段直接执行，`useEffect`则是在`cimmit`阶段调用`schedulerCallback`执行，所以执行顺序是，`useLayoutEffect`在渲染后立刻执行，`useEffect`在下一个eventloop的时候执行

***

# 实现useEffect和useLayoutEffect

```
// src\react\hooks.ts

export function renderHooks(wip:any) {
  currentlyRenderingFiber = wip as IFiber;
  currentlyRenderingFiber.memoizedState = null;
  currentlyRenderingFiber.updateQueueOfEffect = [];
  currentlyRenderingFiber.updateQueueOfLayout = [];
  workInProgressHook = null;
}

export function useEffect(create:Function, deps:Array<any> | null) {
  updateEffectIml(HookPassive, create, deps);
}

export function useLayoutEffect(create:Function, deps:Array<any> | null) {
  updateEffectIml(HookLayout, create, deps);
}

function updateEffectIml(hookFlags:number, create:Function, deps:Array<any> | null) {
  const hook = updateWorkInProgressHook();

  if (!hook.memoizedState) {
    // 第一次渲染
    hook.memoizedState = { create, deps, HookLayout };
  } else {
    if (areHookInputsEqual(hook.memoizedState.deps, deps)) {
      return;
    }
    hook.memoizedState = { create, deps, HookLayout };
  }

  if (hookFlags & HookLayout) {
    currentlyRenderingFiber?.updateQueueOfLayout.push(hook.memoizedState);
  } else if (hookFlags & HookPassive) {
    currentlyRenderingFiber?.updateQueueOfEffect.push(hook.memoizedState);
  }
}
```

+ 逻辑是每次渲染在`fiber`上开辟一个队列`updateQueueOfxxx`
+ 然后在hook链表上拿到memoizedState，里面存放着 `create,deps,flags`
+ create是deps发生变化时执行的函数
+ deps 是依赖项
+ flags 用来标记 `useEffect`和 `useLayoutEffect`
+ 渲染时，对比`memoizedState.deps`和传入的deps是否相等，然后把deps发生变化的hook放入`updateQueueOfxxx`

***

# 修改commit 阶段调用`updateQueueOfxxx`里面的`create`

```
// src\react\ReactFiberWorkLoop.ts
function commitWorker(wip:any) {
  // ...

  const { stateNode, flags, type } = wip;

  if (isFunction(type)) {
    invokesHooks(wip);
  }
  // ...
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
```

+ `useLayoutEffect` 直接执行
+ `useEffect` 放入`schedulerCallback`,下一次执行

***
[源码](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%814---(useEffect%2CuseLayoutEffect))
