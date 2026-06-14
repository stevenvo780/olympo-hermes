import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, User } from '../user/entities/user.entity';
import { RequestWithUser } from '../auth/types';
import { Logger } from '@nestjs/common';

@ApiTags('integrations')
@Controller('integrations')
@UseGuards(FirebaseAuthGuard, RolesGuard)
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private buildHeaders(user: User) {
    const email = user?.email || '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-email': email,
    };
    return headers;
  }

  /**
   * Lee la configuración del plugin apisigo para una tienda (subconfig graf-store-<storeId>)
   */
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @Get('apisigo/:storeId')
  async getApiSigoConfig(
    @Param('storeId') storeId: string,
    @Req() req: RequestWithUser,
  ) {
    const hubUrl = this.config.get<string>('HUB_CENTRAL_URL');
    if (!hubUrl) {
      this.logger.warn(
        `HUB_CENTRAL_URL not configured; returning empty ApiSigo config for store=${storeId}`,
      );
      return { config: {} };
    }
    const subconfigId = `graf-store-${storeId}`;
    const url = `${hubUrl}/api/v1/plugins/plugins/apisigo?service=hubcentral&subconfigId=${encodeURIComponent(
      subconfigId,
    )}`;
    this.logger.log(
      `GET ApiSigo config store=${storeId} as ${req.user?.email}`,
    );
    try {
      const res = await this.http.axiosRef.get(url, {
        headers: this.buildHeaders(req.user),
        timeout: 8000,
      });
      const cfg = res.data?.config || {};
      const hasTriggerEvent =
        typeof cfg?.triggerEvent === 'string' && cfg.triggerEvent.length > 0;
      const hasPayments = !!(cfg?.payments || cfg?.paymentMapping);
      this.logger.log(
        `Loaded ApiSigo config store=${storeId}: triggerEvent=${
          hasTriggerEvent ? cfg.triggerEvent : '<none>'
        }, hasPayments=${hasPayments}`,
      );
      return res.data;
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        return { config: {} };
      }
      this.logger.warn(
        `ApiSigo GET failed store=${storeId} status=${status ?? 'n/a'} msg=${
          err?.message ?? 'unknown'
        }`,
      );
      return { config: {} };
    }
  }

  /**
   * Actualiza la configuración del plugin apisigo para una tienda (mapea payments, taxes, etc.)
   */
  @ApiBearerAuth()
  @Roles(UserRole.SUPER_ADMIN, UserRole.BUSINESS_OWNER)
  @Put('apisigo/:storeId')
  async updateApiSigoConfig(
    @Param('storeId') storeId: string,
    @Req() req: RequestWithUser,
    @Query('enabled') enabled?: string,
    @Body() configBody: Record<string, unknown> = {},
  ) {
    const hubUrl = this.config.get<string>('HUB_CENTRAL_URL');
    if (!hubUrl) {
      throw new ServiceUnavailableException(
        'Hub Central no está configurado. No se puede guardar el mapeo de pagos.',
      );
    }
    const subconfigId = `graf-store-${storeId}`;
    const url = `${hubUrl}/api/v1/plugins/plugins/apisigo/credentials?service=hubcentral&subconfigId=${encodeURIComponent(
      subconfigId,
    )}`;
    const dto = {
      enabled:
        enabled === 'true' ? true : enabled === 'false' ? false : undefined,
      config: configBody,
    };
    const hasTriggerEvent =
      typeof configBody?.triggerEvent === 'string' &&
      configBody.triggerEvent.length > 0;
    const paymentsSummary = Object.keys(
      (configBody?.payments as unknown as { types: object })?.types || {},
    );
    this.logger.log(
      `PUT ApiSigo config store=${storeId} enabled=${
        dto.enabled
      } triggerEvent=${
        hasTriggerEvent ? configBody.triggerEvent : '<none>'
      } paymentsTypes=[${paymentsSummary.join(', ')}]`,
    );

    const res = await this.http.axiosRef.put(url, dto, {
      headers: this.buildHeaders(req.user),
      timeout: 8000,
    });
    const savedCfg = res.data?.config || {};
    const savedTrigger = savedCfg?.triggerEvent;
    this.logger.log(
      `Saved ApiSigo config store=${storeId}: triggerEvent=${
        savedTrigger ?? '<none>'
      }`,
    );
    return res.data;
  }
}
