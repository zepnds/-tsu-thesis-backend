import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../entities/User.entity';
import { MailingService } from '../library/mailing/mailing.service';
import { ApiResponse } from '../common/dto/response.dto';

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
      select: ['id', 'uid', 'username', 'email', 'password_hash', 'role', 'first_name', 'last_name', 'address', 'phone'],
    });

    if (!user) {
      return ApiResponse.error('Invalid credentials', null, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(pass, user.password_hash);
    if (!isMatch) {
      return ApiResponse.error('Invalid credentials', null, 'INVALID_CREDENTIALS');
    }

    const payload = { id: user.id, role: user.role, username: user.username, email: user.email, address: user.address, phone: user.phone, first_name: user.first_name, last_name: user.last_name };
    const { password_hash, ...result } = user;

    return ApiResponse.success('Login successful', {
      token: this.jwtService.sign(payload),
      user: result,
    });
  }

  async sendRegistrationOtp(email: string, username: string, phone: string) {

    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser) {
      console.log(`[AuthService] Username already taken: ${username}`);
      return ApiResponse.error('Username already taken', null, 'USERNAME_ALREADY_TAKEN');
    }

    const existingEmail = await this.userRepository.findOne({ where: { email } });
    if (existingEmail) {
      console.log(`[AuthService] Email already registered: ${email}`);
      return ApiResponse.error('Email already registered', null, 'EMAIL_ALREADY_REGISTERED');

    }
    const existingPhone = await this.userRepository.findOne({ where: { phone } });
    if (existingPhone) {
      console.log(`[AuthService] Phone already registered: ${phone}`);
      return ApiResponse.error('Phone already registered', null, 'PHONE_ALREADY_REGISTERED');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[AuthService] Generated OTP: ${otp} for ${email}`);

    // Store OTP with expiration (e.g., 10 minutes = 600000 ms)
    const expires = Date.now() + 600000;
    this.otpStore.set(email, { code: otp, expires });

    try {

      // In production, we MUST send the email
      await this.mailingService.sendOtp(email, otp, 'Account Registration');
      console.log(`[AuthService] OTP email sent successfully to ${email}`);

    } catch (error) {
      console.error(`[AuthService] Failed to send OTP email to ${email}:`, error.message);
      throw new BadRequestException('Failed to send verification email. Please check your SMTP configuration or try again later. Error: ' + error.message);
    }

    return ApiResponse.success('OTP sent successfully to ' + email);
  }

  async register(userData: any) {
    const { otp, email, phone, username, password, role, address, first_name, last_name } = userData;

    // Verify OTP
    if (!otp) {
      return ApiResponse.error('OTP is required for registration', null, 'OTP_REQUIRED');
    }

    const storedOtp = this.otpStore.get(email);
    if (!storedOtp) {
      return ApiResponse.error('OTP not requested or expired', null, 'OTP_NOT_REQUESTED_OR_EXPIRED');
    }

    if (storedOtp.code !== otp) {
      return ApiResponse.error('Invalid OTP', null, 'INVALID_OTP');
    }

    if (Date.now() > storedOtp.expires) {
      this.otpStore.delete(email);
      return ApiResponse.error('OTP has expired', null, 'OTP_EXPIRED');
    }

    // OTP is valid, proceed with registration
    const existingEmail = await this.userRepository.findOne({ where: { email } });
    if (existingEmail)
      return ApiResponse.error('Email already registered', null, 'EMAIL_ALREADY_REGISTERED');

    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser)
      return ApiResponse.error('Username already taken', null, 'USERNAME_ALREADY_TAKEN');

    const existingPhone = await this.userRepository.findOne({ where: { phone } });
    if (existingPhone) throw new BadRequestException('Phone already taken');

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const uid = crypto.randomBytes(2).toString('hex').toUpperCase();

    const newUser = this.userRepository.create({
      first_name,
      last_name,
      email,
      username,
      uid,
      password_hash,
      role: role || 'visitor',
      address,
      phone
    });

    const savedUser = await this.userRepository.save(newUser);

    // Remove OTP from store after successful registration
    this.otpStore.delete(email);

    const { password_hash: _, ...result } = savedUser as any;
    return ApiResponse.success('Registration successful', result);
  }

  async getProfile(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return ApiResponse.success('Profile fetched', user);
  }

  async updateProfile(id: string, updateData: any) {
    // Handle password update
    if (updateData.password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password_hash = await bcrypt.hash(updateData.password, salt);
      delete updateData.password;
    }

    // Map email_address to email if present (from frontend)
    if (updateData.email_address) {
      updateData.email = updateData.email_address;
      delete updateData.email_address;
    }

    // These fields should not be updated via general profile update
    delete updateData.id;
    delete updateData.uid;
    delete updateData.role;

    try {
      await this.userRepository.update(id, updateData);
      const updatedUser = await this.userRepository.findOne({
        where: { id },
        select: ['id', 'uid', 'username', 'email', 'role', 'first_name', 'last_name', 'address', 'phone'],
      });
      return ApiResponse.success('Profile updated successfully', updatedUser);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        if (error.message.includes('email')) {
          return ApiResponse.error('Email already in use', null, 'EMAIL_ALREADY_IN_USE');
        }
        if (error.message.includes('username')) {
          return ApiResponse.error('Username already taken', null, 'USERNAME_ALREADY_TAKEN');
        }
      }
      throw error;
    }
  }

  async logout() {
    return ApiResponse.success('Logged out successfully');
  }
}
