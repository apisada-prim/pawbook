import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            ownedFamily: true, // Correct relation name
            memberOfFamilies: true // Correct relation name
        }
    });
    console.log('--- User Accounts ---');
    users.forEach(user => {
        console.log(`User: ${user.fullName} (${user.email}) [ID: ${user.id}]`);
        if (user.ownedFamily) {
            console.log(`  > Owns Family: ${user.ownedFamily.name} (ID: ${user.ownedFamily.id})`);
        } else {
            console.log(`  > Owns Family: NONE`);
        }
    });

    const families = await prisma.family.findMany({
        include: {
            owner: true,
            members: true
        }
    });
    console.log('\n--- Families ---');
    families.forEach(f => {
        console.log(`Family: ${f.name} (Owner: ${f.owner.fullName})`);
        f.members.forEach(m => {
            console.log(`  - Member: ${m.fullName} (${m.email})`);
        });
    });

    console.log('---------------------');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
