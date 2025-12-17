import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVaccineRecordInput } from './dto/create-vaccine-record.input';

@Injectable()
export class VaccinesService {
    constructor(private prisma: PrismaService) { }

    findAllMaster() {
        return this.prisma.vaccineMaster.findMany();
    }

    createRecord(vetId: string, input: CreateVaccineRecordInput) {
        return this.prisma.vaccineRecord.create({
            data: {
                petId: input.petId,
                vaccineMasterId: input.vaccineMasterId,
                dateAdministered: input.dateAdministered || new Date(),
                nextDueDate: input.nextDueDate,
                vetId,
                isVerified: true, // Created by vet
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
                isVerified: false,
                // vetId and clinicId are null
            },
            include: {
                vaccine: true,
                pet: true,
            },
        });
    }
}
