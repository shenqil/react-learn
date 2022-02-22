/* eslint-disable react/destructuring-assignment */
// import React, { Component } from 'react';
// import { render } from 'react-dom';
import React from 'react';
import { render } from './react/react-dom';
import { Component } from './react/Component';
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
    一段普通文本
    <FuncationComponent name="FuncationComponent" />
    <ClassComponent name="ClassComponent" />
  </div>
);

render(jsx, document.getElementById('root'));
