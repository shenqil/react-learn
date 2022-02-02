// src\store\user.ts

import { createStore, Reducer, applyMiddleware } from 'redux';
import reduxThunk from 'redux-thunk';
import reduxLogger from 'redux-logger';

// import { Reducer } from 'redux';
// import { createStore } from '../redux/index';

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
