import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccineRecordInput } from './dto/create-vaccine-record.input';
import { JwtService } from '@nestjs/jwt';
import { VaccineQrOutput } from './dto/vaccine-qr.output';

@Injectable()
export class VaccinesService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

    findAllMaster() {
        return this.prisma.vaccineMaster.findMany();
    }

    async createRecord(userId: string, input: CreateVaccineRecordInput) {
        const vetProfile = await this.prisma.vetProfile.findUnique({
            where: { userId }
        });

        if (!vetProfile) {
            throw new Error("Vet profile not found for this user");
        }

        if (input.qrToken) {
            await this.verifyAndUseQrToken(input.qrToken, input.petId);
        }

        return this.prisma.vaccineRecord.create({
            data: {
                petId: input.petId,
                vaccineMasterId: input.vaccineMasterId,
                dateAdministered: input.dateAdministered || new Date(),
                nextDueDate: input.nextDueDate,
                vetId: vetProfile.id, // Correct VetProfile ID
                clinicId: vetProfile.clinicId, // Persist Clinic ID
                isVerified: true, // Created by vet
                stickerImage: input.stickerImage,
            },
            include: {
                vaccine: true,
                pet: true,
            },
        });
    }

    createLegacyRecord(ownerId: string, input: any) {
        // Ideally check if owner owns the pet
        return this.prisma.vaccineRecord.create({
            data: {
                petId: input.petId,
                vaccineMasterId: input.vaccineMasterId,
                dateAdministered: input.dateAdministered,
                nextDueDate: input.nextDueDate,
                stickerImage: input.stickerImage,
                lotNumber: input.lotNumber,
                isVerified: false,
                // vetId and clinicId are null
            },
            include: {
                vaccine: true,
                pet: true,
            },
        });
    }

    async generateVaccineQr(userId: string, petId: string): Promise<VaccineQrOutput> {
        // 1. Verify ownership
        const pet = await this.prisma.pet.findFirst({
            where: { id: petId, ownerId: userId },
        });

        if (!pet) {
            throw new Error("You do not have permission to generate a QR for this pet.");
        }

        // 2. Generate Token
        // First check if there is a valid existing token
        const existingToken = await this.prisma.vaccineQrToken.findFirst({
            where: {
                petId: petId,
                createdByUserId: userId,
                isUsed: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        if (existingToken) {
            return {
                token: existingToken.token,
                expiresAt: existingToken.expiresAt.toISOString(),
            };
        }

        // Create DB Record first
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now

        // Create the token string
        // We embed the DB ID in the token so we can look it up efficiently, or just use the whole token as the key
        // For simplicity, let's just generate a JWT and store it.
        const payload = {
            sub: userId,
            petId: petId,
            type: 'VACCINE_ACCESS',
            timestamp: Date.now(),
            nonce: Math.random().toString(36).substring(7), // Random nonce to prevent collision
        };
        const token = this.jwtService.sign(payload);

        await this.prisma.vaccineQrToken.create({
            data: {
                token: token,
                petId: petId,
                createdByUserId: userId,
                expiresAt: expiresAt,
            }
        });

        return {
            token,
            expiresAt: expiresAt.toISOString(),
        };
    }

    async verifyQrToken(token: string) {
        // 1. Verify JWT signature first (stateless check)
        try {
            this.jwtService.verify(token); // Throws if invalid signature
        } catch (e) {
            throw new Error("Invalid QR Code Signature");
        }

        // 2. Check DB State
        const qrRecord = await this.prisma.vaccineQrToken.findUnique({
            where: { token },
            include: {
                pet: {
                    include: {
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
                }
            }
        });

        if (!qrRecord) {
            throw new Error("QR Code not found or invalid.");
        }

        if (qrRecord.isUsed) {
            throw new Error("This QR Code has already been used.");
        }

        if (new Date() > qrRecord.expiresAt) {
            throw new Error("This QR Code has expired.");
        }

        // Return the associated Pet
        return qrRecord.pet;
    }

    private async verifyAndUseQrToken(token: string, intendedPetId: string) {
        // Similar validation but marks as used
        const qrRecord = await this.prisma.vaccineQrToken.findUnique({
            where: { token }
        });

        if (!qrRecord) {
            throw new Error("Invalid QR Token provided.");
        }

        if (qrRecord.petId !== intendedPetId) {
            throw new Error("QR Token does not match the pet being vaccinated.");
        }

        if (qrRecord.isUsed) {
            throw new Error("This QR Code has already been used.");
        }

        if (new Date() > qrRecord.expiresAt) {
            throw new Error("This QR Code has expired.");
        }

        // Mark as used
        await this.prisma.vaccineQrToken.update({
            where: { id: qrRecord.id },
            data: {
                isUsed: true,
                usedAt: new Date(),
            }
        });
    }

    async getQrStatus(token: string) {
        const qrRecord = await this.prisma.vaccineQrToken.findUnique({
            where: { token }
        });

        if (!qrRecord) {
            return "INVALID";
        }

        if (qrRecord.isUsed) {
            return "USED";
        }

        if (new Date() > qrRecord.expiresAt) {
            return "EXPIRED";
        }

        return "ACTIVE";
    }
}
