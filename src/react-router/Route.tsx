import * as React from 'react';

export interface PathRouteProps {
  caseSensitive?: boolean;
  children?: React.ReactNode;
  element?: React.ReactNode | null;
  index?: false;
  path: string;
}

export interface LayoutRouteProps {
  children?: React.ReactNode;
  element?: React.ReactNode | null;
}

export interface IndexRouteProps {
  element?: React.ReactNode | null;
  index: true;
}

export default function Route(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: PathRouteProps | LayoutRouteProps | IndexRouteProps,
): React.ReactElement | null {
  throw new Error('A <Route> is only ever to be used as the child of <Routes> element, '
  + 'never rendered directly. Please wrap your <Route> in a <Routes>.');
}
