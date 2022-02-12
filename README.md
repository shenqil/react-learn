# 1. react-router 使用

## 1.1 安装 `npm i react-router-dom`

## 1.2 基本使用

```
// src\main.tsx
import React from 'react';
import { render } from 'react-dom';
import {
  BrowserRouter, Routes, Route, Link,
} from 'react-router-dom';
import HomePage from './view/Home';
import Login from './view/Login';
import Product from './view/Product';
import Details from './view/Details';
import Error from './view/Error';

function App() {
  return (
    <div>
      <BrowserRouter>
        <div>
          <Link to="/"> home </Link>
          |
          <Link to="/login"> login </Link>
          |
          <Link to="/product"> product </Link>
          |
          <Link to="/product/123"> details </Link>
          |
        </div>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/product" element={<Product />}>
            <Route path="/product/:id" element={<Details />} />
          </Route>
          <Route path="*" element={<Error />} />
        </Routes>

      </BrowserRouter>
    </div>
  );
}

render(<App />, document.getElementById('root'));
```

## 1.3 history 模式webpack 需要开启 `historyApiFallback: true`

## 1.4 嵌套路由 使用 `Outlet`

```
// src\view\Product.tsx

import React from 'react';
import { Outlet } from 'react-router-dom';

export default function Product() {
  return (
    <div>
      product
      <Outlet />
    </div>
  );
}
```

# 2.react-route实现(以history模式来实现)

## 2.1 BrowserRouter 组件

+ 需要以history模式，提供navigator 以及 当前location
+ 这里使用 history 库，创建一个history作为navigator ，然后监听history.listen监听当前路由变化,并且存储在state中

+

```
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

```

## 2.2 Router 组件

+ 提供 navigator 用于 push,go,back等路由导航操作
+ 提供 location 代表当前路由的一些信息,path,params,query等
+ 他不关心你是history,还是hash,或者memory模式，只负责将接收到的navigator 和location ,通过context的方式传下去抹平不同模式的差异

+

```
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
```

## 2.3 Routes 组件

### 2.3.1 根据 children 里面的Route 得到路由配置,内部包含路由地址和React组件,类似于

+

```
[
  {
    path:'/product',
    element=ReactComponents,
    children:[
      {
          path:'/product/:id',
          element=ReactComponents,
      }
      // ...
    ]
  }

  // ... 
]
```

+ createRoutesFromChildren 得到上述的路由配置
+ 方式就是获取 Route 组件props里面传入的 path和element

```
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
      element: element.props.element,
      path: element.props.path,
    };

    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children);
    }

    routes.push(route);
  });

  return routes;
}
```

### 2.3.2 根据路由配置和当前路由,匹配出需要渲染的组件,得到类似于

```
[
  {
    params:{},
    pathname:'/product',
    route:{
          path:'/product',
          element=ReactComponents,
    }
  }
  //...
]
```

+ params 是匹配路由的参数
+ pathname 是以什么字符串匹配到的路由
+ route 是匹配到的路由配置
+ 路由上的多个组件，父组件在前面，子组件在后面
+ 具体匹配逻辑 在`matchRoutes`

### 2.3.3 `renderMatches` 渲染匹配出来的组件

+ 已知`matches.reduceRight`会从数组右到左执行reducer,reducer 第一个参数是上一个reducer 返回的值，第二个参数是当前值，最后一个index是元素在数组中的索引
+ `matchRoutes`匹配出来的路由顺序是父组件在前面，例如[parentComponent,childComponent]
+ `renderMatches`的做法是使用matches.reduceRight，那么第一次执行的必然是最后一个组件，这里是childComponent，然后reducer里面使用context包裹childComponent，并返回，后续reducer执行时，接受到上一个包裹组件，并且放在context的value中，包裹当前组件，并且返回,依此类推
+ 得到一个类似与下面的结构

```
<Context.Provider value={
  <Context.Provider value={null}>
    {childComponent}
  </Context.Provider>
}>
    {parentComponent}
</Context.Provider>
```

+ 因为Context会匹配最近的Context提供的值，所以父组件里面的Outlet,会拿到父组件的Provider Value，如果子组件还有子组件，也会依次拿到自己的子组件的值
+ 总而言之大佬的思维还是牛逼

+

```
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
```

## 2.4 Route 组件

+ 这个组件不渲染，主要作用是props接受用户传入的值
+ Routes 组件，会从Route 拿到props.path和props.element,从而得到路由配置
+ 感觉这里可以跟vue一样,用一个配置文件不更好，不知道大佬啥想法

+

```
export default function Route(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: PathRouteProps | LayoutRouteProps | IndexRouteProps,
): React.ReactElement | null {
  throw new Error('A <Route> is only ever to be used as the child of <Routes> element, '
  + 'never rendered directly. Please wrap your <Route> in a <Routes>.');
}
```

## 2.5 Outlet 组件

+ 已知 Routes  会将每个组件用Context包一层，并且Context里面存放着子组件
+ 又因为Context的就近原则，所以Outlet 只用拿Context的值，就能对应的子组件

+

```
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
```

## 2.7 Link组件

+ 已知 Router 存放着 navigator 和 location
+ Link只用拿到navigator 执行一下里面的方法

+

```
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
```

[源码](https://github.com/shenqil/react-learn/tree/react-router)
