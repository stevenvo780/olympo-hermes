import {
  IsString,
  IsArray,
  IsOptional,
  IsObject,
  IsNumber,
  IsInt,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ProductDetailViewType,
  ProductContentType,
  RecommendedCardType,
  RecommendedDisplayMode,
} from '../entities/config.entity';

class ScheduleDayDto {
  @IsString()
  day: string;

  @IsBoolean()
  isOpen: boolean;

  @IsString()
  openTime: string;

  @IsString()
  closeTime: string;
}

class CoordinatesDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

class ProductViewConfigDto {
  @IsString()
  defaultView: string;

  @IsOptional()
  @IsString()
  filteredView?: string;

  @IsArray()
  @IsString({ each: true })
  availableViews: string[];
}

class ProductDetailConfigDto {
  @IsEnum(ProductDetailViewType)
  @ApiProperty({
    description: 'Type of view for product detail',
    enum: ProductDetailViewType,
    example: ProductDetailViewType.MODAL,
  })
  viewType: ProductDetailViewType;

  @IsEnum(ProductContentType)
  @ApiProperty({
    description: 'Type of content rendering for product descriptions',
    enum: ProductContentType,
    example: ProductContentType.PLAIN,
  })
  contentType: ProductContentType;

  @IsBoolean()
  @ApiProperty({
    description: 'Whether to show recommended products section',
    example: true,
  })
  showRecommendedProducts: boolean;

  @IsEnum(RecommendedCardType)
  @ApiProperty({
    description: 'Card type for recommended products display',
    enum: RecommendedCardType,
    example: RecommendedCardType.CAROUSEL,
  })
  recommendedCardType: RecommendedCardType;

  @IsEnum(RecommendedDisplayMode)
  @ApiProperty({
    description:
      'Display mode for recommended products section (carousel or grid)',
    enum: RecommendedDisplayMode,
    example: RecommendedDisplayMode.CAROUSEL,
  })
  recommendedDisplayMode: RecommendedDisplayMode;
}

export class CreateConfigDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description:
      'Business description (supports extensive HTML content with rich formatting)',
    example:
      '<h2>About Our Company</h2><p>We are a leading company in e-commerce...</p><ul><li>Premium quality products</li><li>Exceptional customer service</li><li>Fast delivery</li></ul><p>Visit our <a href="https://example.com">website</a> for more information.</p>',
    required: false,
  })
  about?: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Palette of 6 colors (hex values)',
    type: [String],
  })
  palette: string[];

  @IsString()
  @ApiProperty({
    description: 'Banner image URL',
    type: String,
  })
  banner: string;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Array of banner image URLs',
    type: [String],
    example: [
      'https://example.com/banner1.jpg',
      'https://example.com/banner2.jpg',
    ],
  })
  banners: string[];

  @IsString()
  @ApiProperty({
    description: 'Payment link URL',
    type: String,
    example: 'https://example.com/pay',
  })
  paymentLink: string;

  @IsString()
  @ApiProperty({
    description: 'Logo image URL',
    type: String,
  })
  logo: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Controls whether the navbar displays the logo',
    example: true,
    required: false,
  })
  showNavbarLogo?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Controls whether the navbar displays the store name',
    example: true,
    required: false,
  })
  showNavbarTitle?: boolean;

  @IsOptional()
  @IsInt()
  @Min(48)
  @Max(200)
  @ApiProperty({
    description: 'Navbar height in pixels',
    example: 60,
    required: false,
  })
  navbarHeight?: number;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Contact numbers',
    type: [String],
  })
  contactNumbers: string[];

  @IsArray()
  @IsObject({ each: true })
  @ApiProperty({
    description: 'Social networks as an array of objects with name and URL',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        url: { type: 'string' },
      },
    },
    example: [
      { name: 'facebook', url: 'https://facebook.com/store' },
      { name: 'twitter', url: 'https://twitter.com/store' },
    ],
  })
  socialNetworks: { name: string; url: string }[];

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Footer data containing extra text',
    example: {
      info: 'Company information text...',
    },
  })
  footer?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Legal information for the store',
    example: {
      legalNotice: 'Legal notice text...',
      termsOfServiceLink: 'https://example.com/terms',
      sitemapLink: 'https://example.com/sitemap',
      disclaimer: 'Disclaimer text...',
    },
  })
  legal?: Record<string, unknown>;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'SEO settings including meta title, description, and keywords',
    example: {
      metaTitle: 'My Business',
      metaDescription: 'Description for SEO purposes',
      keywords: ['business', 'e-commerce', 'online store'],
    },
  })
  seo?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  @ApiProperty({
    description:
      'Preguntas personalizadas para las órdenes (respuesta en texto)',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        type: { type: 'string' },
      },
    },
    example: [{ question: '¿Cuál es su requerimiento?', type: 'text' }],
  })
  customQuestions?: { question: string; type: string }[];

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Activaciones de distintas funcionalidades en la aplicación',
    example: {
      requireUserData: false,
      requireLogin: false,
      deliveryEnabled: false,
    },
  })
  activations?: Record<string, boolean>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleDayDto)
  @ApiProperty({
    description: 'Horarios de disponibilidad del negocio',
    type: [ScheduleDayDto],
    example: [
      { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
    ],
  })
  schedule?: ScheduleDayDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  @ApiProperty({
    description: 'Coordenadas de ubicación de la tienda (latitud y longitud)',
    example: { lat: -0.1800209, lng: -78.4678382 },
    type: CoordinatesDto,
  })
  coordinates?: CoordinatesDto;

  @IsArray()
  @IsString({ each: true })
  @ApiProperty({
    description: 'Dominios asociados a la configuración',
    example: ['example.com', 'store.example.com'],
  })
  dominios: string[];

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Flag to enable or disable payment links',
    example: true,
  })
  enablePaymentLinks?: boolean;

  @IsString()
  @ApiProperty({
    description: 'Custom message',
    example: 'Welcome to our store!',
  })
  customMessage: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: 'Plugin configurations (enabled flag + API key)',
    example: {
      talanton: { enabled: true, apiKey: 'KEY123' },
      talaria: { enabled: false, apiKey: '' },
    },
  })
  plugins?: Record<string, { enabled: boolean; apiKey: string }>;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductViewConfigDto)
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
  productViewConfig?: ProductViewConfigDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductDetailConfigDto)
  @ApiProperty({
    description:
      'Product detail view configuration: view type (modal, modalLarge, page), content type (html, plain), and recommended products toggle',
    example: {
      viewType: ProductDetailViewType.MODAL,
      contentType: ProductContentType.PLAIN,
      showRecommendedProducts: true,
    },
  })
  productDetailConfig?: ProductDetailConfigDto;
}
