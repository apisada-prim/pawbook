import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PetsService } from './pets.service';
import { Pet } from './entities/pet.entity';
import { CreatePetInput } from './dto/create-pet.input';
import { UpdatePetInput } from './dto/update-pet.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Resolver(() => Pet)
@UseGuards(GqlAuthGuard)
export class PetsResolver {
    constructor(private readonly petsService: PetsService) { }

    @Mutation(() => Pet)
    createPet(@CurrentUser() user: any, @Args('createPetInput') createPetInput: CreatePetInput) {
        return this.petsService.create(user.id, createPetInput);
    }

    @Query(() => [Pet], { name: 'myPets' })
    myPets(@CurrentUser() user: any) {
        return this.petsService.findAllByOwner(user.id);
    }

    @Query(() => Pet)
    @UseGuards(GqlAuthGuard)
    findOne(@Args('id', { type: () => String }) id: string) {
        return this.petsService.findOne(id);
    }

    @Mutation(() => Pet)
    @UseGuards(GqlAuthGuard)
    addCoOwner(
        @Args('petId') petId: string,
        @Args('email') email: string
    ) {
        return this.petsService.addCoOwner(petId, email);
    }

    @Mutation(() => Pet)
    @UseGuards(GqlAuthGuard)
    removeCoOwner(
        @Args('petId') petId: string,
        @Args('userId') userId: string
    ) {
        return this.petsService.removeCoOwner(petId, userId);
    }

    @Mutation(() => Pet)
    @UseGuards(GqlAuthGuard)
    updatePet(@Args('updatePetInput') updatePetInput: UpdatePetInput) {
        return this.petsService.update(updatePetInput.id, updatePetInput);
    }

    @Mutation(() => Pet)
    @UseGuards(GqlAuthGuard)
    removePet(@Args('id', { type: () => String }) id: string) {
        return this.petsService.remove(id);
    }
}
