# 1.react-redux使用

## 1.1 安装

`npm i redux`
`npm i react-redux`

## 1.2 创建一个store

```
// src\store\index.ts

import { createStore, Action } from 'redux';

function countReducer(count:number = 0, action:Action) {
  switch (action.type) {
    case 'ADD':
      return count + 1;

    case 'MINUS':
      return count - 1;
    default:
      return count;
  }
}

export default createStore(countReducer);
```

## 1.3 **Provider** 提供给全局组件使用

```
// src\main.tsx

import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import store from './store';
import ClassPage from './view/ClassPage';

function App() {
  return (
    <div>
      <Provider store={store}>
        <ClassPage />
      </Provider>
    </div>
  );
}

render(<App />, document.getElementById('root'));
```

## 1.4 子class 组件使用

```
// src\view\ClassPage.tsx

import React, { Component } from 'react';
import { connect } from 'react-redux';

// eslint-disable-next-line react/prefer-stateless-function
class ClassPage extends Component {
  render(): React.ReactNode {
    console.log(this.props);
    // eslint-disable-next-line react/prop-types
    const { count, add, minus } = (this.props as any);
    return (
      <div>
        <p>{count}</p>
        <button onClick={() => add()} type="button">add</button>
        <button onClick={() => minus()} type="button">minus</button>
      </div>
    );
  }
}

export default connect(
  (count:number) => ({ count }),
  (dispatch) => {
    const add = () => dispatch({ type: 'ADD' });
    const minus = () => dispatch({ type: 'MINUS' });
    return {
      add,
      minus,
      dispatch,
    };
  },
)(ClassPage);

```

# 2.实现自己的 **react-redux**

```
// src\react-redux\index.tsx

import React, { useContext, useLayoutEffect, useReducer } from 'react';

// 创建一个用于存放store的上下文
const Context = React.createContext(undefined);
const StoreProvider = Context.Provider;

export function Provider({ store, children }:any) {
  return <StoreProvider value={store}>{children}</StoreProvider>;
}

function useForceUpdate() {
  const [,forceUpdate] = useReducer((i) => i + 1, 0);

  return () => forceUpdate();
}
// eslint-disable-next-line max-len
export const connect = (mapStateToProps:any, mapDispatchToProps:any) => (WrappedComponent:any) => (props:any) => {
  const store = useContext(Context) as any;

  const forceUpdate = useForceUpdate();

  const stateProps = mapStateToProps(store.getState());

  let dispatchProps:any = {};

  if (typeof mapDispatchToProps === 'function') {
    dispatchProps = mapDispatchToProps(store.dispatch);
  } else {
    // eslint-disable-next-line no-restricted-syntax
    for (const key in mapDispatchToProps) {
      if (Object.prototype.hasOwnProperty.call(mapDispatchToProps, key)) {
        dispatchProps[key] = (...args:any) => store.dispatch(mapDispatchToProps[key](...args));
      }
    }
  }

  useLayoutEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate();
    });
    return () => unsubscribe();
  }, [forceUpdate, store]);

  // eslint-disable-next-line react/jsx-props-no-spreading
  return <WrappedComponent {...props} {...stateProps} {...dispatchProps} />;
};

export default {};
```

# 3.hook 中使用 react-redux

```
import React, { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';

export default function FunctionPage() {
  const num = useSelector((count:number) => count);
  const dispatch = useDispatch();

  const add = useCallback(() => {
    dispatch({
      type: 'ADD',
    });
  }, [dispatch]);

  return (
    <div>
      <p>{num}</p>
      <button onClick={() => add()} type="button">add</button>
    </div>
  );
}
```

# 4 hooks **useSelector** **useDispatch**实现

```
// src\react-redux\index.tsx

// hooks
export function useSelector(selector:any) {
  const forceUpdate = useForceUpdate();
  const store = useContext(Context) as any;
  const selectorState = selector(store.getState());

  useLayoutEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate();
    });
    return () => unsubscribe();
  }, [forceUpdate, store]);

  return selectorState;
}

export function useDispatch() {
  const store = useContext(Context) as any;

  return store.dispatch;
}
```
