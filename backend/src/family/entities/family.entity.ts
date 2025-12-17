import { ObjectType, Field, ID } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class Family {
    @Field(() => ID)
    id: string;

    @Field()
    name: string;

    @Field(() => User, { nullable: true })
    owner?: User;

    @Field()
    ownerId: string;

    @Field(() => [User], { nullable: 'itemsAndList' })
    members?: User[];

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
