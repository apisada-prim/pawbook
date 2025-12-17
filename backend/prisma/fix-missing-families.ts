import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Start fixing missing families...');

    // Find users who have NO owned family or NO defaultFamilyId
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { defaultFamilyId: null },
                {
                    ownedFamily: null // This might be tricky if it's a relation check, but let's check explicit null defaultFamilyId first or query those without ownedFamily
                }
            ]
        },
        include: {
            ownedFamily: true
        }
    });

    console.log(`Found ${users.length} users to check.`);

    for (const user of users) {
        // Double check if they really don't have an owned family
        // If they have an owned family but defaultFamilyId is null, just link it.
        // If they have neither, create one.

        let familyId = user.defaultFamilyId;
        const ownedFamily = user.ownedFamily;

        if (ownedFamily) {
            console.log(`User ${user.fullName} (${user.email}) has owned family but might be missing defaultFamilyId.`);
            familyId = ownedFamily.id;
        } else {
            console.log(`User ${user.fullName} (${user.email}) has NO family. Creating 'My Pets'...`);

            // Create family
            const newFamily = await prisma.family.create({
                data: {
                    name: 'My Pets',
                    ownerId: user.id,
                    members: {
                        connect: { id: user.id }
                    }
                }
            });
            familyId = newFamily.id;
        }

        // Update User
        if (familyId && user.defaultFamilyId !== familyId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { defaultFamilyId: familyId }
            });
            console.log(`Updated user ${user.email} with defaultFamilyId: ${familyId}`);
        } else {
            console.log(`User ${user.email} is already correct.`);
        }
    }

    console.log('Fix complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
