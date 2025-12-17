import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
    @Field()
    email: string;

    @Field()
    password?: string; // Optional if via social login in future, but mandatory for now logic

    @Field()
    fullName: string;
}
