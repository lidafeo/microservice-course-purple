import { Controller, Get, Logger, UseGuards } from '@nestjs/common';
import { JWTAuthGuard } from '../guards/jwt.guard';
import { UserId } from '../guards/user.decorator';
import { Cron } from '@nestjs/schedule';

@Controller('user')
export class UserController {
  constructor() {}

  @UseGuards(JWTAuthGuard)
  @Get('info')
  async info(@UserId() userId: string) {
    return userId;
  }

  @Cron('*/5 * * * * *')
  async cron() {
    Logger.log('Done');
  }
}
