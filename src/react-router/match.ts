import { RouteObject } from './context';

const joinPaths = (paths: string[]): string => paths.join('/').replace(/\/\/+/g, '/');

export function compilePath(
  path: string,
  caseSensitive = false,
  end = true,
): [RegExp, string[]] {
  const paramNames: string[] = [];
  let regexpSource = `^${
    path
      .replace(/\/*\*?$/, '') // Ignore trailing / and /*, we'll handle it below
      .replace(/^\/*/, '/') // Make sure it has a leading /
      .replace(/[\\.*+^$?{}|()[\]]/g, '\\$&') // Escape special regex chars
      .replace(/:(\w+)/g, (_: string, paramName: string) => {
        paramNames.push(paramName);
        return '([^\\/]+)';
      })}`;

  if (path.endsWith('*')) {
    paramNames.push('*');
    regexpSource
      += path === '*' || path === '/*'
        ? '(.*)$' // Already matched the initial /, just match the rest
        : '(?:\\/(.+)|\\/*)$'; // Don't include the / in params["*"]
  } else {
    regexpSource += end
      ? '\\/*$' // When matching to the end, ignore trailing slashes
      : '(?:\\b|\\/|$)';// Otherwise, match a word boundary or a proceeding /. The word boundary restricts
    // parent routes to matching only their own words and nothing more, e.g. parent
    // route "/home" should not match "/home2".
  }

  const matcher = new RegExp(regexpSource, caseSensitive ? undefined : 'i');

  return [matcher, paramNames];
}

const paramRe = /^:\w+$/;
const dynamicSegmentValue = 3;
const indexRouteValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s: string) => s === '*';
function computeScore(path:string, index:boolean | undefined):number {
  const segments = path.split('/');
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }

  if (index) {
    initialScore += indexRouteValue;
  }

  return segments
    .filter((s) => !isSplat(s))
    .reduce(
      (score, segment) => score
        // eslint-disable-next-line no-nested-ternary
        + (paramRe.test(segment)
          ? dynamicSegmentValue
          : segment === ''
            ? emptySegmentValue
            : staticSegmentValue),
      initialScore,
    );
}

interface RouteMeta {
  relativePath: string;
  caseSensitive: boolean;
  childrenIndex: number;
  route: RouteObject;
}

interface RouteBranch {
  path: string;
  score: number;
  routesMeta: RouteMeta[];
}
function flattenRoutes(
  routes: RouteObject[],
  branches: RouteBranch[] = [],
  parentsMeta: RouteMeta[] = [],
  parentPath = '',
) {
  routes.forEach((route, index) => {
    const meta:RouteMeta = {
      relativePath: route.path || '',
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route,
    };

    meta.relativePath = meta.relativePath.slice(parentPath.length);

    const routesMeta = parentsMeta.concat(meta);
    const path = route.path || '';

    if (route.children && route.children.length) {
      flattenRoutes(route.children, branches, routesMeta, path);
    }

    branches.push({ path, score: computeScore(path, route.index), routesMeta });
  });

  return branches;
}

function compareIndexes(a: number[], b: number[]): number {
  const siblings = a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);

  return siblings
    ? a[a.length - 1] - b[b.length - 1]
    // If two routes are siblings, we should try to match the earlier sibling
    // first. This allows people to have fine-grained control over the matching
    // behavior by simply putting routes with identical paths in the order they
    // want them tried.

    : 0;
  // Otherwise, it doesn't really make sense to rank non-siblings by index,
  // so they sort equally.
}

function rankRouteBranches(branches: RouteBranch[]): void {
  branches.sort((a, b) => (a.score !== b.score
    ? b.score - a.score // Higher score first
    : compareIndexes(
      a.routesMeta.map((meta) => meta.childrenIndex),
      b.routesMeta.map((meta) => meta.childrenIndex),
    )));
}

function matchRouteBranch<ParamKey extends string = string>(
  branch: RouteBranch,
  pathname: string,
): RouteMatch<ParamKey>[] | null {
  const { routesMeta } = branch;

  const matchedParams = {};
  let matchedPathname = '/';
  const matches: RouteMatch[] = [];
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < routesMeta.length; ++i) {
    const meta = routesMeta[i];
    const end = i === routesMeta.length - 1;
    const remainingPathname = matchedPathname === '/'
      ? pathname
      : pathname.slice(matchedPathname.length) || '/';
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    const match = matchPath(
      { path: meta.relativePath, caseSensitive: meta.caseSensitive, end },
      remainingPathname,
    );

    if (!match) return null;

    Object.assign(matchedParams, match.params);

    const { route } = meta;

    matches.push({
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: joinPaths([matchedPathname, match.pathnameBase]),
      route,
    });

    if (match.pathnameBase !== '/') {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }

  return matches;
}

