import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { compare, hash } from 'bcrypt';
import { Role } from './enums/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { format, subDays } from 'date-fns';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokensRepository: Repository<RefreshToken>,
  ) { }

  async signIn(
    username: string,
    pass: string,
  ): Promise<{
    access_token: string;
    role: Role;
    refresh_token: string;
    id: number;
  }> {
    const user = await this.usersService.findForAuth(username);

    if (!user) {
      throw new NotFoundException();
    }

    if (!this.isPasswordValid(pass, user?.password)) {
      throw new UnauthorizedException();
    }

    const refreshToken = await this.jwtService.signAsync(
      { id: user.id, email: user.email },
      { expiresIn: '30d' },
    );

    await this.storeRefreshToken(user, refreshToken);

    return {
      access_token: await this.generateAccessToken(user),
      refresh_token: refreshToken,
      role: user.role,
      id: user.id,
    };
  }

  async refresh(token: string) {
    const exists = await this.refreshTokensRepository.findOne({
      where: { token },
      relations: { user: true },
    });

    if (!exists) {
      throw new ForbiddenException();
    }

    return { access_token: await this.generateAccessToken(exists.user) };
  }

  private generateAccessToken(user: User): Promise<string> {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      joined: user.joinDate,
    };

    return this.jwtService.signAsync(payload);
  }

  private async isPasswordValid(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return compare(password, hash);
  }

  private storeRefreshToken(user: User, token: string) {
    const refreshToken = this.refreshTokensRepository.create();
    refreshToken.token = token;
    refreshToken.user = user;
    return this.refreshTokensRepository.save(refreshToken);
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    partialUser: User,
  ) {
    const user = await this.usersService.findForAuth(partialUser.email);

    if (!user) {
      throw new NotFoundException();
    }

    if (
      !(await this.isPasswordValid(
        changePasswordDto.currentPassword,
        user.password,
      ))
    ) {
      throw new ForbiddenException();
    }

    user.password = await hash(changePasswordDto.newPassword, 10);

    await this.usersService.update(user.id, user);

    return;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async syncRefreshTokens() {
    // TODO: Should change this to after 30 days?
    const tokens = await this.refreshTokensRepository
      .createQueryBuilder('t')
      .where('t.created < :now', {
        now: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      })
      .getMany();

    for (const token of tokens) {
      await this.refreshTokensRepository.remove(token);
    }
  }
}
