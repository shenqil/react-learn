/* eslint-disable react/destructuring-assignment */
// import React, {
//   Component, useState, useReducer, useEffect, useLayoutEffect,
// } from 'react';
// import { render } from 'react-dom';
import React from 'react';
import { render } from './react/react-dom';
import {
  Component, useState,
} from './react';
import './index.scss';

interface IProps{
  name:string
}

function FuncationComponent(props:IProps) {
  const [count, setCount] = useState(0);
  const list = [1, 2, 3, 4];

  return (
    <div className="border">
      <p>{props.name}</p>
      <button onClick={() => setCount(count + 1)} type="button">{count}</button>
      <ul>
        {
          list
            .filter((item) => !(count % 2 === 1 && item === 3))
            .map((item) => <li key={item}>{item}</li>)
        }
      </ul>
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
    <h1>react 深入源码1</h1>
    <a href="https://www.baidu.com/">链接</a>
    <FuncationComponent name="FuncationComponent" />
    <ClassComponent name="ClassComponent" />
  </div>
);

render(jsx, document.getElementById('root'));
