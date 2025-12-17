import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Checking for Missing Families ---');

    // Find users who have NO ownedFamily
    const users = await prisma.user.findMany({
        include: {
            ownedFamily: true
        }
    });

    for (const user of users) {
        if (!user.ownedFamily) {
            console.log(`Fixing User: ${user.fullName} (${user.email}) - Creating 'My Pets' family...`);
            try {
                const newFamily = await prisma.family.create({
                    data: {
                        name: "My Pets",
                        owner: { connect: { id: user.id } },
                        members: { connect: { id: user.id } } // Add owner as a member too, just in case logic relies on membership
                    }
                });

                // Also set as defaultFamilyId if not set
                if (!user.defaultFamilyId) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { defaultFamilyId: newFamily.id }
                    });
                }

                console.log(`  > Created Family ID: ${newFamily.id}`);
            } catch (e: any) {
                console.error(`  > Failed to create family: ${e.message}`);
            }
        } else {
            // If they have a family but no default set, set it to their owned family
            if (!user.defaultFamilyId) {
                console.log(`User ${user.fullName} has family but no default. Setting default...`);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { defaultFamilyId: user.ownedFamily.id }
                });
            }
        }
    }

    console.log('--- Check Complete ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
