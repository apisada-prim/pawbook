import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding users...');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Create Vet
    const vetEmail = 'vet@pawbook.com';
    const vet = await prisma.user.upsert({
        where: { email: vetEmail },
        update: {},
        create: {
            email: vetEmail,
            password: passwordHash,
            fullName: 'Dr. John Doe',
            role: UserRole.VET,
        },
    });

    // Create Vet Profile
    await prisma.vetProfile.upsert({
        where: { userId: vet.id },
        update: {},
        create: {
            userId: vet.id,
            licenseNumber: 'VET-12345',
            isVerified: true,
        },
    });

    console.log(`Vet created: ${vetEmail} / password123`);

    // 2. Create Owner
    const ownerEmail = 'owner@pawbook.com';
    const owner = await prisma.user.upsert({
        where: { email: ownerEmail },
        update: {},
        create: {
            email: ownerEmail,
            password: passwordHash,
            fullName: 'Jane Smith',
            role: UserRole.OWNER,
        },
    });
    console.log(`Owner created: ${ownerEmail} / password123`);

    // 3. Create Admin
    const adminEmail = 'admin@pawbook.com';
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            password: passwordHash,
            fullName: 'Admin User',
            role: UserRole.ADMIN,
        },
    });
    console.log(`Admin created: ${adminEmail} / password123`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
