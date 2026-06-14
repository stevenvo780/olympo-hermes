import { RouteConfig, RoutesConfig } from '../types/routes';
import routesConfig from '../config/routesConfig.json';

const config = routesConfig as RoutesConfig;

export const getAllPublicRoutes = (): RouteConfig[] => {
  return config.publicRoutes.filter(route => !route.hidden);
};

export const getSeoRoutesWithoutDynamicParams = (): RouteConfig[] => {
  return getAllPublicRoutes().filter(route => !route.path.includes('['));
};

export const getDisallowedRoutes = (): string[] => {
  const adminRoutes = Object.values(config.roleRoutes).flat();
  return [
    ...adminRoutes.map(route => route.path),
    '/api',
    '/dashboard',
    '/login',
    '/register'
  ];
};

export const getDynamicRoutePatterns = () => {
  return getAllPublicRoutes()
    .filter(route => route.path.includes('['))
    .map(route => ({
      pattern: route.path,
      type: route.seo?.type
    }));
};
