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
