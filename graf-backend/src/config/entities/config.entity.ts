import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { SharedProp } from '../../common/entities/sharedProp.helper';
import { Store } from '../../store/entities/store.entity';

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

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ProductViewConfig {
  defaultView: string;
  filteredView?: string;
  availableViews: string[];
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

export enum RecommendedCardType {
  CAROUSEL = 'carousel',
  GRID = 'grid',
  CLOTHING = 'clothing',
  LIST = 'list',
  FEATURED = 'featured',
  CLOTHING_GRID = 'clothing-grid',
  WIDE_CARD = 'wide-card',
  COMPACT = 'compact',
}

export enum RecommendedDisplayMode {
  CAROUSEL = 'carousel',
  GRID = 'grid',
}

export interface ProductDetailConfig {
  viewType: ProductDetailViewType;
  contentType: ProductContentType;
  showRecommendedProducts: boolean;
  recommendedCardType: RecommendedCardType;
  recommendedDisplayMode: RecommendedDisplayMode;
}

@Entity()
export class Config extends SharedProp {
  @PrimaryGeneratedColumn()
  @ApiProperty({
    description: 'Unique identifier for the configuration',
    example: 1,
  })
  id: number;

  @OneToOne(() => Store, { eager: true })
  @JoinColumn()
  store: Store;

  @Column({ type: 'text', default: '' })
  @ApiProperty({
    description: 'Business description (supports extensive HTML content)',
    example:
      '<h2>About Our Company</h2><p>We are leaders in e-commerce...</p><ul><li>Quality products</li><li>Excellent service</li></ul>',
  })
  about: string;

  @Column('json', { default: {} })
  @ApiProperty({
    description: 'Palette of colors with detailed CSS variable mapping',
    example: {
      '--font-color': '#FFFFFF',
      '--bg-color': '#1A1A1A',
      '--white-color': '#FFFFFF',
      '--border-color': '#333333',
      '--primary-color': '#8B4513',
    },
  })
  palette: Record<string, string>;

  @Column('simple-array', { default: '' })
  @ApiProperty({
    description: 'Array of banner image URLs',
    example: [
      'https://example.com/banner1.jpg',
      'https://example.com/banner2.jpg',
    ],
  })
  banners: string[];

  @Column({ type: 'varchar', default: '' })
  @ApiProperty({
    description: 'Payment link URL',
    example: 'https://example.com/pay',
  })
  paymentLink: string;

  @Column({ type: 'varchar', default: '' })
  @ApiProperty({
    description: 'Logo image URL',
    example: 'https://example.com/logo.png',
  })
  logo: string;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Controls whether the navbar displays the logo',
    example: true,
  })
  showNavbarLogo: boolean;

  @Column({ type: 'boolean', default: true })
  @ApiProperty({
    description: 'Controls whether the navbar displays the store name',
    example: true,
  })
  showNavbarTitle: boolean;

  @Column({ type: 'int', default: 60 })
  @ApiProperty({
    description: 'Navbar height in pixels',
    example: 60,
  })
  navbarHeight: number;

  @Column('simple-array', { default: '' })
  @ApiProperty({
    description: 'Contact numbers',
    example: ['+1234567890', '+0987654321'],
  })
  contactNumbers: string[];

  @Column('json', { default: [] })
  @ApiProperty({
    description: 'Social networks as an array of objects with name and URL',
    example: [
      { name: 'facebook', url: 'https://facebook.com/store' },
      { name: 'twitter', url: 'https://twitter.com/store' },
    ],
  })
  socialNetworks: { name: string; url: string }[];

  @Column('json', { default: {} })
  @ApiProperty({
    description: 'Footer data containing extra text',
    example: {
      info: 'example',
    },
  })
  footer: Record<string, unknown>;

  @Column('json', { default: {} })
  @ApiProperty({
    description: 'Legal information for the store',
    example: {
      legalNotice: 'Legal notice text...',
      termsOfServiceLink: 'https://example.com/terms',
      sitemapLink: 'https://example.com/sitemap',
      disclaimer: 'Disclaimer text...',
    },
  })
  legal: Record<string, unknown>;

  @Column('json', { default: {} })
  @ApiProperty({
    description: 'SEO settings (meta title, description, and keywords)',
    example: {
      metaTitle: 'My Store',
      metaDescription: 'SEO description for the store',
      keywords: ['store', 'e-commerce', 'online'],
    },
  })
  seo: Record<string, unknown>;

  @Column('json', { default: [] })
  @ApiProperty({
    description:
      'Preguntas personalizadas para las órdenes, cuya respuesta es un texto',
    example: [{ question: '¿Cuál es su requerimiento?', type: 'text' }],
  })
  customQuestions: CustomQuestion[];

  @Column('json', { default: {} })
  @ApiProperty({
    description: 'Activaciones de distintas funcionalidades en la aplicación',
    example: {
      requireUserData: false,
      requireLogin: false,
      deliveryEnabled: false,
    },
  })
  activations: Record<string, boolean>;

  @Column('json', { default: [] })
  @ApiProperty({
    description: 'Horarios de disponibilidad del negocio',
    example: [
      { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    ],
  })
  schedule: ScheduleDay[];

  @Column({ type: 'text', default: '' })
  @ApiProperty({
    description: 'Dirección completa de la tienda',
    example: 'Av. Principal 123, Ciudad, País',
  })
  storeAddress: string;

  @Column('json', { default: {} })
  @ApiProperty({
    description: 'Coordenadas de ubicación de la tienda (latitud y longitud)',
    example: { lat: -0.1800209, lng: -78.4678382 },
  })
  coordinates: Coordinates;

  @Column('simple-array', { default: '' })
  @ApiProperty({
    description: 'Dominios asociados a la configuración',
    example: ['example.com', 'store.example.com'],
  })
  dominios: string[];

  @Column({ type: 'varchar', default: '' })
  @ApiProperty({
    description: 'Custom message for the configuration',
    example: 'Welcome to our store!',
  })
  customMessage: string;

  @Column('json', { default: {} })
  @ApiProperty({
    description: 'Plugin configurations (enabled flag + API key)',
    example: {
      sinergia: { enabled: false, apiKey: '' },
      meraVuelta: { enabled: false, apiKey: '' },
    },
  })
  plugins: Record<string, { enabled: boolean; apiKey: string }>;

  @Column({ type: 'boolean', default: false })
  @ApiProperty({
    description: 'Flag to enable or disable payment links',
    example: true,
  })
  enablePaymentLinks: boolean;

  @Column('json', {
    default: {
      defaultView: RecommendedCardType.CAROUSEL,
      filteredView: RecommendedDisplayMode.GRID,
      availableViews: [
        RecommendedCardType.CAROUSEL,
        RecommendedCardType.GRID,
        RecommendedCardType.CLOTHING,
        RecommendedCardType.LIST,
        RecommendedCardType.FEATURED,
        RecommendedCardType.CLOTHING_GRID,
        RecommendedCardType.WIDE_CARD,
        RecommendedCardType.COMPACT,
      ],
    },
  })
  @ApiProperty({
    description: 'Product view configuration for the store',
    example: {
      defaultView: RecommendedCardType.CAROUSEL,
      filteredView: RecommendedDisplayMode.GRID,
      availableViews: [
        RecommendedCardType.CAROUSEL,
        RecommendedCardType.GRID,
        RecommendedCardType.CLOTHING,
        RecommendedCardType.LIST,
        RecommendedCardType.FEATURED,
        RecommendedCardType.CLOTHING_GRID,
        RecommendedCardType.WIDE_CARD,
        RecommendedCardType.COMPACT,
      ],
    },
  })
  productViewConfig: ProductViewConfig;

  @Column('json', {
    default: {
      viewType: ProductDetailViewType.MODAL,
      contentType: ProductContentType.PLAIN,
      showRecommendedProducts: true,
      recommendedCardType: RecommendedCardType.CAROUSEL,
      recommendedDisplayMode: RecommendedDisplayMode.CAROUSEL,
    },
  })
  @ApiProperty({
    description:
      'Product detail view configuration: view type (modal, modalLarge, page), content type (html, plain), recommended products toggle, card type and display mode',
    example: {
      viewType: ProductDetailViewType.MODAL,
      contentType: ProductContentType.PLAIN,
      showRecommendedProducts: true,
      recommendedCardType: RecommendedCardType.CAROUSEL,
      recommendedDisplayMode: RecommendedDisplayMode.CAROUSEL,
    },
  })
  productDetailConfig: ProductDetailConfig;
}
