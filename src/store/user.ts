// src\store\user.ts
import { Reducer } from 'redux';

export interface IUserStore {
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

export default userReducer;
