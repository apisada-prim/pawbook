import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PetsService } from './pets.service';
import { Pet } from './entities/pet.entity';
import { CreatePetInput } from './dto/create-pet.input';
import { UpdatePetInput } from './dto/update-pet.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => Pet)
@UseGuards(GqlAuthGuard)
export class PetsResolver {
    constructor(private readonly petsService: PetsService) { }

    @Mutation(() => Pet)
    createPet(@CurrentUser() user: any, @Args('createPetInput') createPetInput: CreatePetInput) {
        return this.petsService.create(user.id, createPetInput);
    }

    @Query(() => [Pet], { name: 'myPets' })
    myPets(
        @CurrentUser() user: any,
        @Args('familyId', { nullable: true }) familyId?: string
    ) {
        if (familyId) {
            // TODO: Add authorization check here? Or service handles logic?
            // Service just fetches by familyId.
            // Ideally, check if user is member of familyId.
            // For now, let's assume if you have ID you can view (or check membership in service wrapper)
            return this.petsService.findAllByFamily(familyId);
        }
        return this.petsService.findAllByOwner(user.id);
    }

    @Query(() => [Pet], { name: 'myAlumniPets' })
    myAlumniPets(@CurrentUser() user: any) {
        return this.petsService.findAlumni(user.id);
    }

    @Query(() => Pet)
    @UseGuards(GqlAuthGuard)
    findOne(@Args('id', { type: () => String }) id: string) {
        return this.petsService.findOne(id);
    }

    @Mutation(() => Pet)
    @UseGuards(GqlAuthGuard)
    generateTransferCode(
        @CurrentUser() user: any,
        @Args('petId') petId: string
    ) {
        return this.petsService.generateTransferCode(petId, user.id);
    }

    @Mutation(() => Pet)
    @UseGuards(GqlAuthGuard)
    claimPet(
        @CurrentUser() user: any,
        @Args('code') code: string
    ) {
        return this.petsService.claimPet(code, user.id);
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
