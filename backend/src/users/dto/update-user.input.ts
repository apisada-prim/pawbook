import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
    @Field({ nullable: true })
    image?: string;

    @Field({ nullable: true })
    address?: string;

    @Field({ nullable: true })
    phoneNumber?: string;
}
