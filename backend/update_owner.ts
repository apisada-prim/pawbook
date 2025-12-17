
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const petId = 'd0280066-bb05-4340-bd65-30c6b97c2090';
    const ownerId = '8b3d26da-a2cb-4242-87a5-de2b8d8237ad'; // Apsiada

    console.log(`Updating pet ${petId} to owner ${ownerId}...`);

    try {
        const pet = await prisma.pet.update({
            where: { id: petId },
            data: {
                ownerId: ownerId
            }
        });
        console.log(`Successfully updated pet "${pet.name}" (ID: ${pet.id}) to owner ID: ${pet.ownerId}`);
    } catch (e) {
        console.error("Error updating pet:", e);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