export interface PathPattern<Path extends string = string> {
  path: Path;
  caseSensitive?: boolean;
  end?: boolean;
}

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

export interface PathMatch<ParamKey extends string = string> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The portion of the URL pathname that was matched before child routes.
   */
  pathnameBase: string;
  /**
   * The pattern that was used to match.
   */
  pattern: PathPattern;
}

type ParamParseFailed = { failed: true };

type ParamParseSegment<Segment extends string> =
  // Check here if there exists a forward slash in the string.
  Segment extends `${infer LeftSegment}/${infer RightSegment}`
    ? // If there is a forward slash, then attempt to parse each side of the
  // forward slash.
    ParamParseSegment<LeftSegment> extends infer LeftResult
      ? ParamParseSegment<RightSegment> extends infer RightResult
        ? LeftResult extends string
          ? // If the left side is successfully parsed as a param, then check if
        // the right side can be successfully parsed as well. If both sides
        // can be parsed, then the result is a union of the two sides
        // (read: "foo" | "bar").
          RightResult extends string
            ? LeftResult | RightResult
            : LeftResult
          : // If the left side is not successfully parsed as a param, then check
          // if only the right side can be successfully parse as a param. If it
          // can, then the result is just right, else it's a failure.
          RightResult extends string
            ? RightResult
            : ParamParseFailed
        : ParamParseFailed
      : // If the left side didn't parse into a param, then just check the right
      // side.
      ParamParseSegment<RightSegment> extends infer RightResult
        ? RightResult extends string
          ? RightResult
          : ParamParseFailed
        : ParamParseFailed
    : // If there's no forward slash, then check if this segment starts with a
    // colon. If it does, then this is a dynamic segment, so the result is
    // just the remainder of the string. Otherwise, it's a failure.
    Segment extends `:${infer Remaining}`
      ? Remaining
      : ParamParseFailed;

type ParamParseKey<Segment extends string> =
  ParamParseSegment<Segment> extends string
    ? ParamParseSegment<Segment>
    : string;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function safelyDecodeURIComponent(value: string, _paramName: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}
export function matchPath<
  ParamKey extends ParamParseKey<Path>,
  Path extends string,
>(
  pattern: PathPattern<Path> | Path,
  pathname: string,
): PathMatch<ParamKey> | null {
  if (typeof pattern === 'string') {
    // eslint-disable-next-line no-param-reassign
    pattern = { path: pattern, caseSensitive: false, end: true };
  }

  const [matcher, paramNames] = compilePath(
    pattern.path,
    pattern.caseSensitive,
    pattern.end,
  );

  const match = pathname.match(matcher);
  if (!match) return null;

  const matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, '$1');
  const captureGroups = match.slice(1);
  const params: Params = paramNames.reduce<Mutable<Params>>(
    (memo, paramName, index) => {
      // We need to compute the pathnameBase here using the raw splat value
      // instead of using params["*"] later because it will be decoded then
      if (paramName === '*') {
        const splatValue = captureGroups[index] || '';
        pathnameBase = matchedPathname
          .slice(0, matchedPathname.length - splatValue.length)
          .replace(/(.)\/+$/, '$1');
      }

      // eslint-disable-next-line no-param-reassign
      memo[paramName] = safelyDecodeURIComponent(
        captureGroups[index] || '',
        paramName,
      );
      return memo;
    },
    {},
  );

  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern,
  };
}

export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined;
};
export interface RouteMatch<ParamKey extends string = string> {
  params: Params<ParamKey>;
  pathname: string;
  pathnameBase: string;
  route: RouteObject;
}
export default function matchRoutes(
  routes: RouteObject[],
  locationArg: Partial<Location>,
): RouteMatch[] | null {
  const { pathname } = locationArg;

  const branches = flattenRoutes(routes);
  rankRouteBranches(branches);
  console.log(branches, 'branches');
  let matches = null;
  // eslint-disable-next-line no-plusplus
  for (let i = 0; matches == null && i < branches.length; ++i) {
    matches = matchRouteBranch(branches[i], pathname || '');
  }

  console.log(matches, pathname, 'matches');

  return matches;
}
