export interface IFiber{
  type: any,
  key?: string | number,
  props?: any,
  index?: number,
  child?: IFiber,
  sibling?: IFiber | null,
  return?: IFiber,
  stateNode: HTMLElement | null
}

export function createFiber(vnode:any, returnFiber:IFiber):IFiber {
  const newFiber = {
    type: vnode.type,
    key: vnode.key,
    props: vnode.props,
    return: returnFiber,
    stateNode: null,
  };
  return newFiber;
}
