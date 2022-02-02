// src\view\userPage.tsx

import React, { FC, useEffect, useState } from 'react';
import store from '../store/user';

const UserPage:FC = () => {
  const [,forceUpdateDispatch] = useState(0);

  function random() {
    store.dispatch({
      type: 'change',
      payload: Math.random().toString(16).substring(2),
    });
  }

  useEffect(() => {
    store.subscribe(() => {
      forceUpdateDispatch(Math.random());
    });
  }, []);

  return (
    <div>
      <p>{store.getState().name}</p>
      <button onClick={() => random()} type="button">改变名称</button>
    </div>
  );
};

export default UserPage;
