import { Reducer } from 'redux';

const countReducer:Reducer<number> = (store = 0, action) => {
  switch (action.type) {
    case 'add':
      return action.payload + store;

    default:
      return store;
  }
};

export default countReducer;
