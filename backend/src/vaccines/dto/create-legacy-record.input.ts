import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateLegacyRecordInput {
    @Field()
    petId: string;

    @Field()
    vaccineMasterId: string;

    @Field()
    dateAdministered: Date;

    @Field()
    stickerImage: string; // URL
}
