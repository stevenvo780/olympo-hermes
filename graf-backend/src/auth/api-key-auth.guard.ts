import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../user/entities/user.entity';
import { EncryptionService } from '../utils/encryption.service';

@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  private encryptionService = new EncryptionService();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      throw new UnauthorizedException('Falta cabecera X-API-KEY');
    }

    const users = await this.userRepository.find();
    let matchedUser = null;

    for (const user of users) {
      if (user.apiKey) {
        try {
          const decryptedKey = this.encryptionService.decrypt(user.apiKey);
          if (decryptedKey === apiKey) {
            matchedUser = user;
            break;
          }
        } catch {
          continue;
        }
      }
    }

    if (!matchedUser) {
      throw new ForbiddenException('API key inválida');
    }

    req['user'] = matchedUser;
    return true;
  }
}
