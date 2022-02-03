// src\main.tsx

import React from 'react';
import { render } from 'react-dom';
// import { Provider } from 'react-redux';
import { Provider } from './react-redux';
import store from './store';
import ClassPage from './view/ClassPage';
import FunctionPage from './view/FunctionPage';

function App() {
  return (
    <div>
      <Provider store={store}>
        <ClassPage />
        <FunctionPage />
      </Provider>
    </div>
  );
}

render(<App />, document.getElementById('root'));
