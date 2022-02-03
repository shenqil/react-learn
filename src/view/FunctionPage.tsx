import React, { useCallback } from 'react';
// import { useSelector, useDispatch } from 'react-redux';
import { useSelector, useDispatch } from '../react-redux';

export default function FunctionPage() {
  const num = useSelector((count:number) => count);
  const dispatch = useDispatch();

  const add = useCallback(() => {
    dispatch({
      type: 'ADD',
    });
  }, [dispatch]);

  return (
    <div>
      <p>{num}</p>
      <button onClick={() => add()} type="button">add</button>
    </div>
  );
}
