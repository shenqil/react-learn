# 1. react-router 使用
## 1.1 安装 `npm i react-router-dom`
## 1.2 基本使用
```
// src\main.tsx
import React from 'react';
import { render } from 'react-dom';
import {
  BrowserRouter, Routes, Route, Link,
} from 'react-router-dom';
import HomePage from './view/Home';
import Login from './view/Login';
import Product from './view/Product';
import Details from './view/Details';
import Error from './view/Error';

function App() {
  return (
    <div>
      <BrowserRouter>
        <div>
          <Link to="/"> home </Link>
          |
          <Link to="/login"> login </Link>
          |
          <Link to="/product"> product </Link>
          |
          <Link to="/product/123"> details </Link>
          |
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product" element={<Product />}>
            <Route path="/product/:id" element={<Details />} />
          </Route>
          <Route path="*" element={<Error />} />
        </Routes>

      </BrowserRouter>
    </div>
  );
}

render(<App />, document.getElementById('root'));
```
## 1.3 history 模式webpack 需要开启 `historyApiFallback: true`
## 1.4 嵌套路由 使用 `Outlet`
```
// src\view\Product.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Product() {
  return (
    <div>
      product
      <Outlet />
    </div>
  );
}
```
