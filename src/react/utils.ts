/* eslint-disable no-param-reassign */
export function isString(str:any) {
  return typeof str === 'string';
}

export function isFunction(fn:any) {
  return typeof fn === 'function';
}

// 更新原生标签的属性，如className、href、id、（style、事件）等
export function updateNode(node:HTMLElement | null, nextValue:any) {
  if (!node) {
    return;
  }
  Object.keys(nextValue).forEach((key) => {
    if (key === 'children') {
      if (isString(nextValue[key])) {
        node.textContent = nextValue[key];
      }
    } else {
      node[key] = nextValue[key];
    }
  });
}

export default { isString, isFunction };
