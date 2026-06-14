export interface AuthData {
  email: string;
  password: string;
}

export interface SharedProp {
  createdAt: string;
  updatedAt: string;
}

export interface RouteApi {
  method: string;
  path: string;
}

export interface ResponseData {
  userData: User;
  access_token: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export type ProductViewVariant = 'carousel' | 'grid' | 'clothing' | 'list' | 'featured' | 'clothing-grid' | 'wide-card' | 'compact';

export type RecommendedDisplayMode = 'carousel' | 'grid';

export interface ProductViewConfig {
  defaultView: ProductViewVariant;
  filteredView?: ProductViewVariant;
  availableViews: ProductViewVariant[];
}

export enum ProductDetailViewType {
  MODAL = 'modal',
  MODAL_LARGE = 'modalLarge',
  PAGE = 'page',
}

export enum ProductContentType {
  HTML = 'html',
  PLAIN = 'plain',
}

export interface ProductDetailConfig {
  viewType: ProductDetailViewType;
  contentType: ProductContentType;
  showRecommendedProducts: boolean;
  recommendedCardType: ProductViewVariant;
  recommendedDisplayMode: RecommendedDisplayMode;
}

export enum PaymentFrequency {
  MONTHLY = 'MONTHLY',
  ANNUALLY = 'ANNUALLY',
}

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BUSINESS_OWNER = 'business_owner',
  CUSTOMER = 'customer',
}

import { Order, OrderStatus, ShippingAddress } from './order';

export interface Profile {
  id: number;
  user: User;
  shippingAddress?: ShippingAddress;
  billingAddress?: string;
  additionalPhone?: string;
}

export interface Subscription {
  id: number;
  planType: PlanType;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  updatedAt: string;
}

export interface User extends SharedProp {
  id: string;
  email: string;
  name?: string;
  displayName?: string;
  phoneNumber?: string;
  role: UserRole;
  profile?: Profile;
  subscription?: Subscription;
  stores: Store[];
}

export interface Store {
  id: string;
  name: string;
  description: string;
  phonePrefix: string;
  phoneNumber: string;
  address: string;
  owner: User;
  products: Product[];
  taxes: Tax[];
  orders: Order[];
  discounts: Discount[];
  categories: Category[];
  employees: User[];
  configuration: Config;
  deliveryZones: DeliveryZone[];
}

export interface DeliveryZone {
  id: number;
  zone: string;
  price: number;
  freeShippingThreshold?: number;
  estimatedTime: string;
  store: Store;
}

export interface Option {
  value: string;
  label: string;
}

export interface CustomQuestion {
  question: string;
  type: string;
  options?: Option[];
  required?: boolean;
}

export interface ScheduleDay {
  day: string;
  isOpen: boolean;
  openTime: string;
  closeTime: string;
}

export interface Config {
  id: number;
  store: Store;
  about: string;
  privacyPolicies: string;
  palette: Record<string, string>;
  banners: string[];
  paymentLink: string;
  enablePaymentLinks?: boolean;
  logo: string;
  showNavbarLogo?: boolean;
  showNavbarTitle?: boolean;
  navbarHeight?: number;
  contactNumbers: string[];
  socialNetworks: { name: string; url: string }[];
  footer: {
    info?: string;
    [key: string]: string | undefined;
  };
  legal: {
    legalNotice?: string;
    termsOfServiceLink?: string;
    sitemapLink?: string;
    disclaimer?: string;
    [key: string]: string | undefined;
  };
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    [key: string]: string | string[] | undefined;
  };
  customQuestions: CustomQuestion[];
  activations: {
    requireUserData?: boolean;
    requireLogin?: boolean;
    deliveryEnabled?: boolean;
    requireShippingData?: boolean;
    distributionEnabled?: boolean;
    [key: string]: boolean | undefined;
  };
  schedule: ScheduleDay[];
  storeAddress: string;
  coordinates: Coordinates;
  dominios: string[];
  customMessage: string;
  plugins: Record<string, { enabled: boolean; apiKey: string }>;
  productViewConfig: ProductViewConfig;
  productDetailConfig: ProductDetailConfig;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  position: number;
  store: Store;
  products?: Product[];
  parent?: Category;
  children?: Category[];
}

export interface Discount {
  id: number;
  name: string;
  discountType: string;
  discountValue: number;
  product?: Product;
  store: Store;
}

export * from './product';
export * from './product-excel';

import { Product as ProductType } from './product';
export type Product = ProductType;

export interface Tax {
  id: number;
  name: string;
  rate: number;
  store: Store;
}

export interface StoreFormData {
  id: string;
  name: string;
  description: string;
  phonePrefix: string;
  phoneNumber: string;
  address: string;
}

export { OrderStatus };
