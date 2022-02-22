/* eslint-disable @typescript-eslint/no-use-before-define */
/**
 * 渲染vnode到container中
 * */
export function render(vnode:any, container:HTMLElement | null) {
  console.log(vnode, 'vnode');
  // vnode -> node
  const node = createNode(vnode);

  // node -> container
  container.appendChild(node);
}

function isString(s:any) {
  return typeof s === 'string';
}

function isFunction(f:any) {
  return typeof f === 'function';
}

/**
 * 将vnode转换为真实的node
 * */
function createNode(vnode:any):any {
  let node;

  const { type, props } = vnode;

  switch (true) {
    case isString(type): {
      // HTMLElement 元素
      node = document.createElement(type); // 根据类型创建真实dom
      reconcileChildren(node, props.children); // 继续渲染子元素
      updateNode(node, props); // 将属性挂载在node上
      break;
    }

    case isFunction(type):
      // React函数组件，类组件
      node = type.prototype.isReactComponent
        ? updateClassComponent(vnode)
        : updateFunctionComponent(vnode);
      break;

    case type === undefined:
      // 普通文本
      node = document.createTextNode(vnode);
      break;

    default:
      node = document.createTextNode('');
      break;
  }

  return node;
}

/**
 * 遍历children，继续执行 render
 * */
function reconcileChildren(node:any, children:any) {
  const newChildren = Array.isArray(children) ? children : [children];
  // eslint-disable-next-line no-restricted-syntax
  for (const childVnode of newChildren) {
    // 继续将子vnode转换为node并且放在父容器里面
    render(childVnode, node);
  }
}

/**
 * 更新props到node上
 * */
function updateNode(node:any, nextVal:any) {
  Object.keys(nextVal)
    .filter((key) => key !== 'children')
    .forEach((key) => {
      // eslint-disable-next-line no-param-reassign
      node[key] = nextVal[key];
    });
}

/**
 * 类组件,先new,在执行实例的render
 * */
function updateClassComponent(vnode:any) {
  const { type, props } = vnode;
  // eslint-disable-next-line new-cap
  const instance = new type(props);
  const children = instance.render();

  const node = createNode(children);
  return node;
}

/**
 * 函数组件,直接执行组件
 * */
function updateFunctionComponent(vnode:any) {
  const { type, props } = vnode;
  const children = type(props);
  const node = createNode(children);
  return node;
}
export default { render };
