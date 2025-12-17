import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { CreatePetInput } from './dto/create-pet.input';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

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

    // findAllByOwner is now wrapper/legacy, we prefer findAllByFamily
    async findAllByOwner(ownerId: string) {
        // Default behavior: Find pets of the family owned by this user
        const family = await this.prisma.family.findUnique({ where: { ownerId } });
        if (!family) {
            // Fallback: just return pets directly owned (if no family created yet, though unlikely with new logic)
            return this.prisma.pet.findMany({ where: { ownerId } });
        }
        return this.prisma.pet.findMany({ where: { ownerId: family.ownerId } });
    }

    async findAllByFamily(familyId: string) {
        const family = await this.prisma.family.findUnique({ where: { id: familyId } });
        if (!family) throw new NotFoundException('Family not found');
        return this.prisma.pet.findMany({ where: { ownerId: family.ownerId } });
    }

    async findAllByFamilyOwner(familyOwnerId: string) {
        return this.prisma.pet.findMany({ where: { ownerId: familyOwnerId } });
    }

    async findAlumni(userId: string) {
        return this.prisma.pet.findMany({
            where: {
                pastOwners: {
                    some: { id: userId }
                }
            }
        });
    }

    findOne(id: string) {
        return this.prisma.pet.findUnique({
            where: { id },
            include: {
                pastOwners: true,
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

    async generateTransferCode(petId: string, userId: string) {
        const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
        if (!pet) throw new NotFoundException('Pet not found');
        if (pet.ownerId !== userId) throw new ForbiddenException('You do not own this pet');

        const code = randomBytes(4).toString('hex').toUpperCase(); // 8 chars
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry

        return this.prisma.pet.update({
            where: { id: petId },
            data: {
                transferCode: code,
                transferExpiresAt: expiresAt
            }
        });
    }

    async claimPet(code: string, newOwnerId: string) {
        const pet = await this.prisma.pet.findFirst({
            where: {
                transferCode: code,
                transferExpiresAt: { gt: new Date() }
            },
            include: { owner: true } // Previous owner
        });

        if (!pet) throw new BadRequestException('Invalid or expired transfer code');
        if (pet.ownerId === newOwnerId) throw new BadRequestException('You already own this pet');

        const oldOwnerId = pet.ownerId;

        // Transaction: Update owner, Add to pastOwners, Clear code
        return this.prisma.pet.update({
            where: { id: pet.id },
            data: {
                ownerId: newOwnerId,
                transferCode: null,
                transferExpiresAt: null,
                pastOwners: {
                    connect: { id: oldOwnerId }
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
}
