// src\react-redux\index.tsx

import React, { useContext, useLayoutEffect, useReducer } from 'react';

// 创建一个用于存放store的上下文
const Context = React.createContext(undefined);
const StoreProvider = Context.Provider;

// 定义自己的 Provider
export function Provider({ store, children }:any) {
  return <StoreProvider value={store}>{children}</StoreProvider>;
}

// 自定义刷新 hooks
function useForceUpdate() {
  const [,forceUpdate] = useReducer((i) => i + 1, 0);

  return () => forceUpdate();
}

// 自定义connect
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

export default {};
