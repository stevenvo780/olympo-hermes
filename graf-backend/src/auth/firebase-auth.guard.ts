import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Request } from 'express';
import { User } from '../user/entities/user.entity';
import admin from '../utils/firebase-admin.config';
import { EncryptionService } from '../utils/encryption.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private encryptionService = new EncryptionService();

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'] as string;
    const authHeader = request.headers.authorization;

    if (apiKey) {
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

      request['user'] = matchedUser;
      request['apiKey'] = apiKey;
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;

      if (!userId) {
        throw new UnauthorizedException('Invalid token: No user ID found');
      }

      const user = await this.userRepository.findOne({ where: { id: userId } });

      if (!user) {
        throw new UnauthorizedException(
          'User not found in database. Please register first.',
        );
      }

      request['user'] = user;
      request['token'] = token;

      return true;
    } catch (error) {
      console.error('Firebase auth error:', error);

      if (
        error instanceof UnauthorizedException ||
        error instanceof ForbiddenException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      if (error.code) {
        switch (error.code) {
          case 'auth/id-token-expired':
            throw new UnauthorizedException('Token has expired');
          case 'auth/invalid-id-token':
            throw new UnauthorizedException('Invalid token');
          case 'auth/argument-error':
            throw new UnauthorizedException('Token argument error');
          case 'auth/user-disabled':
            throw new ForbiddenException('User account is disabled');
          case 'auth/user-not-found':
            throw new UnauthorizedException('User not found');
          case 'auth/requires-recent-login':
            throw new UnauthorizedException('Recent login required');
          case 'auth/invalid-credential':
            throw new UnauthorizedException('Invalid credential');
          default:
            console.error(
              'Unhandled Firebase error code:',
              error.code,
              error.message,
            );
            throw new InternalServerErrorException(
              'Unexpected authentication error',
            );
        }
      } else {
        if (error.message && error.message.includes('Database')) {
          throw error;
        }
        throw new UnauthorizedException('Invalid token');
      }
    }
  }
}
