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
