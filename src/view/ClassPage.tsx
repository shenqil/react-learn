// src\view\ClassPage.tsx

import React, { Component } from 'react';
import { connect } from 'react-redux';

// eslint-disable-next-line react/prefer-stateless-function
class ClassPage extends Component {
  render(): React.ReactNode {
    console.log(this.props);
    // eslint-disable-next-line react/prop-types
    const { count, add, minus } = (this.props as any);
    return (
      <div>
        <p>{count}</p>
        <button onClick={() => add()} type="button">add</button>
        <button onClick={() => minus()} type="button">minus</button>
      </div>
    );
  }
}

export default connect(
  (count:number) => ({ count }),
  (dispatch) => {
    const add = () => dispatch({ type: 'ADD' });
    const minus = () => dispatch({ type: 'MINUS' });
    return {
      add,
      minus,
      dispatch,
    };
  },
)(ClassPage);
