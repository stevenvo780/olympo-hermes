import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { verifySignature } from 'prizma-contracts';

/**
 * Guard que verifica la firma HMAC-SHA256 del header x-prizma-signature
 * contra el secreto compartido (NOUS_HUB_SECRET o PRIZMA_NOUS_SECRET).
 *
 * Uso típico: endpoints invocados por Nous/Hub que no requieren auth Firebase
 * pero sí autenticación por firma criptográfica.
 */
@Injectable()
export class HmacSignatureGuard implements CanActivate {
  private readonly logger = new Logger(HmacSignatureGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Obtener el secreto compartido
    const secret =
      process.env.NOUS_HUB_SECRET ||
      process.env.PRIZMA_NOUS_SECRET ||
      process.env.HUB_CENTRAL_SECRET;

    if (!secret) {
      this.logger.error(
        'HmacSignatureGuard: ningún secreto (NOUS_HUB_SECRET / PRIZMA_NOUS_SECRET / HUB_CENTRAL_SECRET) configurado',
      );
      throw new InternalServerErrorException(
        'Server signature verification not configured',
      );
    }

    // Obtener la firma del header
    const signature =
      request.headers['x-prizma-signature'] ||
      request.headers['x-nous-signature'];

    if (!signature || typeof signature !== 'string') {
      this.logger.warn('HmacSignatureGuard: header x-prizma-signature faltante');
      throw new UnauthorizedException(
        'Missing x-prizma-signature or x-nous-signature header',
      );
    }

    // Obtener el rawBody (debe estar disponible si se usa RawBodyMiddleware)
    // o construir desde el body parseado
    const rawBody =
      (request as Request & { rawBody?: string }).rawBody ||
      JSON.stringify(request.body);

    // Verificar la firma
    const isValid = verifySignature(rawBody, signature, secret);
    if (!isValid) {
      this.logger.warn(
        `HmacSignatureGuard: firma inválida en ${request.method} ${request.path}`,
      );
      throw new UnauthorizedException('Invalid HMAC signature');
    }

    return true;
  }
}
