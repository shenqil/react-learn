# 写在前面
+ hook 是函数组件有了状态，原理是闭包
+ hook 是存储在`fiber`的`memoizedState`属性上；采用`{memoizedState: null, next: null}`的链表结构,所以 hook 只能在函数组件最外层和自定义hook中使用，且不能使用for和if逻辑判断，因为需要保证链表的唯一顺序
+ `fiber.memoizedState` 指向 hook 链表的第一个
***

# 1.React 实现更新
+ 上一篇 [React Fiber](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%812-scheduler) 的代码里面还只有新建,在上面的基础上完成更新

***
## 1.1 更新Fiber 
```
export interface IFiber{
  type: any, // 类型
  key?: string | number, // 标记当前层唯一值
  props?: any, // 属性值
  index?: number,
  child?: IFiber, // 第一个孩子
  sibling?: IFiber | null, // 下一个兄弟
  return?: IFiber, // 父节点
  stateNode: HTMLElement | null, // 真实Dom
  flags?:Number, // 标记当前节点类型(插入，更新，删除)
  alternate?:IFiber, // 老节点
  memoizedState?:any
}
export function createFiber(vnode:any, returnFiber:IFiber):IFiber {
  const newFiber = {
    type: vnode.type,
    key: vnode.key,
    props: vnode.props,
    return: returnFiber,
    stateNode: null,
    flags: Placement,
  };
  return newFiber;
}
```
+ 新增`flags` 用户标记组件是需要 **创建(Placement)**，**更新(Update)**，还是**删除(Deletion)**
+ 新增`alternate`,用于指向老节点
+ 新增`memoizedState`,用于储存hook
+ createFiber 将 `flags`初始化为`Placement`
***

## 1.2 更新 updateNode ，使其具有更新功能，并且能够处理时间
```
// src\react\utils.ts

// 更新原生标签的属性，如className、href、id、（style、事件）等
export function updateNode(node:any, prevVal:any, nextVal:any) {
  Object.keys(prevVal)
  // .filter(k => k !== "children")
    .forEach((k) => {
      if (k === 'children') {
        // 有可能是文本
        if (isStringOrNumber(prevVal[k])) {
          node.textContent = '';
        }
      } else if (k.slice(0, 2) === 'on') {
        const eventName = k.slice(2).toLocaleLowerCase();
        node.removeEventListener(eventName, prevVal[k]);
      } else if (!(k in nextVal)) {
        node[k] = '';
      }
    });
  Object.keys(nextVal)
  // .filter(k => k !== "children")
    .forEach((k) => {
      if (k === 'children') {
        // 有可能是文本
        if (isStringOrNumber(nextVal[k])) {
          node.textContent = `${nextVal[k]}`;
        }
      } else if (k.slice(0, 2) === 'on') {
        const eventName = k.slice(2).toLocaleLowerCase();
        node.addEventListener(eventName, nextVal[k]);
      } else {
        node[k] = nextVal[k];
      }
    });
}
```
***
## 1.3 修改**ReactFiberReconciler**
```
// src\react\ReactFiberReconciler.ts

export function updateFunctionComponent(wip:any) {
  renderHooks(wip);
  const { type, props } = wip;
  const children = type(props);

  reconcileChildren(wip, children);
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
```
+ `updateFunctionComponent` 函数组件调用 `renderHooks`
+ `sameNode` 对比新旧组件，标记组件的`flags`为`Update`
***

## 1.4 修改ReactFiberWorkLoop
```
// src\react\ReactFiberWorkLoop.ts
export function scheduleUpdateOnFiber(fiber:any) {
  fiber.alternate = { ...fiber };
  wipRoot = fiber;
  wipRoot.sibling = null;
  nextUnitOfwork = wipRoot;
  schedulerCallback(workLoop);
}

function commitWorker(wip:any) {
  if (!wip) {
    return;
  }

  // 将子节点挂载在父节点上
  const { stateNode, flags } = wip;
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
```
+ `scheduleUpdateOnFiber` 调度前，`alternate`记录自己的当前fiber，调度后,`alternate`就是旧fiber节点了
+ `commitWorker` 提交时，判断flags是新增还是更新，新增还是之前的逻辑，更新回复用之前的Dom,只更新属性
***

# 2.实现Hook (创建 `src\react\hooks.ts`)
```
let workInProgressHook:any = null;
// 当前工作的fiber
let currentlyRenderingFiber:IFiber | null = null;

export function renderHooks(wip:any) {
  currentlyRenderingFiber = wip as IFiber;
  currentlyRenderingFiber.memoizedState = null;
  workInProgressHook = null;
}
```
+  **renderHooks** 在 **updateFunctionComponent** 的 `type(props)` 之前调用, **updateFunctionComponent** 会在初次渲染时调用
+  **currentlyRenderingFiber** 记录当前工作的函数组件 `fiber`
+  **workInProgressHook** 指向 useFunction闭包的内存地址，从第一个开始，每调用一次useFunction后，workInProgressHook,顺着hook链表向下移动一个
```
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
```
+ **updateWorkInProgressHook** 是在**useFunction**中调用，初次**创建时**，会根据**useFunction** 调用顺序，创建一条 `fiber(memoizedState)->hook0(next)->hook1(next)->hook2(next)->null`
+ 在**更新时** 根据**useFunction**的调用顺序，复用上面的 hook 链表，这样就能完成函数组件的状态保存
***

## 2.1 useReducer
```
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
```
+ 现在看 hook 真简单，神秘的面纱被揭开了，里面做了两件事情
+ 初次创建 根据initialState，初始化 hook值
+ 调用**dispatch **时，直接运行一下 **reducer**，拿到更新的值，放在 hook上，然后调度一下当前fiber
***

## 2.1 useState
```
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
```
+ 原理类似

[源码](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%813-hook)
