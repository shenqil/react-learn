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
