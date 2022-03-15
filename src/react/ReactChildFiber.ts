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
