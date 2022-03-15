# 1.diff 策略

+ 1.同级比较，Web UI中Dom节点跨层移动比较少，可以忽略不计
+ 2.拥有不同类型的两个组件将会生成不同的树形结构
+ 3.开发者可以通过**key**prop来暗示那些子元素在不同的渲染下能保持稳定

***

# 2.diff过程

+ 删除:newVnode不存在时
+ 替换:vnode和newVnode类型不同或者key不同时
+ 更新:有相同的类型和key,但是vnode和newVnode不同时

***

# 3.diff 流程图

+
![diff.png](https://upload-images.jianshu.io/upload_images/25820166-0646d75d2fa5f4c4.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

+ newIndex从0到children.length，新老节点只会比对一次，算法复杂度为**O(n)**
+ 第一步,从第一个新老节点开始是否能被复用，不能则终止
+ 第二步，children如果遍历完，则将当前的开始的老节点全部放入父节点的deletions上
+ 第三步，老节点已经遍历完，将甚于的新节点放入新的链表中
+ 第四步，兜底操作，将剩余的老节点放入map中，判断从现在开始的新节点，map中是否存在，存在复用，不存在创建。所有新节点创建完成后，将map中剩余的老节点放入父节点的deletions上

***

# 4.实现

## 4.1 diff核心实现(协调，reconcile)

```
// src\react\ReactChildFiber.ts

import { createFiber, IFiber } from './createFiber';
import { isStringOrNumber, Placement, Update } from './utils';

/**
 * old 1,2,3,4
 * new 2,4,5
 * 协调子节点
 * */
export function reconcileChildren(returnFiber:IFiber, children:any) {
  if (isStringOrNumber(children)) {
    return;
  }

  const shouldTrackSideEffects = !!returnFiber.alternate;

  const newChildren = Array.isArray(children) ? children : [children];

  let previousNewFiber:IFiber | null = null;
  let oldFiber:any = returnFiber.alternate && returnFiber.alternate.child;
  let nextOldFiber = null;

  let newIndex = 0;
  let lastPlacedIndex = 0;

  // 1.更新阶段，找到能复用的节点，如果不能复用，则停止这轮循环
  for (;oldFiber && newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild === null || newChild === false) {
      // 不存在结束当前循环
      continue;
    }
    if (oldFiber.index > newIndex) {
      nextOldFiber = oldFiber;
      oldFiber = null;
    } else {
      nextOldFiber = oldFiber.sibling;
    }

    const newFiber = createFiber(newChild, returnFiber);
    Object.assign(newFiber, {
      alternate: oldFiber,
      stateNode: oldFiber?.stateNode,
      flags: Update,
    });

    const same = sameNode(newFiber, oldFiber);
    if (!same) {
      if (oldFiber === null) {
        oldFiber = nextOldFiber;
      }
      break;
    }

    lastPlacedIndex = placeChild(
      newFiber,
      lastPlacedIndex,
      newIndex,
      shouldTrackSideEffects,
    );

    if (previousNewFiber === null) {
      returnFiber.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
    oldFiber = nextOldFiber;
  }

  // 2.校验newChildren是否到头,如果newChildren已经遍历完，那么把剩下的oldFiber链表删除就行
  if (newIndex === newChildren.length) {
    deleteRemainingChildren(returnFiber, oldFiber);
  }

  // 3.
  // 3.1 初次渲染
  // 3.2 oldFiber已经为null,也就意味着老fiber链表已经被复用完成，但是新的Children还有fiber要生成，就只能新增插入了
  if (!oldFiber) {
    for (; newIndex < newChildren.length; newIndex++) {
      const newChild = newChildren[newIndex];
      if (newChild === null) {
        continue;
      }
      const newFiber = createFiber(newChild, returnFiber);
      lastPlacedIndex = placeChild(
        newFiber,
        lastPlacedIndex,
        newIndex,
        shouldTrackSideEffects,
      );

      if (previousNewFiber === null) {
        returnFiber.child = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return;
  }

  // 4.同时遍历新子节点数组和老链表，能复用的节点就服用，没法复用的老节点删除，新节点新增插入
  // old 1:{} 2:{} 3:{} 4:{} (查找，删除)
  // new 2 4 5
  const existingChildren = mapRemainingChildren(oldFiber);
  for (; newIndex < newChildren.length; newIndex++) {
    const newChild = newChildren[newIndex];
    if (newChild === null || newChild === false) {
      continue;
    }

    const newFiber = createFiber(newChild, returnFiber);
    lastPlacedIndex = placeChild(
      newFiber,
      lastPlacedIndex,
      newIndex,
      shouldTrackSideEffects,
    );

    // 从老链表上找到能复用的节点
    const matchedFiber = existingChildren.get(newFiber.key || newFiber.index);
    if (matchedFiber) {
      // 找到能复用的节点
      existingChildren.delete(newFiber.key || newFiber.index);
      Object.assign(newFiber, {
        alternate: matchedFiber,
        stateNode: matchedFiber.stateNode,
        flags: Update,
      });
    }

    if (previousNewFiber === null) {
      returnFiber.child = newFiber;
    } else {
      previousNewFiber.sibling = newFiber;
    }
    previousNewFiber = newFiber;
  }

  if (shouldTrackSideEffects) {
    existingChildren.forEach((child:IFiber) => deleteChild(returnFiber, child));
  }
}

function placeChild(
  newFiber:IFiber,
  lastPlacedIndex:number,
  newIndex:number,
  shouldTrackSideEffects:boolean,
):number {
  newFiber.index = newIndex;
  if (!shouldTrackSideEffects) {
    return lastPlacedIndex;
  }
  const current = newFiber.alternate;

  if (current) {
    const oldIndex = current.index || 0;
    if (oldIndex < lastPlacedIndex) {
      // move
      newFiber.flags = Placement;
      return lastPlacedIndex;
    }
    return oldIndex;
  }
  newFiber.flags = Placement;
  return lastPlacedIndex;
}

// 删除单个节点
function deleteChild(returnFiber:IFiber, childToDelete:IFiber) {
  // returnFiber.deletoins = [...]
  const { deletoins } = returnFiber;
  if (deletoins) {
    deletoins.push(childToDelete);
  } else {
    returnFiber.deletoins = [childToDelete];
  }
}

// 删除节点链表，头节点是currentFirstChild
function deleteRemainingChildren(returnFiber:IFiber, currentFirstChild:IFiber) {
  let childToDelete:any = currentFirstChild;
  while (childToDelete) {
    deleteChild(returnFiber, childToDelete);
    childToDelete = childToDelete.sibling;
  }
}

function mapRemainingChildren(currentFirstChild:IFiber) {
  const existingChildren = new Map();
  let existingChild:any = currentFirstChild;
  while (existingChild) {
    existingChildren.set(
      existingChild.key || existingChild.index,
      existingChild,
    );
    existingChild = existingChild.sibling;
  }

  return existingChildren;
}

function sameNode(a:any, b:any) {
  return !!(a && b && a.type === b.type && a.key === b.key);
}
```

# 4.2 调整src\react\ReactFiberWorkLoop.ts的新建和删除

```
  // 新增
  if (stateNode && flags & Placement) {
    const hasSiblingNode = foundSiblingNode(wip, parentNode);
    if (hasSiblingNode) {
      parentNode.insertBefore(stateNode, hasSiblingNode);
    } else {
      parentNode.appendChild(wip.stateNode);
    }
  }

  // 删除
  if (wip.deletoins) {
    commitDeletions(wip.deletoins, stateNode || parentNode);
    wip.deletoins = null;
  }
```

***
[源码](https://github.com/shenqil/react-learn/tree/%E6%BA%90%E7%A0%815-(diff))
