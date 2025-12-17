import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { VaccinesService } from './vaccines.service';
import { VaccineMaster } from './entities/vaccine-master.entity';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { CreateVaccineRecordInput } from './dto/create-vaccine-record.input';
import { CreateLegacyRecordInput } from './dto/create-legacy-record.input';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

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
        return this.vaccinesService.createRecord(user.userId, input);
    }

    @Mutation(() => VaccineRecord)
    @UseGuards(GqlAuthGuard)
    createLegacyRecord(
        @CurrentUser() user: any,
        @Args('input') input: CreateLegacyRecordInput
    ) {
        return this.vaccinesService.createLegacyRecord(user.userId, input);
    }
}
