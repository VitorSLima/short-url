import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/create-auth.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('create-account')
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 409, description: 'User already exists.' })
  createAccount(@Body() data: AuthDto) {
    return this.authService.createAccount(data);
  }

  @Post('login')
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  login(@Body() data: AuthDto) {
    return this.authService.login(data);
  }
}
