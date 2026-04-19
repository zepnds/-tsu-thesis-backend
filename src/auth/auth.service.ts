import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/User.entity';
import { MailingService } from '../library/mailing/mailing.service';

@Injectable()
export class AuthService {
  // Temporary in-memory OTP store. Map key is the email address.
  private otpStore = new Map<string, { code: string, expires: number }>();

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private mailingService: MailingService,
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

  async sendRegistrationOtp(email: string, username: string) {
    // Check if user already exists before sending OTP
    const existingEmail = await this.userRepository.findOne({ where: { email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) throw new ConflictException('Username already taken');

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store OTP with expiration (e.g., 10 minutes = 600000 ms)
    const expires = Date.now() + 600000;
    this.otpStore.set(email, { code: otp, expires });

    // Send email
    await this.mailingService.sendOtp(email, otp, 'Account Registration');

    return { success: true, message: 'OTP sent successfully to ' + email };
  }

  async register(userData: any) {
    const { otp, email, username, password, role, ...rest } = userData;

    // Verify OTP
    if (!otp) {
      throw new BadRequestException('OTP is required for registration');
    }

    const storedOtp = this.otpStore.get(email);
    if (!storedOtp) {
      throw new BadRequestException('OTP not requested or expired');
    }

    if (storedOtp.code !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (Date.now() > storedOtp.expires) {
      this.otpStore.delete(email);
      throw new UnauthorizedException('OTP has expired');
    }

    // OTP is valid, proceed with registration
    const existingEmail = await this.userRepository.findOne({ where: { email } });
    if (existingEmail) throw new ConflictException('Email already registered');

    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) throw new ConflictException('Username already taken');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();

    const newUser = this.userRepository.create({
      ...rest,
      email,
      username,
      uid,
      password_hash,
      role: role || 'visitor',
    });

    const savedUser = await this.userRepository.save(newUser);

    // Remove OTP from store after successful registration
    this.otpStore.delete(email);

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
