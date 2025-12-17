import { Injectable } from '@nestjs/common';
import { CreatePetInput } from './dto/create-pet.input';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PetsService {
    constructor(private prisma: PrismaService) { }

    create(ownerId: string, createPetInput: CreatePetInput) {
        return this.prisma.pet.create({
            data: {
                ...createPetInput,
                ownerId,
            },
        });
    }

    findAllByOwner(ownerId: string) {
        return this.prisma.pet.findMany({
            where: {
                OR: [
                    { ownerId },
                    { coOwners: { some: { id: ownerId } } }
                ]
            },
        });
    }

    findOne(id: string) {
        return this.prisma.pet.findUnique({
            where: { id },
            include: {
                coOwners: true, // Include co-owners
                vaccinations: {
                    include: {
                        vaccine: true,
                        vet: {
                            include: {
                                user: true,
                                clinic: true
                            }
                        },
                        clinic: true
                    },
                    orderBy: {
                        dateAdministered: 'desc'
                    }
                }
            }
        });
    }

    async addCoOwner(petId: string, email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) throw new Error('User not found');

        return this.prisma.pet.update({
            where: { id: petId },
            data: {
                coOwners: {
                    connect: { id: user.id }
                }
            }
        });
    }

    update(id: string, updatePetInput: any) {
        const { id: _, ...data } = updatePetInput;
        return this.prisma.pet.update({
            where: { id },
            data
        });
    }

    remove(id: string) {
        return this.prisma.pet.delete({
            where: { id }
        });
    }

    async removeCoOwner(petId: string, userId: string) {
        return this.prisma.pet.update({
            where: { id: petId },
            data: {
                coOwners: {
                    disconnect: { id: userId }
                }
            }
        });
    }
}
