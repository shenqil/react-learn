import { Placement } from './utils';

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
  memoizedState?:any,
  updateQueueOfEffect?:any, // 挂载需要更新的effect
  updateQueueOfLayout?:any // 挂载需要更新的LayoutEffect
}

export function createFiber(vnode:any, returnFiber:IFiber):IFiber {
  const newFiber = {
    type: vnode.type,
    key: vnode.key,
    props: vnode.props,
    return: returnFiber,
    stateNode: null,
    flags: Placement,
    updateQueueOfEffect: [],
    updateQueueOfLayout: [],
  };
  return newFiber;
}
