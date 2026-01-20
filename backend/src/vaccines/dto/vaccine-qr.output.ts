import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class VaccineQrOutput {
    @Field()
    token: string;

    @Field()
    expiresAt: string;
}
