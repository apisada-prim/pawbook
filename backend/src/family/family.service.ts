import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FamilyService {
    constructor(private prisma: PrismaService) { }

    async findOne(id: string) {
        return this.prisma.family.findUnique({
            where: { id },
            include: { members: true, owner: true },
        });
    }

    async findWrapperByOwner(ownerId: string) {
        return this.prisma.family.findUnique({
            where: { ownerId },
            include: { members: true, owner: true },
        });
    }

    async findMyFamilies(userId: string) {
        // Return owned family and joined families
        const owned = await this.prisma.family.findUnique({
            where: { ownerId: userId },
            include: { owner: true, members: true },
        });

        const joined = await this.prisma.family.findMany({
            where: {
                members: {
                    some: { id: userId },
                },
                NOT: {
                    ownerId: userId // Exclude families owned by this user
                }
            },
            include: { owner: true, members: true },
        });

        return { owned, joined };
    }

    async create(ownerId: string, name: string = 'My Pets') {
        // Check if already exists
        const existing = await this.prisma.family.findUnique({ where: { ownerId } });
        if (existing) return existing;

        return this.prisma.family.create({
            data: {
                name,
                ownerId,
            },
        });
    }

    async updateName(ownerId: string, name: string) {
        if (name.length > 10) {
            throw new BadRequestException('Family name must be 10 characters or less.');
        }
        // Ensure user owns the family
        const family = await this.prisma.family.findUnique({ where: { ownerId } });
        if (!family) throw new NotFoundException('Family not found');

        return this.prisma.family.update({
            where: { id: family.id },
            data: { name },
        });
    }

    async inviteMember(ownerId: string, email: string) {
        const family = await this.prisma.family.findUnique({ where: { ownerId } });
        if (!family) throw new NotFoundException('Family not found. Please create one first.');

        const userToAdd = await this.prisma.user.findUnique({ where: { email } });
        if (!userToAdd) throw new NotFoundException('User not found');
        if (userToAdd.id === ownerId) throw new BadRequestException('Cannot invite yourself');

        return this.prisma.family.update({
            where: { id: family.id },
            data: {
                members: {
                    connect: { id: userToAdd.id },
                },
            },
            include: { members: true },
        });
    }

    async removeMember(ownerId: string, memberId: string) {
        const family = await this.prisma.family.findUnique({ where: { ownerId } });
        if (!family) throw new NotFoundException('Family not found');

        return this.prisma.family.update({
            where: { id: family.id },
            data: {
                members: {
                    disconnect: { id: memberId },
                },
            },
            include: { members: true },
        });
    }

    async leaveFamily(userId: string, familyId: string) {
        return this.prisma.family.update({
            where: { id: familyId },
            data: {
                members: {
                    disconnect: { id: userId },
                },
            },
        });
    }
}
