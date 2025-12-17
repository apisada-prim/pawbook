import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateVaccineRecordInput {
    @Field()
    petId: string;

    @Field()
    vaccineMasterId: string;

    @Field({ nullable: true })
    dateAdministered?: Date;

    // Vet ID will be taken from context
}
