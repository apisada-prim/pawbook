import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginResponse } from './dto/login-response';
import { LoginInput } from './dto/login.input';
import { CreateUserInput } from '../users/dto/create-user.input';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Resolver()
export class AuthResolver {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService
    ) { }

    @Mutation(() => LoginResponse)
    login(@Args('loginInput') loginInput: LoginInput) {
        return this.authService.login(loginInput);
    }

    @Mutation(() => User)
    signup(@Args('signupInput') signupInput: CreateUserInput) {
        return this.usersService.create(signupInput);
    }
}
