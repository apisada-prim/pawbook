import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class Clinic {
    @Field(() => ID)
    id: string;

    @Field()
    name: string;

    @Field()
    address: string;

    @Field({ nullable: true })
    phoneNumber?: string;

    @Field()
    isVerified: boolean;
}
