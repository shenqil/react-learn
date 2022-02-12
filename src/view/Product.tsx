// src\view\Product.tsx

import React from 'react';
// import { Outlet } from 'react-router-dom';
import { Outlet } from '../react-router';

export default function Product() {
  return (
    <div>
      product
      <Outlet />
    </div>
  );
}
