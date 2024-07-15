import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request as ReqType } from './types/request';
import { ResetTokenPipe } from './pipes/reset-token.pipe';
import { ResetToken } from './entities/reset-token.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.email, signInDto.password);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body('refresh_token') token: string) {
    return this.authService.refresh(token);
  }

  @Post('password/change')
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() request: ReqType,
  ) {
    return this.authService.changePassword(changePasswordDto, request.user);
  }

  @HttpCode(HttpStatus.OK)
  @Post('password/request-reset')
  @Public()
  requestResetPassword(@Body('email') email: string) {
    return this.authService.requestResetPassword(email);
  }

  @HttpCode(HttpStatus.OK)
  @Post('password/reset/:token')
  @Public()
  resetPassword(
    @Param('token', ResetTokenPipe) token: ResetToken,
    @Body('password') password: string,
  ) {
    return this.authService.resetPassword(token, password);
  }

  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
