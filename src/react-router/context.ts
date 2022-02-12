import * as React from 'react';
import type {
  History,
  Location,
} from 'history';
import {
  Action as NavigationType,
} from 'history';

export type Navigator = Pick<History, 'go' | 'push' | 'replace' | 'createHref'>;
export interface INavigationContextObject {
  navigator: Navigator;
}
export const NavigationContext = React.createContext<INavigationContextObject>(null!);

export interface ILocationContextObject {
  location: Location | null;
  navigationType: NavigationType;
}
export const LocationContext = React.createContext<ILocationContextObject>(null!);

export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined;
};
export interface RouteObject {
  caseSensitive?: boolean;
  children?: RouteObject[];
  element?: React.ReactNode;
  index?: boolean;
  path?: string;
}
export interface RouteMatch<ParamKey extends string = string> {
  params: Params<ParamKey>;
  pathname: string;
  pathnameBase: string;
  route: RouteObject;
}
export interface IRouteContextObject {
  outlet: React.ReactElement | null;
  matches: RouteMatch[];
}
export const RouteContext = React.createContext<IRouteContextObject>({
  outlet: null,
  matches: [],
});

export const OutletContext = React.createContext<unknown>(null);

export default {
  NavigationContext, LocationContext, RouteContext, OutletContext,
};
