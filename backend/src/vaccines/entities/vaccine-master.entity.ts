import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Species } from '@prisma/client';

@ObjectType()
export class VaccineMaster {
    @Field(() => ID)
    id: string;

    @Field()
    name: string;

    @Field()
    brand: string;

    @Field()
    type: string;

    @Field({ nullable: true })
    typeTH?: string;

    @Field(() => Species)
    species: Species;

    @Field()
    isCore: boolean;

    @Field({ nullable: true })
    description?: string;
}
