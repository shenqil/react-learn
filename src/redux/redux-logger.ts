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
