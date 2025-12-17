import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Species, Gender } from '@prisma/client';
import { VaccineRecord } from '../../vaccines/entities/vaccine-record.entity';
import { User } from '../../users/entities/user.entity';

registerEnumType(Species, { name: 'Species' });
registerEnumType(Gender, { name: 'Gender' });

@ObjectType()
export class Pet {
    @Field(() => ID)
    id: string;

    @Field()
    ownerId: string;

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

    @Field(() => String, { nullable: true })
    image?: string;

    @Field(() => Boolean)
    isSterilized: boolean;

    @Field(() => String, { nullable: true })
    chronicDiseases?: string;

    @Field(() => User, { nullable: true })
    owner?: User;

    @Field(() => String, { nullable: true })
    transferCode?: string;

    @Field(() => Date, { nullable: true })
    transferExpiresAt?: Date;

    @Field(() => [User], { nullable: 'itemsAndList' })
    pastOwners?: User[];

    @Field(() => [VaccineRecord], { nullable: true })
    vaccinations?: VaccineRecord[];
}

