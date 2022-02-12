import * as React from 'react';
import type {
  Location,
} from 'history';
import Outlet from './Outlet';
import { RouteObject, RouteContext, LocationContext } from './context';
import matchRoutes, { RouteMatch } from './match';

const joinPaths = (paths: string[]): string => paths.join('/').replace(/\/\/+/g, '/');

export function renderMatches(
  matches:RouteMatch[] | null,
  parentMatches:RouteMatch[] = [],
):React.ReactElement | null{
  if (matches === null) return null;

  return matches.reduceRight((outlet, match, index) => (
    <RouteContext.Provider
      value={{
        outlet,
        matches: parentMatches.concat(matches.slice(0, index + 1)),
      }}
    >
      {
           match.route.element !== undefined ? match.route.element : <Outlet />
      }
    </RouteContext.Provider>
  ), null as React.ReactElement | null);
}

export function useRoutes(
  routes:RouteObject[],
):React.ReactElement | null{
  console.log(routes, 'routes');

  const { matches: parentMatches } = React.useContext(RouteContext);
  const routeMatch = parentMatches[parentMatches.length - 1];
  const parentParams = routeMatch ? routeMatch.params : {};
  // const parentPathname = routeMatch ? routeMatch.pathname : '/';
  const parentPathnameBase = routeMatch ? routeMatch.pathnameBase : '/';
  // const parentRoute = routeMatch && routeMatch.route;
  // const parentPath = (parentRoute && parentRoute.path) || '';

  const { location } = React.useContext(LocationContext);

  if (!location) {
    return null;
  }

  const matches = matchRoutes(routes, location);
  return renderMatches(
    matches
      && matches.map((match) => ({
        ...match,
        params: { ...parentParams, ...match.params },
        pathname: joinPaths([parentPathnameBase, match.pathname]),
        pathnameBase:
            match.pathnameBase === '/'
              ? parentPathnameBase
              : joinPaths([parentPathnameBase, match.pathnameBase]),
      })),
    parentMatches,
  );
}

export function createRoutesFromChildren(
  children:React.ReactNode,
):RouteObject[] {
  const routes:RouteObject[] = [];

  React.Children.forEach(children, (element) => {
    if (!React.isValidElement(element)) {
      return;
    }

    if (element.type === React.Fragment) {
      routes.push(
        ...createRoutesFromChildren(element.props.children),
      );
      return;
    }

    const route:RouteObject = {
      caseSensitive: element.props.caseSensitive,
      element: element.props.element,
      index: element.props.index,
      path: element.props.path,
    };

    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children);
    }

    routes.push(route);
  });

  return routes;
}

export interface RoutesProps {
  children?: React.ReactNode;
  location?: Partial<Location> | string;
}
export default function Routes({
  children,
}: RoutesProps): React.ReactElement | null {
  return useRoutes(createRoutesFromChildren(children));
}
