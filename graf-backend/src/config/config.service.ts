import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Config,
  RecommendedCardType,
  RecommendedDisplayMode,
} from './entities/config.entity';
import { UpdateConfigDto } from './dto/update-config.dto';
import { Store } from '../store/entities/store.entity';
import { User } from '../user/entities/user.entity';
import { checkStoreAccess } from '../utils/permissions';
import sanitizeHtml from 'sanitize-html';

@Injectable()
export class ConfigService {
  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
    @InjectRepository(Store)
    private storeRepository: Repository<Store>,
  ) {}

  private sanitizeAboutContent(content: string): string {
    return sanitizeHtml(content, {
      allowedTags: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'br',
        'div',
        'span',
        'strong',
        'b',
        'em',
        'i',
        'u',
        'ul',
        'ol',
        'li',
        'a',
        'img',
        'blockquote',
        'pre',
        'code',
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
      ],
      allowedAttributes: {
        a: ['href', 'title', 'target'],
        img: ['src', 'alt', 'title', 'width', 'height'],
        '*': ['class', 'style'],
      },
      allowedSchemes: ['http', 'https', 'mailto'],
      disallowedTagsMode: 'discard',
    });
  }

  async createDefaultConfig(store: Store): Promise<Config> {
    const defaultConfig = new Config();
    defaultConfig.store = store;
    defaultConfig.palette = {
      '--font-color': '#333333',
      '--bg-color': '#F5F5F5',
      '--white-color': '#FFFFFF',
      '--border-color': '#DFDFE5',
      '--primary-color': '#1B3862',
      '--primary-hover': '#234578',
      '--primary-border': '#1B3862',
      '--primary-text': '#FFFFFF',
      '--secondary-color': '#06817E',
      '--secondary-hover': '#05615F',
      '--secondary-border': '#06817E',
      '--secondary-text': '#FFFFFF',
      '--info-color': '#4A90A0',
      '--info-hover': '#5AA5B8',
      '--info-border': '#4A90A0',
      '--info-text': '#FFFFFF',
      '--success-color': '#278F7E',
      '--success-hover': '#32A593',
      '--success-border': '#278F7E',
      '--success-text': '#FFFFFF',
      '--warning-color': '#E9B44C',
      '--warning-hover': '#F0C56A',
      '--warning-border': '#E9B44C',
      '--warning-text': '#152D4F',
      '--danger-color': '#D84654',
      '--danger-hover': '#E35A68',
      '--danger-border': '#D84654',
      '--danger-text': '#FFFFFF',
      '--link-color': '#3B6B8A',
      '--link-hover': '#1B3862',
      '--link-border': '#3B6B8A',
      '--link-text': '#FFFFFF',
      '--outline-color': '#DFDFE5',
      '--card-color': '#FFFFFF',
      '--card-hover': '#EAEBF0',
      '--card-border': '#DFDFE5',
      '--card-text': '#333333',
      '--online-color': '#2CBDA1',
      '--navbar-color': '#FFFFFF',
      '--navbar-text': '#333333',
      '--navbar-hover-text': '#1B3862',
      '--navbar-hover-color': '#F5F7FA',
      '--navbar-border-color': '#DFDFE5',
      '--text-secondary': '#666666',
      '--text-muted': '#767676',
      '--card-title-color': '#1B3862',
    };
    defaultConfig.banners = [];
    defaultConfig.paymentLink = '';
    defaultConfig.logo = '';
    defaultConfig.showNavbarLogo = true;
    defaultConfig.showNavbarTitle = true;
    defaultConfig.navbarHeight = 60;
    defaultConfig.contactNumbers = [];
    defaultConfig.socialNetworks = [];
    defaultConfig.footer = {
      info: '',
    };
    defaultConfig.legal = {
      legalNotice: '',
      termsOfServiceLink: '',
      sitemapLink: '',
      disclaimer: '',
    };
    defaultConfig.seo = {};
    defaultConfig.customQuestions = [];
    defaultConfig.activations = {
      requireUserData: false,
      requireLogin: false,
    };
    defaultConfig.schedule = [
      { day: 'monday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'tuesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'wednesday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'thursday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'friday', isOpen: true, openTime: '08:00', closeTime: '18:00' },
      { day: 'saturday', isOpen: true, openTime: '09:00', closeTime: '15:00' },
      { day: 'sunday', isOpen: false, openTime: '00:00', closeTime: '00:00' },
    ];
    defaultConfig.storeAddress = '';
    defaultConfig.coordinates = { lat: 0, lng: 0 };
    defaultConfig.customMessage = '';
    defaultConfig.plugins = {
      nous: { enabled: false, apiKey: '' },
      sigo: { enabled: false, apiKey: '' },
      talanton: { enabled: false, apiKey: '' },
      meraVuelta: { enabled: false, apiKey: '' },
    };
    defaultConfig.productViewConfig = {
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
    };

    return this.configRepository.save(defaultConfig);
  }

  private getDefaultPlugins() {
    return {
      nous: { enabled: false, apiKey: '' },
      sigo: { enabled: false, apiKey: '' },
      talanton: { enabled: false, apiKey: '' },
      meraVuelta: { enabled: false, apiKey: '' },
    };
  }

  async getConfigByStore(storeId: string, user: User): Promise<Config> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    let config = await this.configRepository.findOne({
      where: { store: { id: storeId } },
      relations: ['store', 'store.owner', 'store.owner.subscription'],
    });

    if (!config) {
      config = await this.createDefaultConfig(store);
    } else {
      const defaultPlugins = this.getDefaultPlugins();

      if (!config.plugins) {
        config.plugins = {};
      }

      let pluginsUpdated = false;
      for (const [pluginName, defaultValue] of Object.entries(defaultPlugins)) {
        if (!config.plugins[pluginName]) {
          config.plugins[pluginName] = defaultValue;
          pluginsUpdated = true;
        }
      }

      let configUpdated = pluginsUpdated;

      if (
        config.showNavbarLogo === undefined ||
        config.showNavbarLogo === null
      ) {
        config.showNavbarLogo = true;
        configUpdated = true;
      }

      if (
        config.showNavbarTitle === undefined ||
        config.showNavbarTitle === null
      ) {
        config.showNavbarTitle = true;
        configUpdated = true;
      }

      const navbarHeight = config.navbarHeight;
      if (
        !Number.isFinite(navbarHeight) ||
        navbarHeight < 48 ||
        navbarHeight > 200
      ) {
        config.navbarHeight = 60;
        configUpdated = true;
      }

      if (configUpdated) {
        config = await this.configRepository.save(config);
      }
    }

    return config;
  }

  async updateConfigByStore(
    storeId: string,
    user: User,
    updateConfigDto: UpdateConfigDto,
  ): Promise<Config> {
    const store = await checkStoreAccess(this.storeRepository, storeId, user);

    let config = await this.configRepository.findOne({
      where: { store: { id: storeId } },
    });

    if (!config) {
      config = await this.createDefaultConfig(store);
    }

    if (updateConfigDto.about) {
      updateConfigDto.about = this.sanitizeAboutContent(updateConfigDto.about);
    }

    Object.assign(config, updateConfigDto);
    return this.configRepository.save(config);
  }

  async getPublicConfigByStore(storeId: string): Promise<Config> {
    const store = await this.storeRepository.findOne({
      where: { id: storeId },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }
    let config = await this.configRepository.findOne({
      where: { store: { id: storeId } },
      relations: ['store', 'store.owner', 'store.owner.subscription'],
    });
    if (!config) {
      config = await this.createDefaultConfig(store);
    } else {
      const defaultPlugins = this.getDefaultPlugins();

      if (!config.plugins) {
        config.plugins = {};
      }

      let pluginsUpdated = false;
      for (const [pluginName, defaultValue] of Object.entries(defaultPlugins)) {
        if (!config.plugins[pluginName]) {
          config.plugins[pluginName] = defaultValue;
          pluginsUpdated = true;
        }
      }

      let configUpdated = pluginsUpdated;

      if (
        config.showNavbarLogo === undefined ||
        config.showNavbarLogo === null
      ) {
        config.showNavbarLogo = true;
        configUpdated = true;
      }

      if (
        config.showNavbarTitle === undefined ||
        config.showNavbarTitle === null
      ) {
        config.showNavbarTitle = true;
        configUpdated = true;
      }

      const navbarHeight = config.navbarHeight;
      if (
        !Number.isFinite(navbarHeight) ||
        navbarHeight < 48 ||
        navbarHeight > 200
      ) {
        config.navbarHeight = 60;
        configUpdated = true;
      }

      if (configUpdated) {
        config = await this.configRepository.save(config);
      }
    }
    return config;
  }

  async getStoreByDomain(domain: string): Promise<Store> {
    const config = await this.configRepository
      .createQueryBuilder('config')
      .leftJoinAndSelect('config.store', 'store')
      .where('config.dominios LIKE :domain', { domain: `%${domain}%` })
      .getOne();
    if (!config) {
      throw new NotFoundException(
        `No se encontró tienda con el dominio ${domain}`,
      );
    }
    return config.store;
  }
}
