import React from 'react';
import { render } from 'react-dom';
import UserPage from './view/userPage';

function App() {
  return (
    <div>
      <UserPage />
    </div>
  );
}

render(<App />, document.getElementById('root'));
