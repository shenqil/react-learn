import React, { MouseEvent, useContext } from 'react';
import { NavigationContext } from './context';

export default function Link({ to, children }:any) {
  const navigation = useContext(NavigationContext);

  const handle = (e:MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    navigation.navigator.push(to);
  };
  return <a href={to} onClick={handle}>{children}</a>;
}
