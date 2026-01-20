import { InputType, Field } from '@nestjs/graphql';
import { Species, Gender } from '@prisma/client';

@InputType()
export class PowerStatInput {
    @Field()
    label: string;

    @Field()
    value: number;
}

@InputType()
export class SocialLinksInput {
    @Field({ nullable: true })
    facebook?: string;

    @Field({ nullable: true })
    instagram?: string;

    @Field({ nullable: true })
    tiktok?: string;

    @Field({ nullable: true })
    youtube?: string;
}

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

    @Field(() => Boolean, { nullable: true, defaultValue: false })
    isLost?: boolean;

    @Field(() => String, { nullable: true })
    image?: string;

    @Field(() => [String], { nullable: true })
    socialTags?: string[];

    @Field(() => [PowerStatInput], { nullable: true })
    powerStats?: PowerStatInput[];

    @Field(() => SocialLinksInput, { nullable: true })
    socialLinks?: SocialLinksInput;

    @Field(() => [String], { nullable: true })
    favoriteThings?: string[];

    @Field(() => [String], { nullable: true })
    secretHabits?: string[];
}
