import React, { useEffect } from 'react';
import { StaticRouter, useHistory, useLocation, Switch, Route } from 'react-router';
import { BrowserRouter } from 'react-router-dom';
import { useEpiserver } from '../Hooks/Context';
export const Router = (props) => {
    const epi = useEpiserver();
    if (epi.isServerSideRendering()) {
        const staticRouterProps = {
            basename: props.basename,
            context: props.context,
            location: props.location
        };
        return React.createElement(StaticRouter, { ...staticRouterProps }, props.children);
    }
    const browserRouterProps = {
        basename: props.basename,
        forceRefresh: props.forceRefresh,
        getUserConfirmation: props.getUserConfirmation,
        keyLength: props.keyLength
    };
    if (epi.isInEditMode() || epi.isEditable())
        return React.createElement(BrowserRouter, { ...browserRouterProps }, props.children);
    return React.createElement(BrowserRouter, { ...browserRouterProps },
        React.createElement(ElementNavigation, null, props.children));
};
Router.displayName = "Optimizely CMS: Router";
export default Router;
const ElementNavigation = (props) => {
    const history = useHistory();
    const location = useLocation();
    const epi = useEpiserver();
    const config = epi.config();
    useEffect(() => {
        if (epi.isInEditMode() || epi.isServerSideRendering()) {
            if (epi.isDebugActive())
                console.debug('ElementNavigation: Edit mode, or SSR, so not attaching events');
            return;
        }
        else {
            if (epi.isDebugActive())
                console.debug('ElementNavigation: Enabling catch-all click handling for navigation');
        }
        const onWindowClick = (event) => {
            const target = event.target;
            const currentUrl = new URL(window.location.href);
            let newPath = '';
            // Loop parents till we find the link
            let link = target;
            while (link.parentElement && link.tagName.toLowerCase() !== 'a')
                link = link.parentElement;
            // If we have a link, see if we need to navigate
            if (link.tagName.toLowerCase() === 'a') {
                const targetUrl = new URL(link.href, currentUrl);
                // Only act if we remain on the same domain
                if (targetUrl.origin === currentUrl.origin) {
                    newPath = targetUrl.pathname;
                }
            }
            // Do not navigate to the same page
            if (newPath === location.pathname) {
                if (config.enableDebug)
                    console.debug('ElementNavigation: Ignoring navigation to same path');
                event.preventDefault();
                return false;
            }
            // Navigate to the new path
            if (newPath) {
                if (config.basePath && newPath.substr(0, config.basePath.length) === config.basePath) {
                    newPath = newPath.substr(config.basePath.length);
                    if (newPath.substr(0, 1) !== '/')
                        newPath = '/' + newPath; // Ensure we've an absolute path
                }
                history.push(newPath);
                event.preventDefault();
                return false;
            }
        };
        try {
            window.scrollTo(0, 0);
        }
        catch (e) {
            if (epi.isDebugActive())
                console.warn('ElementNavigation: Failed to scroll to top');
        }
        document.addEventListener('click', onWindowClick);
        return () => {
            if (epi.isDebugActive())
                console.debug('ElementNavigation: Removing catch-all click handling for navigation');
            document.removeEventListener('click', onWindowClick);
        };
    });
    return props.children;
};
ElementNavigation.displayName = "Optimizely CMS: Generic click event handler";
export const RoutedContent = (props) => {
    const ctx = useEpiserver();
    const switchProps = { location: props.location };
    return React.createElement(Switch, { ...switchProps },
        props.children,
        (props.config || []).map((item, idx) => createRouteNode(item, props.basePath, `${props.keyPrefix}-route-${idx}`, ctx)));
};
RoutedContent.displayName = "Optimizely CMS: Route container";
function createRouteNode(route, basePath = "", key, ctx) {
    let createdRoute = basePath ? (basePath.substr(-1) === "/" ? basePath.substr(0, -1) : basePath) : "";
    createdRoute = createdRoute + "/" + (route.path ? (route.path.substr(0, 1) === "/" ? route.path.substr(1) : route.path) : "");
    if (ctx?.isDebugActive())
        console.debug('Generating Route Virtual DOM Node', createdRoute, route, key);
    const newRouteProps = {
        children: route.children,
        exact: route.exact,
        location: route.location,
        path: createdRoute,
        sensitive: route.sensitive,
        strict: route.strict,
        render: route.render ? (props) => { return route.render ? route.render({ ...props, routes: route.routes, path: route.path }) : React.createElement("div", null); } : undefined,
        component: route.component ? (props) => { const RouteComponent = route.component || 'div'; return React.createElement(RouteComponent, { ...props, routes: route.routes, path: route.path }); } : undefined
    };
    return React.createElement(Route, { ...newRouteProps, key: key });
}
//# sourceMappingURL=EpiSpaRouter.js.map