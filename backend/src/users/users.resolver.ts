import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
    constructor(private readonly usersService: UsersService) { }

    @Mutation(() => User)
    createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
        return this.usersService.create(createUserInput);
    }

    @Query(() => [User], { name: 'users' })
    @UseGuards(GqlAuthGuard)
    findAll() {
        return this.usersService.findAll();
    }

    @Query(() => User, { name: 'user' })
    findOne(@Args('email') email: string) {
        return this.usersService.findOne(email);
    }

    @Query(() => User)
    @UseGuards(GqlAuthGuard)
    whoAmI(@CurrentUser() user: User) {
        return this.usersService.findById(user.id);
    }
    @Mutation(() => User)
    @UseGuards(GqlAuthGuard)
    updateUser(@CurrentUser() user: any, @Args('updateUserInput') updateUserInput: UpdateUserInput) {
        return this.usersService.update(user.id, updateUserInput);
    }
}
