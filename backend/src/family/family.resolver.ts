import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { FamilyService } from './family.service';
import { Family } from './entities/family.entity';
import { GqlAuthGuard } from '../auth/gql-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Resolver(() => Family)
@UseGuards(GqlAuthGuard)
export class FamilyResolver {
    constructor(private readonly familyService: FamilyService) { }

    @Query(() => Family, { nullable: true })
    myFamily(@CurrentUser() user: any) {
        return this.familyService.findWrapperByOwner(user.id);
    }

    @Query(() => [Family]) // Returns owned family and joined families as a flat list? Or custom object?
    // Let's return a list for now, simpler for frontend to filter.
    async myFamilies(@CurrentUser() user: any) {
        const result = await this.familyService.findMyFamilies(user.id);
        const list: any[] = [];
        if (result.owned) list.push(result.owned);
        if (result.joined) list.push(...result.joined);
        return list;
    }

    @Mutation(() => Family)
    createFamily(@CurrentUser() user: any, @Args('name', { nullable: true }) name?: string) {
        return this.familyService.create(user.id, name);
    }

    @Mutation(() => Family)
    updateFamilyName(
        @CurrentUser() user: any,
        @Args('name') name: string
    ) {
        return this.familyService.updateName(user.id, name);
    }

    @Mutation(() => Family)
    inviteMember(
        @CurrentUser() user: any,
        @Args('email') email: string
    ) {
        return this.familyService.inviteMember(user.id, email);
    }

    @Mutation(() => Family)
    removeMember(
        @CurrentUser() user: any,
        @Args('memberId') memberId: string
    ) {
        return this.familyService.removeMember(user.id, memberId);
    }

    @Mutation(() => Family)
    leaveFamily(
        @CurrentUser() user: any,
        @Args('familyId') familyId: string
    ) {
        return this.familyService.leaveFamily(user.id, familyId);
    }
}
