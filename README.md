# 1. 先创一个包含函数组件，class组件，和html各种元素的jsx

+

```
// src\main.tsx

import React, { Component } from 'react';
import { render } from 'react-dom';
import './index.scss';

interface IProps{
  name:string
}

function FuncationComponent(props:IProps) {
  return (
    <div className="border">
      <p>{props.name}</p>
    </div>
  );
}

// eslint-disable-next-line react/prefer-stateless-function
class ClassComponent extends Component<IProps> {
  render(): React.ReactNode {
    return (
      <div className="border">
        <p>{this.props.name}</p>
      </div>
    );
  }
}

const jsx = (
  <div className="border">
    <h1>jsx title</h1>
    <a href="https://www.baidu.com/">链接</a>
    <FuncationComponent name="FuncationComponent" />
    <ClassComponent name="ClassComponent" />
  </div>
);

render(jsx, document.getElementById('root'));
```

+
![image.png](https://upload-images.jianshu.io/upload_images/25820166-c5aa2c54a7df34c0.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

# 2. 'react-dom' 里面的 `render`

## 2.1 接受两个参数 jsx （vnode）和 原生element,我们打印vnode

```
// src\react\react-dom.ts

export function render(vnode:any, container:any) {
  console.log(vnode, 'vnode');
  // vnode -> node
  const node = createNode(vnode);

  // node -> container
  container.appendChild(node);
}
```

+
![image.png](https://upload-images.jianshu.io/upload_images/25820166-7d52b361a8cc9abd.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

+ 可以看到vnode 主要由 type,key,ref,props组成
+ vnode如果是`HTMLElement`， type 就是`HTMLElement`的类型
+ vnode如果是文本，则直接放入字符串
+ vnode如果是FunctionComponent,ClassComponent, type则是一个函数
+ ClassComponent组件的prototype上会有 `isReactComponent`属性，用来区分class组件和函数组件

## 2.2 `createNode` 将vnode 转换为node

```
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
```

+ 根据上面type,大致把组件分为三类,**HTMLElement**,**ReactComponent**,**textElement**
+ HTMLElement,直接使用 **document.createElement** 创建即可，然后继续遍历子元素,执行**render**，同时将props挂载在node上
+ ReactComponent,函数组件**直接执行**，类组件先**实例化**后，执行内部的**render**函数，将返回的jsx,当作参数递归执行**createNode**
+ textElement,直接使用`document.createTextNode`

## 2.3 类组件 `Component`

```
export function Component(props:any) {
  this.props = props;
}
Component.prototype.isReactComponent = {};

export default { Component };
```

+ 将props绑定到this中
+ 在prototype上标记自己是ReactComponet

# 3.最终结果

![image.png](https://upload-images.jianshu.io/upload_images/25820166-8cfaebb16caa00be.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)
[源码](https://github.com/shenqil/react-learn/tree/react%E6%BA%90%E7%A0%81%E5%88%9D%E6%8E%A2)
