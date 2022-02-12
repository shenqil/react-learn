import * as React from 'react';
import { createBrowserHistory, BrowserHistory } from 'history';
import Router from './Router';

export interface BrowserRouterProps {
  children?: React.ReactNode;
  window?: Window;
}
export default function BrowserRouter({
  children,
  window,
}:BrowserRouterProps) {
  const historyRef = React.useRef<BrowserHistory>();
  if (!historyRef.current) {
    historyRef.current = createBrowserHistory({ window });
  }

  const history = historyRef.current;
  const [state, setState] = React.useState({
    action: history.action,
    location: history.location,
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      location={state.location}
      navigationType={state.action}
      navigator={history}
    >
      {children}
    </Router>
  );
}
