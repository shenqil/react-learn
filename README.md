# React 深入5(React Fiber）

+ 1.传统Dom渲染
![image.png](https://upload-images.jianshu.io/upload_images/25820166-fb422b01fb4fa8c0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
+ 2.**reconciliaton**协调
  + 2.1将vnode,通过reader()方法转换成node,[通用算法](https://grfia.dlsi.ua.es/ml/algorithms/references/editsurvey_bille.pdf)复杂度为O(n3),其中n是树中元素的数量
  + React基于以下两个假设提出一套O(n)的启发式算法
    + 2.1.1. 两个类型不同的元素会产生不同的树
    + 2.1.2. 开发可以通过**key** prop来暗示那些子元素在不同的渲染情况下能保持稳定
  + 2.2**diff**过程同层比较，深度优先，对比两个虚拟dom时，会有三种操作:删除，替换和更新
    + 2.2.1.删除: newVnode不存在时
    + 2.2.2.替换: vnode和newVnode类型不同或key不同时
    + 2.2.3.更新: 有相同类型和key,但vnode和newVnode不同时
+ 3.**Fiber**协调 是React16中新的协调引擎，主要目的是使**Virtual Dom**能够进行增量渲染
  + 3.1 对于大型项目，组件树很大，递归遍历的成本就会很大，造成主进程一直被占用,无法立即处理布局，动画等周期性任务，造成视觉上的卡顿，fiber用于处理以上问题
  + 3.2 增量渲染(把渲染任务拆分成块，匀到多帧)
  + 3.4 更新时能够暂停，终止，复用渲染任务
  + 3.5 给不同类型的更新赋予优先级

***

# 实现fiber

## `window.requestIdleCallback(callback[,options])`

+ callback 一个在事件循环空闲时即将被调用的函数的引用。函数会接受一个名为IdleDeadline,可以当前空闲时间以及回调是否在超时时间前已经执行的状态
+ options(可选) timout属性

## React Fiber 一个更新过程被分为两个阶段(Phase)

+ 第一个阶段 Reconciliaton Phase,将`虚拟DOM`转换成`fiber`结构，并形成链表
+ 第二阶段 Commit Phase, 执行挂载

## fiber 结构

```
type: 标记节点类型
key: 标记节点在当前层级下的唯一性
props: 属性
index: 标记当前层级下的位置
child: 第一个子节点
sibling: 下一个兄弟节点
return: 父节点
stateNode: 如果组件是原生标签则是dom节点，如果是类组件是类实例
```

## 1. 修改render()函数

+ 构建一个 fiber
+ 使用 scheduleUpdateOnFiber() 来更新和渲染这个fiber

```
/**
 * 渲染vnode到container中
 * */
export function render(vnode:any, container:HTMLElement) {
  const FiberRoot = {
    type: container?.nodeName.toLocaleLowerCase(),
    stateNode: container,
    props: { children: vnode },
  };
  scheduleUpdateOnFiber(FiberRoot);
}
```

## 2. 实现scheduleUpdateOnFiber()函数

+ 设置 根`wipRoot` 为传入的`FiberRoot`,同时清空 `wipRoot`的sibling
+ 将下一个要执行的 `nextUnitOfwork` 设置为传入的`FiberRoot`

```
// src\react\ReactFiberWorkLoop.ts
let wipRoot:IFiber | null = null;
let nextUnitOfwork:IFiber | null = null;
export function scheduleUpdateOnFiber(fiber:IFiber) {
  wipRoot = fiber;
  wipRoot.sibling = null;
  nextUnitOfwork = wipRoot;
}
```

## 3.实现workLoop(IdleDeadline), 在浏览器空闲时调用，`Reconciliaton`和`Commit`

+ Reconciliaton Phase ，利用浏览器空闲时间遍历wip,转换为fiber,形成链表

```
function workLoop(IdleDeadline:IdleDeadline) {
  while(nextUnitOfwork && IdleDeadline.timeRemaining()>=0){
    // 第一个阶段 Reconciliaton Phase
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }

  if(!nextUnitOfWork && wipRoot){
    // 第二阶段 Commit Phase
    commitRoot()
  }
}
window.requestIdleCallback(workLoop);
```

## 4. 实现performUnitOfWork(nextUnitOfWork),`Reconciliaton`阶段生成 `fiber`

+ 根据wip的type,去执行对应的update(与[React jsx](https://www.jianshu.com/p/4082c2f4530d)相似),大概是
  + 1.原生节点，直接`document.createElement`创建对应的node
  + 2.函数组件，执行对应方法
  + 3.类组件，实例对应的类
  + 4.然后与所有的children，相互链接，形成双向链表，相邻fiber，形成单向链表
+ 采用深度优先的模式，返回下一个fiber

```
// src\react\ReactFiberWorkLoop.ts
function performUnitOfWork(wip:IFiber):IFiber|null {
  const { type } = wip;
  if (isFunction(type)) {
    type.prototype.isReactComponent
      ? updateClassComponent(wip)
      : updateFunctionComponent(wip);
  }else(isString(type)){
    updataHostComponent(wip)
  }else{
    updateFragementComponent(wip)
  }

  // 2.返回下一个wip,深度优先
  if (wip.child) {
    return wip.child;
  }

  let next:IFiber | undefined = wip;
  while (next) {
    if (next.sibling) {
      return next.sibling;
    }
    next = wip.child;
  }

  return null
}
```

## 5.实现commitRoot() ,`Commit`阶段将 `stateNode`连接在一起

+ 因为`Reconciliaton`已经生成的所有的`stateNode`,并且`fiber`return指向`父fiber`
+ 所以只要拿到parentFiber的`stateNode`,appendChild当前`fiber.stateNode`即可连接成一整个HTML
+ 函数组件与类组件也是一个fiber,但是不存在stateNode

```
 function commitRoot(){
  commitWorker(wipRoot?.child);
}

function commitWorker(wip){
  if(!wip){
    return
  }

  // 将子节点挂载在父节点上
  const {stateNode} = wip
  const parentNode = getParentNode(wip)
  if(stateNode){
    parentNode.appendChild(stateNode)
  }

  // 递归
  commitWorker(wip.child)
  commitWorker(wip.sibling)
}

function getParentNode(fiber){
  let nuxt = fiber
  while(nuxt){
    if(nuxt.return?.stateNode){
      return nuxt.return?.stateNode
    }
    nuxt = nuxt.return
  }

  throw new Error('getParentNode is null')
}
```

***

# 实现 Reconciler 的 update

+ 在fiber中,Reconciler 阶段会根据 将`wip`转换为`fiber`,并且形成链表
+ update 填充`statenode`
+ reconcileChildren 将`wip`转换为`fiber`,并且形成链表

## 1.原生标签updataHostComponent()

+ 直接创建
+ 更新属性
+ 将所有children转换fiber,并形成链表

```
export function updataHostComponent(wip:any) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, wip.props);
  }

  reconcileChildren(wip, wip.props.children);
}
```

## 2. 类组件updateClassComponent()

+ 实例化，并执行内部的render，拿到children
+ 将所有children转换fiber,并形成链表

```
export function updateClassComponent(wip:any) {
  const { type, props } = wip;
  // eslint-disable-next-line new-cap
  const instance = new type(props);
  const children = instance.render();

  reconcileChildren(wip, children);
}
```

## 3. 函数组件updateFunctionComponent()

+ 执行函数拿到children
+ 将所有children转换fiber,并形成链表

```
export function updateFunctionComponent(wip:any) {
  const { type, props } = wip;
  const children = type(props);

  reconcileChildren(wip, children);
}
```

## 4. 空节点 updateFragementComponent()

+ 直接拿到拿到children
+ 将所有children转换fiber,并形成链表

```
export function updateFragementComponent(wip:any) {
  reconcileChildren(wip, wip.props.children);
}
```

## 5.reconcileChildren()

+ 此方法入参是`parentFiber`,和`children`**(虚拟Dom)**
+ 首先将`虚拟Dom`转换为`fiber`
+ 然后根据规则填充 `return`,`child`,`sibling`
  + 规则1：所有子`fiber`，`return`指向`parentFiber`,
  + 规则2：`parentFiber`的`child`指向第一个`fiber`
  + 规则3：上一个`fiber`的`sibling`指向下一个`fibling`

```
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
```

[源码](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%811-fiber)
