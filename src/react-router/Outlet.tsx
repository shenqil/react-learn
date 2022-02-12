import * as React from 'react';
import { OutletContext, RouteContext } from './context';

export function useOutlet(context?: unknown): React.ReactElement | null {
  const { outlet } = React.useContext(RouteContext);
  if (outlet) {
    return (
      <OutletContext.Provider value={context}>{outlet}</OutletContext.Provider>
    );
  }
  return outlet;
}

export interface OutletProps {
  context?: unknown;
}
export default function Outlet(props: OutletProps): React.ReactElement | null {
  return useOutlet(props.context);
}
