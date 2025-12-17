import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(createUserInput: CreateUserInput) {
        const hashedPassword = await bcrypt.hash(createUserInput.password || 'default', 10);
        return this.prisma.user.create({
            data: {
                ...createUserInput,
                password: hashedPassword,
            },
        });
    }

    async findAll() {
        return this.prisma.user.findMany();
    }

    async findOne(email: string) {
        return this.prisma.user.findUnique({ where: { email } });
    }

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id },
            include: {
                vetProfile: {
                    include: {
                        clinic: true,
                    },
                },
            },
        });
    }
    async update(id: string, updateUserInput: any) {
        // Exclude password from simple update if it accidentally gets here (though it shouldn't via DTO)
        const { password, ...data } = updateUserInput;
        return this.prisma.user.update({
            where: { id },
            data,
        });
    }
}
