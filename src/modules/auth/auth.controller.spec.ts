import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/create-auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockAuthService = {
    createAccount: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create an account', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password',
      };
      mockAuthService.createAccount.mockResolvedValue('account created');

      const result = await controller.createAccount(authDto);

      expect(service.createAccount).toHaveBeenCalledWith(authDto);
      expect(result).toEqual('account created');
    });
  });

  describe('login', () => {
    it('should login a user', async () => {
      const authDto: AuthDto = {
        email: 'test@example.com',
        password: 'password',
      };
      mockAuthService.login.mockResolvedValue('login successful');

      const result = await controller.login(authDto);

      expect(service.login).toHaveBeenCalledWith(authDto);
      expect(result).toEqual('login successful');
    });
  });
});
