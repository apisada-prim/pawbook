import { InputType, Field } from '@nestjs/graphql';
import { Species, Gender } from '@prisma/client';

@InputType()
export class CreatePetInput {
    @Field()
    name: string;

    @Field(() => Species)
    species: Species;

    @Field(() => String, { nullable: true })
    breed?: string;

    @Field()
    birthDate: Date;

    @Field(() => Gender)
    gender: Gender;

    @Field(() => String, { nullable: true })
    microchipNo?: string;

    @Field(() => Boolean, { nullable: true, defaultValue: false })
    isSterilized?: boolean;

    @Field(() => String, { nullable: true })
    chronicDiseases?: string;

    @Field(() => String, { nullable: true })
    image?: string;
}
