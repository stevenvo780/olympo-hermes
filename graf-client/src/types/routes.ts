export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  type?: string;
  robots?: string;
  image?: string;
}

export interface RouteConfig {
  path: string;
  name: string;
  viewHeader: boolean;
  hidden: boolean;
  protected?: boolean;
  seo?: SeoConfig;
}

export interface RoutesConfig {
  publicRoutes: RouteConfig[];
  roleRoutes: {
    [key: string]: RouteConfig[];
  };
}
