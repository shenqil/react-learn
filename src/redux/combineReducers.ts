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
