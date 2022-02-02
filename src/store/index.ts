// src\store\index.ts

import { createStore, applyMiddleware, combineReducers } from 'redux';
// import reduxThunk from 'redux-thunk';
// import reduxLogger from 'redux-logger';

// import { createStore, applyMiddleware } from '../redux/index';
import reduxLogger from '../redux/redux-logger';
import reduxThunk from '../redux/redux-thunk';

import userReducer from './user';
import countReducer from './count';

export default createStore(
  combineReducers({
    userReducer,
    countReducer,
  }),
  applyMiddleware(reduxThunk, reduxLogger),
);
