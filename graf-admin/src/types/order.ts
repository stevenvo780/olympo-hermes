import { User, Product, Store, SharedProp, DeliveryZone, Tax } from './index';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled'
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  WOMPI = 'wompi',
  BOLD = 'bold',
  CREDIT = 'credit'
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export interface OrderItem {
  id: number;
  quantity: number;
  unitPrice: number | string;
  product: Product;
  order: Order;
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
export interface ShippingAddress {
  address: string;
  apartment?: string;
  buildingName?: string;
  city: string;
  department: string;
  country: string;
  reference?: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  documentNumber?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  birthDate?: Date;
  loyaltyPoints: number;
  isActive: boolean;
  notes?: string;
  totalSpent: number;
  totalOrders: number;
  userId?: string;
  storeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order extends SharedProp {
  id: number;
  user?: User;
  customer?: Customer;
  store: Store;
  items: OrderItem[];
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  creditDays?: number;
  notes?: string;
  amount: AmountOrder;
  shippingAddress?: ShippingAddress;
  buyerName?: string;
  buyerPhone?: string;
  customAnswers: CustomAnswer[];
  deliveryZone?: DeliveryZone;
  taxes?: Tax[];
  documents?: string[];
  discountType?: DiscountType;
  discountValue?: number;
}

export interface OrderFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}
