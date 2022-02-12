// src\main.tsx
import React from 'react';
import { render } from 'react-dom';
// import {
//   BrowserRouter, Routes, Route, Link,
// } from 'react-router-dom';
import {
  BrowserRouter, Routes, Route, Link,
} from './react-router';
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
          <Route path="/error" element={<Error />} />
        </Routes>

      </BrowserRouter>
    </div>
  );
}

render(<App />, document.getElementById('root'));
