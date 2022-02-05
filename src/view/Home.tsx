import React, { Component } from 'react';

// eslint-disable-next-line react/prefer-stateless-function
class Home extends Component {
  componentDidMount() {
    console.log(this.props, 'home');
  }

  render() {
    return (
      <div>
        home
      </div>
    );
  }
}

export default Home;
