import { ObjectType, Field, ID } from '@nestjs/graphql';
import { VaccineMaster } from './vaccine-master.entity';
import { Pet } from '../../pets/entities/pet.entity';
import { VetProfile } from '../../users/entities/vet-profile.entity';
import { Clinic } from '../../users/entities/clinic.entity';

@ObjectType()
export class VaccineRecord {
    @Field(() => ID)
    id: string;

    @Field()
    petId: string;

    @Field(() => Pet)
    pet: Pet;

    @Field()
    vaccineMasterId: string;

    @Field(() => VaccineMaster)
    vaccine: VaccineMaster;

    @Field()
    dateAdministered: Date;

    @Field({ nullable: true })
    nextDueDate?: Date;

    @Field({ nullable: true })
    stickerImage?: string;

    @Field({ nullable: true })
    clinicId?: string;

    @Field(() => Clinic, { nullable: true })
    clinic?: Clinic;

    @Field({ nullable: true })
    vetId?: string;

    @Field(() => VetProfile, { nullable: true })
    vet?: VetProfile;

    @Field()
    isVerified: boolean;
}
