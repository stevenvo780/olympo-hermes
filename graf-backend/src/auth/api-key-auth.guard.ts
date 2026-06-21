import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import * as crypto from 'crypto';
import { User } from '../user/entities/user.entity';
import { EncryptionService } from '../utils/encryption.service';

/**
 * ApiKeyAuthGuard: Búsqueda O(1) por hash determinista del apiKey.
 *
 * ESTRATEGIA:
 * 1. Cliente envía apiKey en bruto en X-API-KEY.
 * 2. Guard computa HMAC-SHA256 del apiKey (determinista, sin IV).
 * 3. Busca en DB por apiKeyHash (indexed unique) en UNA query.
 * 4. Si encuentra → descifra el apiKey almacenado y lo verifica.
 *    (Protección contra collision: dos clientes distintos con apiKey identical
 *     tendrían el mismo hash y compartirían el usuario, pero como apiKeyHash
 *     es UNIQUE en la DB, la creación del segundo fallaría.)
 *
 * MITIGACIÓN DE ATAQUES:
 * - DoS: antes O(n) (full table scan + descifrado en loop).
 *   Ahora: O(1) (indexed lookup).
 * - Timing: la búsqueda no expone información sobre cantidad de usuarios.
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyAuthGuard.name);
  private encryptionService = new EncryptionService();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private computeApiKeyHash(apiKey: string): string {
    const hashSecret = process.env.API_KEY_HASH_SECRET;
    if (!hashSecret) {
      throw new Error('API_KEY_HASH_SECRET is required');
    }
    return crypto
      .createHmac('sha256', hashSecret)
      .update(apiKey)
      .digest('hex');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new UnauthorizedException('Falta cabecera X-API-KEY');
    }

    // Compute hash deterministically (no IV).
    const apiKeyHash = this.computeApiKeyHash(apiKey);

    // O(1) lookup: indexed unique column.
    const matchedUser = await this.userRepository.findOne({
      where: { apiKeyHash },
    });

    if (!matchedUser) {
      // Fail-closed: sin hash match, rechazar.
      throw new ForbiddenException('API key inválida');
    }

    // Descifrar y verificar (doble-check por seguridad, aunque el hash ya es suficiente).
    try {
      const decryptedKey = this.encryptionService.decrypt(matchedUser.apiKey);
      if (decryptedKey !== apiKey) {
        this.logger.warn(
          `API key hash collision o descifrado fallido para user ${matchedUser.id}`,
        );
        throw new ForbiddenException('API key inválida');
      }
    } catch (err) {
      this.logger.error(
        `Error descifrando apiKey para user ${matchedUser.id}: ${err.message}`,
      );
      throw new ForbiddenException('API key inválida');
    }

    req['user'] = matchedUser;
    return true;
  }
}
