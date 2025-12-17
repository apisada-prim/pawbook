import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateLegacyRecordInput {
    @Field()
    petId: string;

    @Field()
    vaccineMasterId: string;

    @Field()
    dateAdministered: Date;

    @Field({ nullable: true })
    nextDueDate?: Date;

    @Field()
    stickerImage: string; // URL
}
