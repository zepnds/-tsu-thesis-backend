import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/User.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }

  async login(identifier: string, pass: string) {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { username: identifier }],
      select: ['id', 'uid', 'username', 'email', 'password_hash', 'role', 'first_name', 'last_name'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { id: user.id, role: user.role, username: user.username, email: user.email };
    const { password_hash, ...result } = user;

    return {
      token: this.jwtService.sign(payload),
      user: result,
    };
  }

  async register(userData: any) {
    const existingEmail = await this.userRepository.findOne({ where: { email: userData.email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUser = await this.userRepository.findOne({ where: { username: userData.username } });
    if (existingUser) throw new ConflictException('Username already taken');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(userData.password, salt);

    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();

    const newUser = this.userRepository.create({
      ...userData,
      uid,
      password_hash,
      role: userData.role || 'visitor',
    });

    const savedUser = await this.userRepository.save(newUser);
    const { password_hash: _, ...result } = savedUser as any;
    return result;
  }

  async getProfile(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, updateData: any) {
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }
    await this.userRepository.update(id, updateData);
    return this.getProfile(id);
  }
}
