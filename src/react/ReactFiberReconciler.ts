import { renderHooks } from './hooks';
import { reconcileChildren } from './ReactChildFiber';
import { updateNode } from './utils';

export function updataHostComponent(wip:any) {
  if (!wip.stateNode) {
    wip.stateNode = document.createElement(wip.type);
    updateNode(wip.stateNode, {}, wip.props);
  }

  reconcileChildren(wip, wip.props.children);
}

export function updateClassComponent(wip:any) {
  const { type, props } = wip;
  // eslint-disable-next-line new-cap
  const instance = new type(props);
  const children = instance.render();

  reconcileChildren(wip, children);
}

export function updateFunctionComponent(wip:any) {
  renderHooks(wip);
  const { type, props } = wip;
  const children = type(props);

  reconcileChildren(wip, children);
}

export function updateFragementComponent(wip:any) {
  reconcileChildren(wip, wip.props.children);
}

export default {
  updataHostComponent,
  updateClassComponent,
  updateFunctionComponent,
  updateFragementComponent,
};
