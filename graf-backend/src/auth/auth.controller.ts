import {
  Controller,
  Post,
  Body,
  Request,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiCreatedResponse } from '@nestjs/swagger';
import { User, UserRole } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import admin from '@/utils/firebase-admin.config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({
    description: 'User registered successfully',
    type: User,
  })
  async register(@Request() req, @Body() userData: Partial<User>) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;
      const existingUser = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (existingUser) {
        return existingUser;
      }

      const newUser = this.userRepository.create({
        id: userId,
        email: userData.email,
        name: userData.name,
        role: userData.role || UserRole.CUSTOMER,
      });

      const savedUser = await this.userRepository.save(newUser);
      return savedUser;
    } catch (error) {
      console.error('Error in register:', error);
      throw error;
    }
  }

  @Post('test-user')
  @ApiOperation({ summary: 'Test endpoint to check user after registration' })
  async testUser(@Request() req, @Body() testData: Record<string, unknown>) {
    const token = req.headers.authorization?.split('Bearer ')[1];
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      const userId = decodedToken.uid;
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      return {
        decodedToken: { uid: decodedToken.uid, email: decodedToken.email },
        userInDb: user,
        testData,
      };
    } catch (error) {
      console.error('Test user error:', error);
      throw error;
    }
  }
}
