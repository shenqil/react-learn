export function Component<P>(this:{ props:P }, props:P) {
  this.props = props;
}
Component.prototype.isReactComponent = {};

export default { Component };
