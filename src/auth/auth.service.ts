import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { hash, verify } from 'argon2';
import jwtConfig from 'src/config/jwt.config';
import refreshConfig from 'src/config/refresh.config';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/modules/users/users.service';
import { ChangePasswordDto, CreateUserDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    @Inject(jwtConfig.KEY)
    private jwtTokenConfig: ConfigType<typeof jwtConfig>,
    @Inject(refreshConfig.KEY)
    private refreshTokenConfig: ConfigType<typeof refreshConfig>,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // Delegate user creation to the UsersService
    const user = await this.usersService.create(createUserDto);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.excludePassword(user),
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersService.findByEmail(email);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await verify(user.password, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: this.excludePassword(user),
      ...tokens,
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenValid = await verify(
      user.hashedRefreshToken,
      refreshToken,
    );

    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  async changePassword(email: string, changePasswordDto: ChangePasswordDto) {
    const { oldPassword, newPassword } = changePasswordDto;
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await verify(user.password, oldPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const hashedPassword = await hash(newPassword);
    await this.usersService.update(user.id, {
      password: hashedPassword,
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.jwtTokenConfig.secret,
        expiresIn: this.jwtTokenConfig.signOptions?.expiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.refreshTokenConfig.secret,
        expiresIn: this.refreshTokenConfig?.expiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { hashedRefreshToken },
    });
  }

  private excludePassword(user: any) {
    const { password, hashedRefreshToken, ...result } = user;
    return result;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (user && user.isActive && (await verify(user.password, password))) {
      return this.excludePassword(user);
    }
    return null;
  }
}
