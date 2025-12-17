import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { VetProfile } from './vet-profile.entity';

registerEnumType(UserRole, {
    name: 'UserRole',
});

@ObjectType()
export class User {
    @Field(() => ID)
    id: string;

    @Field()
    email: string;

    @Field()
    fullName: string;

    @Field(() => UserRole)
    role: UserRole;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;

    @Field(() => VetProfile, { nullable: true })
    vetProfile?: VetProfile;

    @Field({ nullable: true })
    image?: string;

    @Field({ nullable: true })
    address?: string;

    @Field({ nullable: true })
    phoneNumber?: string;

    @Field({ nullable: true })
    defaultFamilyId?: string;
}
