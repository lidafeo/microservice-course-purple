import { Injectable } from '@nestjs/common';
import { AccountRegister } from '@purple/contracts';
import { UserRepository } from '../user/repositories/user.repository';
import { UserEntity } from '../user/entities/user.entity';
import { UserRole } from '@purple/interfaces';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService
  ) {}

  async register({ email, password, displayName }: AccountRegister.Request) {
    const oldUser = await this.userRepository.findUser(email);
    if (oldUser) {
      throw new Error('User already exists');
    }
    const newUserEntity = await new UserEntity({
      displayName,
      email,
      passwordHash: '',
      role: UserRole.Student
    }).setPassword(password);
    const newUser = await this.userRepository.createUser(newUserEntity);
    return { email: newUser.email };
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findUser(email);
    if (!user) {
      throw new Error('Login or password is incorrect');
    }
    const userEntity = new UserEntity(user);
    const isCorrectPassword = await userEntity.validatePassword(password);
    if (!isCorrectPassword) {
      throw new Error('Login or password is incorrect');
    }
    return { id: user._id };
  }

  async login(id: string) {
    return {
      access_token: await this.jwtService.signAsync({ id })
    };
  }
}
