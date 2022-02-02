# 1.Redux 使用
## 1.1 安装 `npm i redux`

## 1.2 创建 一个userStore
```
// src\store\user.ts

import { createStore, Reducer } from 'redux';

interface IUserStore {
  name:string
}

const userReducer:Reducer<IUserStore> = (store = { name: 'xiaoming' }, action) => {
  switch (action.type) {
    case 'change':
      return {
        ...store,
        name: action.payload,
      };

    default:
      return store;
  }
};

export default createStore(userReducer);

```

## 1.3 创建一个UserPage
```
// src\view\userPage.tsx

import React, { FC, useEffect, useState } from 'react';
import store from '../store/user';

const UserPage:FC = () => {
  const [,forceUpdateDispatch] = useState(0);

  function random() {
    store.dispatch({
      type: 'change',
      payload: Math.random().toString(16).substring(2),
    });
  }

  useEffect(() => {
    store.subscribe(() => {
      forceUpdateDispatch(Math.random());
    });
  }, []);

  return (
    <div>
      <p>{store.getState().name}</p>
      <button onClick={() => random()} type="button">改变名称</button>
    </div>
  );
};

export default UserPage;

```

# 2.Redux 实现
![image.png](https://upload-images.jianshu.io/upload_images/25820166-0be11d1262499171.png?imageMogr2/auto-orient/strip%7CimageView2/2/w/1240)

```
// src\redux\index.ts

export const createStore = (reducer:any) => {
  let current: undefined;
  const currentListeners:Array<() => void> = [];

  const dispatch = (action:any) => {
    current = reducer(current, action);
    currentListeners.forEach((listener) => listener());
    return action;
  };

  function getState() {
    return current;
  }

  function subscribe(listener: () => void) {
    currentListeners.push(listener);
    return () => {
      const index = currentListeners.indexOf(listener);
      currentListeners.splice(index);
    };
  }

  dispatch({
    type: `init--${Date.now()}`,
  });

  return {
    dispatch,
    getState,
    subscribe,
  };
};

export default {
  createStore,
};


```

# 3.使用中间件
## 3.1 安装
`npm i redux-thunk  `
`npm i redux-logger`

## 3.2 使用
```
// src\store\user.ts

import { createStore, Reducer, applyMiddleware } from 'redux';
import reduxThunk from 'redux-thunk';
import reduxLogger from 'redux-logger';

interface IUserStore {
  name:string
}

const userReducer:Reducer<IUserStore> = (store = { name: 'xiaoming' }, action) => {
  switch (action.type) {
    case 'change':
      return {
        ...store,
        name: action.payload,
      };

    default:
      return store;
  }
};

export default createStore(userReducer, applyMiddleware(reduxThunk, reduxLogger));
```

# 4.实现 **applyMiddleware**
## 4.1 修改 createStore  接收 `enhancer`
```
// src\redux\createStore.ts

export const createStore = (reducer:any, enhancer?:any) => {
  if (enhancer) {
    return enhancer(createStore)(reducer);
  }

  let current: undefined;
  const currentListeners:Array<() => void> = [];

  const dispatch = (action:any) => {
    current = reducer(current, action);
    currentListeners.forEach((listener) => listener());
    return action;
  };

  function getState() {
    return current;
  }

  function subscribe(listener: () => void) {
    currentListeners.push(listener);
    return () => {
      const index = currentListeners.indexOf(listener);
      currentListeners.splice(index);
    };
  }

  dispatch({
    type: `init--${Date.now()}`,
  });

  return {
    dispatch,
    getState,
    subscribe,
  };
};

export default createStore;

```

## 4.2 增加 `applyMiddleware`
```
// src\redux\applyMiddleware.ts

function compose(...funcs:Array<Function>):Function {
  if (!funcs.length) {
    return (arg:any) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((preFunc, curFunc) => (...args:any) => preFunc(curFunc(...args)));
}

export const applyMiddleware = function (...middlewares:Array<Function>) {
  return (createStore:any) => (reducer:any) => {
    const store = createStore(reducer);
    let { dispatch } = store;
    const midApi = {
      getState: store.getState,
      dispatch: (action:any, ...args:any) => dispatch(action, ...args),
    };

    const middlewareChain = (middlewares.map(
      (middleware) => middleware(midApi),
    ) as Array<Function>);

    // 得到加强版的dispatch
    dispatch = compose(...middlewareChain)(store.dispatch);

    return {
      ...store,
      dispatch,
    };
  };
};

export default applyMiddleware;

```
# 5. redux-logger 中间件实现
```
// src\redux\redux-logger.ts

function logger({ getState }:any) {
  return (next:Function) => (action:any) => {
    console.log('pre-----:', getState());
    const returnValue = next(action);
    console.log('dispatch-----:', action.type);
    console.log('cur-----:', getState());
    return returnValue;
  };
}

export default logger;

```

# 6.redux-thunk 中间件实现
```
// src\redux\redux-thunk.ts

function thunk({ dispatch, getState }:any) {
  return (next:Function) => (action:any) => {
    if (typeof action === 'function') {
      return action(dispatch, getState);
    }

    const returnValue = next(action);
    return returnValue;
  };
}

export default thunk;

```

# 7. combineReducers 基本用法
## 7.1 引入
```
// src\store\index.ts

import { createStore, applyMiddleware, combineReducers } from 'redux';
import reduxThunk from 'redux-thunk';
import reduxLogger from 'redux-logger';

import userReducer from './user';
import countReducer from './count';

export default createStore(
  combineReducers({
    userReducer,
    countReducer,
  }),
  applyMiddleware(reduxThunk, reduxLogger),
);

```

## 7.2 修改值
```
// src\view\userPage.tsx

import React, { FC, useEffect, useState } from 'react';
import store from '../store';

const UserPage:FC = () => {
  const [, forceUpdateDispatch] = useState(0);

  function random() {
    store.dispatch({
      type: 'change',
      payload: Math.random().toString(16).substring(2),
    });
  }

  function asyncRandom() {
    store.dispatch((((dispatch:any) => {
      setTimeout(() => {
        dispatch({
          type: 'change',
          payload: Math.random().toString(16).substring(2),
        });
      }, 1000);
    }) as any));
  }

  function add() {
    store.dispatch({
      type: 'add',
      payload: 1,
    });
  }

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdateDispatch(Math.random());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <p>{store.getState().userReducer.name}</p>
      <button onClick={() => random()} type="button">改变名称</button>
      <button onClick={() => asyncRandom()} type="button">异步改变名称</button>
      <p>{store.getState().countReducer}</p>
      <button onClick={() => add()} type="button">add</button>
    </div>
  );
};

export default UserPage;

```

# 8.combineReducers 实现
```
// src\redux\combineReducers.ts

export function combineReducers(reducers:any) {
  return function combination(state:any = {}, action:any) {
    const nextState:any = {};
    let hasChanged = true;
    // eslint-disable-next-line no-restricted-syntax
    for (const key in reducers) {
      if (Object.prototype.hasOwnProperty.call(reducers, key)) {
        const reducer = reducers[key];
        nextState[key] = reducer(state[key], action);
        hasChanged = hasChanged || nextState[key] !== state[key];
      }
    }

    hasChanged = hasChanged || Object.keys(nextState).length !== Object.keys(state).length;

    return hasChanged ? nextState : state;
  };
}

export default combineReducers;

```

*** 
**总结**
## 1.redux 是一个典型的发布订阅模式
## 2.中间件是用来增加dispatch,实现是一个函数嵌套着两层函数的函数，
### 2.1例如，一个中间件 const mid = (midApi)=> (next)=>(action)=>next(action)
### 2.2第一次执行形成闭包，保存了midApi ，执行完后 mid = (next)=>(action)=>next(action)
### 2.3第二次执行是在compose中，compose(...middlewareChain)形成了 (args)=>mid1(mid2(args))的函数,然后执行该函数(store.dispatch)=>mid1(mid2(store.dispatch))，mid2执行，闭包next保存了 store.dispatch, mid1执行next闭包保存了mid2，此时mid = (action)=>next(action),这个mid就是增加版的dispatch
### 2.4用户调用时，依次(action)=>next(action)，直到执行store.dispatch(action)
## 3.combineReducers的原理是,依次执行reducers，合并为一个大的reducer


