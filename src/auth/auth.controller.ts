import { Controller, Post, Body, Get, Req, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  async login(@Body() body: any) {
    return this.authService.login(body.usernameOrEmail, body.password);
  }

  @Post('send-registration-otp')
  async sendRegistrationOtp(@Body() body: any) {
    return this.authService.sendRegistrationOtp(body.email, body.username);
  }

  @Post('register')
  async register(@Body() body: any) {
    return this.authService.register(body);
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    // Note: This will need JwtAuthGuard later
    const userId = req.user?.id || '15';
    return this.authService.getProfile(userId);
  }
}
