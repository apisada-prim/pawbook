import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Clinic } from './clinic.entity';
import { User } from './user.entity';

@ObjectType()
export class VetProfile {
    @Field(() => ID)
    id: string;

    @Field()
    userId: string;

    @Field()
    licenseNumber: string;

    @Field()
    isVerified: boolean;

    @Field({ nullable: true })
    clinicId?: string;

    @Field(() => Clinic, { nullable: true })
    clinic?: Clinic;

    @Field(() => User)
    user: User;
}
