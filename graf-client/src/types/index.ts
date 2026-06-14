import React from 'react';

export const LIMIT_PRODUCTS = 7;

export interface AuthData {
  email: string;
  password: string;
}

export interface SharedProp {
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteApi {
  method: string;
  path: string;
}

export interface ResponseData {
  userData: User;
  access_token: string;
}

export interface UserData {
  user: User;
  profile?: Profile;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProductViewConfig {
  defaultView: ProductViewVariant;
  filteredView?: ProductViewVariant;
  availableViews: ProductViewVariant[];
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  BUSINESS_OWNER = 'business_owner',
  CUSTOMER = 'customer',
}

export enum PlanType {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled',
}

export interface ShippingAddress {
  address: string;
  apartment?: string;
  buildingName?: string;
  city: string;
  department: string;
  country: string;
  reference?: string;
}

export interface Profile {
  id: number;
  user: User;
  shippingAddress?: ShippingAddress;
  additionalPhone?: string;
  documentNumber?: string;
}

export interface PaymentSource {
  id: number;
  type: string;
  lastFour?: string;
  brand?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
}

export interface Subscription {
  id: number;
  user: User;
  planType: PlanType;
  startDate: Date;
  endDate?: Date;
  updatedAt: Date;
  lastPaymentSource?: PaymentSource;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  documentNumber?: string;
  role: UserRole;
  profile?: Profile;
  stores: Store[];
  subscription?: Subscription;
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

// ── Checkout Wizard Types ──────────────────────────────────────────────

export type PaymentMethod = 'whatsapp' | 'wompi';

export interface BuyerData {
  fullName: string;
  phone: string;
  email: string;
  documentNumber: string;
}

export interface CheckoutStepDef {
  id: CheckoutStepId;
  title: string;
  icon: React.ReactNode;
}

export type CheckoutStepId =
  | 'auth'
  | 'buyer-data'
  | 'delivery'
  | 'shipping'
  | 'questions'
  | 'confirm';

export interface CheckoutWizardState {
  paymentMethod: PaymentMethod;
  buyerData: BuyerData;
  deliveryZone: DeliveryZone | null;
  shippingAddress: ShippingAddress;
  customAnswers: { question: string; answer: string }[];
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
  recommendedCardType?: ProductViewVariant;
  recommendedDisplayMode?: RecommendedDisplayMode;
}

export interface ScheduleDay {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
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
  productViewConfig: ProductViewConfig;
  activations: {
    requireUserData?: boolean;
    requireLogin?: boolean;
    deliveryEnabled?: boolean;
    requireShippingData?: boolean;
    [key: string]: boolean | undefined;
  };
  schedule: ScheduleDay[];
  storeAddress: string;
  coordinates: Coordinates;
  dominios: string[];
  customMessage: string;
  plugins: Record<string, { enabled: boolean; apiKey: string }>;
  productDetailConfig: ProductDetailConfig;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  imageUrl?: string;
  store: Store;
  products: Product[];
  parent: Category;
  children: Category[];
}

export interface Discount {
  id: number;
  name: string;
  discountType: string;
  discountValue: number;
  product?: Product;
  store: Store;
}

export interface OrderItem {
  id: number;
  order: Order;
  product: Product;
  quantity: number;
  unitPrice: number;
}

export interface Order extends SharedProp {
  id: number;
  user?: User;
  store: Store;
  items?: OrderItem[];
  status: OrderStatus;
  amount: AmountOrder;
  additionalNotes?: string;
  customAnswers?: CustomAnswer[];
  deliveryZone?: DeliveryZone;
}

export interface AmountOrder {
  discountTotal: number;
  taxTotal: number;
  delivery: number;
  total: number;
}

export interface CustomAnswer {
  question: string;
  answer: string;
}

export interface ProductPrices {
  basePrice: number;
  discountPrice: number;
  netPrice: number;
  taxPrice: number;
  priceWithTax: number;
  totalPrice: number;
}

export interface ProductDisplayInfo {
  isParentProduct: boolean;
  canAddToCart: boolean;
  hasStock: boolean;
  firstImageUrl: string | null;
  displayPrice: number;
}

export interface Product extends ProductPrices, ProductDisplayInfo {
  id: number;
  title: string;
  description?: string;
  longDescription?: string;
  stock: number;
  images?: string[];
  variationType?: string;
  value: string;
  sku: string;
  parent?: Product;
  children?: Product[];
  taxes?: Tax[];
  discounts?: Discount[];
  categories?: Category[];
  store: Store;
  orderItems: OrderItem[];
  orderInCategory?: number;
}

export interface Tax {
  id: number;
  name: string;
  rate: number;
  store: Store;
}
