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
