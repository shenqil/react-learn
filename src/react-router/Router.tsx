import * as React from 'react';
import type {
  Location,
} from 'history';
import {
  Action as NavigationType,
  parsePath,
} from 'history';

import type { Navigator } from './context';
import { NavigationContext, LocationContext } from './context';

export interface IRouterProps {
  children?: React.ReactNode;
  location: Partial<Location> | string;
  navigationType?: NavigationType;
  navigator: Navigator;
}
export default function Router({
  children = null,
  location: locationProp,
  navigationType = NavigationType.Pop,
  navigator,
}: IRouterProps):React.ReactElement | null {
  const navigationContext = React.useMemo(
    () => ({ navigator }),
    [navigator],
  );

  if (typeof locationProp === 'string') {
    // eslint-disable-next-line no-param-reassign
    locationProp = parsePath(locationProp);
  }

  const {
    pathname = '/',
    search = '',
    hash = '',
    state = '',
    key = 'default',
  } = locationProp;
  const location = React.useMemo(() => ({
    pathname,
    search,
    hash,
    state,
    key,
  }), [hash, key, pathname, search, state]);

  return (
    <NavigationContext.Provider value={navigationContext}>
      <LocationContext.Provider
        value={{ location, navigationType }}
      >
        {children}
      </LocationContext.Provider>
    </NavigationContext.Provider>
  );
}
