import { scheduleUpdateOnFiber } from './ReactFiberWorkLoop';

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

export default { render };
