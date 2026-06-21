import { Injectable, Logger, Optional } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService as EnvConfigService } from '@nestjs/config';
import { Store } from 'src/store/entities/store.entity';
import { UniversalEventService } from './universal-event.service';

@Injectable()
export class PluginService {
  private readonly logger = new Logger(PluginService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly envConfig: EnvConfigService,
    @Optional() private readonly universalEventService: UniversalEventService,
  ) {}

  async emit(
    eventType: string,
    data: Record<string, unknown>,
    store: Store,
  ): Promise<void> {
    if (this.universalEventService) {
      const ownerEmail = store?.owner?.email;
      try {
        await this.universalEventService.sendEvent(
          eventType,
          data,
          store,
          ownerEmail,
          { throwOnError: false },
        );
      } catch (err) {
        this.logger.error(
          `Fallo crítico emitiendo evento ${eventType}: ${err?.message || err}`,
        );
      }
    } else {
      this.logger.warn(
        `UniversalEventService no está disponible. Evento '${eventType}' no se enviará.`,
      );
    }
  }

  async invoke(
    _store: Store,
    pluginName: string,
    _payload: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    this.logger.warn(
      `DEPRECATED: Invocación directa de plugin ${pluginName}. Los plugins deben ser manejados por Hub Central.`,
    );

    throw new BadRequestException(
      `Plugin invocation deprecated. All plugins must be handled through Hub Central.`,
    );
  }

  async checkNousConnection(): Promise<{
    connected: boolean;
    url?: string;
    error?: string;
  }> {
    const hubCentralUrl = this.envConfig.get<string>('HUB_CENTRAL_URL');
    if (!hubCentralUrl) {
      return {
        connected: false,
        error: 'HUB_CENTRAL_URL no configurada',
      };
    }

    try {
      const response = await this.httpService
        .get(`${hubCentralUrl}/api/v1/webhooks/health`, {
          timeout: 5000,
        })
        .toPromise();

      return {
        connected: true,
        url: hubCentralUrl,
        ...response.data,
      };
    } catch (error) {
      return {
        connected: false,
        url: hubCentralUrl,
        error: error.message,
      };
    }
  }

  async getAvailablePlugins(): Promise<Record<string, unknown>> {
    const hubCentralUrl = this.envConfig.get<string>('HUB_CENTRAL_URL');
    if (!hubCentralUrl) {
      return { plugins: [], error: 'HUB_CENTRAL_URL no configurada' };
    }

    try {
      const response = await this.httpService
        .get(`${hubCentralUrl}/api/v1/plugins`, {
          timeout: 5000,
        })
        .toPromise();

      return response.data;
    } catch (error) {
      this.logger.error('Error obteniendo plugins disponibles:', error.message);
      return { plugins: [], error: error.message };
    }
  }

  async getStorePluginConfig(
    storeId: number,
  ): Promise<Record<string, unknown>> {
    const hubCentralUrl = this.envConfig.get<string>('HUB_CENTRAL_URL');
    if (!hubCentralUrl) {
      return { plugins: [], error: 'HUB_CENTRAL_URL no configurada' };
    }

    const tenantId = `hermes-store-${storeId}`;

    try {
      const response = await this.httpService
        .get(`${hubCentralUrl}/api/v1/tenants/${tenantId}/plugins`, {
          timeout: 5000,
        })
        .toPromise();

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error obteniendo configuración de plugins para store ${storeId}:`,
        error.message,
      );
      return { plugins: [], error: error.message };
    }
  }
}
