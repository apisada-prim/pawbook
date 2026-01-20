import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PetsService } from './pets.service';
import { Pet } from './entities/pet.entity';
import { CreatePetInput } from './dto/create-pet.input';
import { UpdatePetInput } from './dto/update-pet.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => Pet)
export class PetsResolver {
    constructor(private readonly petsService: PetsService) { }

    @Mutation(() => Pet)
    @UseGuards(GqlAuthGuard)
    createPet(@CurrentUser() user: any, @Args('createPetInput') createPetInput: CreatePetInput) {
        return this.petsService.create(user.id, createPetInput);
    }

    @Query(() => [Pet], { name: 'myPets' })
    @UseGuards(GqlAuthGuard)
    myPets(
        @CurrentUser() user: any,
        @Args('familyId', { nullable: true }) familyId?: string
    ) {
        if (familyId) {
            return this.petsService.findAllByFamily(familyId);
        }
        return this.petsService.findAllByOwner(user.id);
    }

    @Query(() => [Pet], { name: 'myAlumniPets' })
    @UseGuards(GqlAuthGuard)
    myAlumniPets(@CurrentUser() user: any) {
        return this.petsService.findAlumni(user.id);
    }

    @Query(() => Pet)
    @UseGuards(GqlAuthGuard)
    findOne(@Args('id', { type: () => String }) id: string) {
        return this.petsService.findOne(id);
    }

    @Query(() => Pet, { name: 'publicPet' })
    async findPublicPet(@Args('id', { type: () => String }) id: string) {
        const pet = await this.petsService.findOne(id) as any;
        if (pet && pet.owner && pet.isLost) {
            // Keep phone number if lost
        } else if (pet && pet.owner) {
            // Nullify phone number otherwise
            pet.owner.phoneNumber = null;
        }
        return pet;
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
