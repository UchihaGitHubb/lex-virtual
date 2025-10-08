import { Controller, Post, Body, UseGuards, Get, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dtos';
import { JwtAuthGuard } from './guards/jwt.guard';
import { WhoAmI } from './dtos/who-am-i.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('whoami')
  async getCurrentUser(@Req() req: { user: WhoAmI }): Promise<WhoAmI> {
    return this.authService.whoAmI(req.user);
  }
}
