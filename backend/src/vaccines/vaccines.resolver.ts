import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { VaccinesService } from './vaccines.service';
import { VaccineMaster } from './entities/vaccine-master.entity';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { CreateVaccineRecordInput } from './dto/create-vaccine-record.input';
import { CreateLegacyRecordInput } from './dto/create-legacy-record.input';
import { VaccineQrOutput } from './dto/vaccine-qr.output';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { Pet } from '../pets/entities/pet.entity';

@Resolver()
export class VaccinesResolver {
    constructor(private readonly vaccinesService: VaccinesService) { }

    @Query(() => [VaccineMaster], { name: 'vaccines' })
    findAll() {
        return this.vaccinesService.findAllMaster();
    }

    @Mutation(() => VaccineRecord)
    @UseGuards(GqlAuthGuard)
    createVaccineRecord(
        @CurrentUser() user: any,
        @Args('input') input: CreateVaccineRecordInput
    ) {
        // Ideally verify role is VET
        return this.vaccinesService.createRecord(user.id, input);
    }

    @Mutation(() => VaccineRecord)
    @UseGuards(GqlAuthGuard)
    createLegacyRecord(
        @CurrentUser() user: any,
        @Args('input') input: CreateLegacyRecordInput
    ) {
        return this.vaccinesService.createLegacyRecord(user.id, input);
    }
    @Mutation(() => VaccineQrOutput)
    @UseGuards(GqlAuthGuard)
    generateVaccineQr(
        @CurrentUser() user: any,
        @Args('petId') petId: string // Use Args explicitly for simpler input
    ) {
        return this.vaccinesService.generateVaccineQr(user.id, petId);
    }

    @Query(() => Pet)
    @UseGuards(GqlAuthGuard)
    verifyVaccineQr(
        @Args('token') token: string
    ) {
        return this.vaccinesService.verifyQrToken(token);
    }

    @Query(() => String)
    @UseGuards(GqlAuthGuard)
    checkVaccineQrStatus(
        @Args('token') token: string
    ) {
        return this.vaccinesService.getQrStatus(token);
    }
}
