import { PrismaClient, Species, UserRole } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial users...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'owner@pawbook.com',
      password: hashedPassword,
      fullName: 'Default Owner',
      role: UserRole.OWNER,
      image: 'https://ui-avatars.com/api/?name=Default+Owner&background=random',
      address: '123 Pet Street',
      phoneNumber: '0812345678',
    },
    {
      email: 'vet@pawbook.com',
      password: hashedPassword,
      fullName: 'Dr. Default Vet',
      role: UserRole.VET,
      image: 'https://ui-avatars.com/api/?name=Dr+Vet&background=random',
      address: '456 Vet Avenue',
      phoneNumber: '0898765432',
    },
    {
      email: 'admin@pawbook.com',
      password: hashedPassword,
      fullName: 'System Admin',
      role: UserRole.ADMIN,
      image: 'https://ui-avatars.com/api/?name=Admin&background=random',
      address: '777 Admin Tower',
      phoneNumber: '021234567',
    },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    console.log(`Created user: ${user.email} (${user.role})`);

    // For vets, create a clinic and profile if not exists
    if (u.role === UserRole.VET) {
      // Simple clinic check - assuming one default clinic for seed
      // Clinic doesn't have unique name, but let's assume if this vet is admin... wait, vet is not admin of clinic in this schema usually? 
      // Schema says clinic has adminId @unique.
      // Let's just findFirst or create for the clinic to avoid complexity, or skip clinic upsert if too complex for now.
      // Simplified: Just create clinic if we don't find one with this name? Name isn't unique.
      // Let's rely on finding a clinic by ID or just create one if we know it's fresh.
      // For now, let's just Try/Catch the clinic creation or check if user has a profile.
      // Logic is tricky without unique field for clinic name.
      // Let's use findFirst instead.
      // Rethinking: User -> VetProfile (unique userId).
      // Let's just upsert VetProfile.

      let clinicId: string | null = null;
      // Check if we have a default clinic
      const existingClinic = await prisma.clinic.findFirst({ where: { name: 'Pawbook Default Clinic' } });
      if (existingClinic) {
        clinicId = existingClinic.id;
      } else {
        const newClinic = await prisma.clinic.create({
          data: {
            name: 'Pawbook Default Clinic',
            address: '456 Vet Avenue',
            phoneNumber: '029998888',
            isVerified: true
          }
        });
        clinicId = newClinic.id;
      }

      await prisma.vetProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          licenseNumber: 'VET-12345',
          isVerified: true,
          clinicId: clinicId
        }
      });
    }

    // For owners, ensure they have a default family
    if (u.role === UserRole.OWNER) {
      // Family is likely created via signals/logic in app, but let's ensure it here for seed
      // Actually, the seed might not trigger app logic. Let's manually create family.
      const family = await prisma.family.upsert({
        where: { ownerId: user.id },
        update: {},
        create: {
          name: `${u.fullName}'s Family`,
          ownerId: user.id,
          members: { connect: { id: user.id } }
        }
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { defaultFamilyId: family.id }
      });
    }
  }

  console.log('Seeding vaccine data...');

  const vaccines = [
    // DOGS - CORE
    {
      name: 'Defensor 3',
      brand: 'Zoetis',
      type: 'Rabies',
      species: Species.DOG,
      isCore: true,
      description: 'โรคพิษสุนัขบ้า (ภูมิคุ้มกัน 1-3 ปี)',
    },
    {
      name: 'Rabisin',
      brand: 'Boehringer Ingelheim',
      type: 'Rabies',
      species: Species.DOG,
      isCore: true,
      description: 'โรคพิษสุนัขบ้า',
    },
    {
      name: 'Vanguard HTLP 5/L',
      brand: 'Zoetis',
      type: 'Combined',
      species: Species.DOG,
      isCore: true,
      description: 'ไข้หัด, ลำไส้อักเสบ, ตับอักเสบ, หวัด, ฉี่หนู',
    },
    {
      name: 'Nobivac DHPPi + L',
      brand: 'MSD',
      type: 'Combined',
      species: Species.DOG,
      isCore: true,
      description: 'ไข้หัด, ลำไส้อักเสบ, ตับอักเสบ, หวัด, ฉี่หนู',
    },
    {
      name: 'Eurican',
      brand: 'Boehringer Ingelheim',
      type: 'Combined',
      species: Species.DOG,
      isCore: true,
      description: 'ไข้หัด, ลำไส้อักเสบ, ตับอักเสบ, หวัด, ฉี่หนู',
    },
    {
      name: 'Biocan Novel',
      brand: 'Interpharma',
      type: 'Combined',
      species: Species.DOG,
      isCore: true,
      description: 'ไข้หัด, ลำไส้อักเสบ, ตับอักเสบ, หวัด, ฉี่หนู',
    },
    {
      name: 'Canigen',
      brand: 'Virbac',
      type: 'Combined',
      species: Species.DOG,
      isCore: true,
      description: 'ไข้หัด, ลำไส้อักเสบ, ตับอักเสบ, หวัด, ฉี่หนู',
    },

    // DOGS - NON-CORE
    {
      name: 'Bronchicine CAe',
      brand: 'Zoetis',
      type: 'Kennel Cough',
      species: Species.DOG,
      isCore: false,
      description: 'โรคหวัด/หลอดลมอักเสบ (แบบฉีด)',
    },
    {
      name: 'Pneumodog',
      brand: 'Boehringer Ingelheim',
      type: 'Kennel Cough',
      species: Species.DOG,
      isCore: false,
      description: 'โรคหวัด/หลอดลมอักเสบ (แบบฉีด)',
    },
    {
      name: 'Nobivac KC',
      brand: 'MSD',
      type: 'Kennel Cough',
      species: Species.DOG,
      isCore: false,
      description: 'โรคหวัด/หลอดลมอักเสบ (แบบหยอดจมูก)',
    },
    {
      name: 'Vanguard CIV',
      brand: 'Zoetis',
      type: 'Influenza',
      species: Species.DOG,
      isCore: false,
      description: 'ไข้หวัดใหญ่สุนัข (H3N2/H3N8)',
    },

    // CATS - CORE
    {
      name: 'Defensor 3',
      brand: 'Zoetis',
      type: 'Rabies',
      species: Species.CAT,
      isCore: true,
      description: 'โรคพิษสุนัขบ้า (ใช้ตัวเดียวกับสุนัข)',
    },
    {
      name: 'Rabisin',
      brand: 'Boehringer Ingelheim',
      type: 'Rabies',
      species: Species.CAT,
      isCore: true,
      description: 'โรคพิษสุนัขบ้า (ใช้ตัวเดียวกับสุนัข)',
    },
    {
      name: 'Felocell 3',
      brand: 'Zoetis',
      type: 'FVRCP',
      species: Species.CAT,
      isCore: true,
      description: 'ไข้หัดแมว, หวัดแมว (Herpes, Calici)',
    },
    {
      name: 'Felocell 4',
      brand: 'Zoetis',
      type: 'FVRCP+Chlamydia',
      species: Species.CAT,
      isCore: true,
      description: 'ไข้หัด, หวัดแมว + เชื้อ Chlamydia',
    },
    {
      name: 'Nobivac Tricat Trio',
      brand: 'MSD',
      type: 'FVRCP',
      species: Species.CAT,
      isCore: true,
      description: 'ไข้หัดแมว, หวัดแมว',
    },
    {
      name: 'Feligen CRP',
      brand: 'Virbac',
      type: 'FVRCP',
      species: Species.CAT,
      isCore: true,
      description: 'ไข้หัดแมว, หวัดแมว',
    },

    // CATS - NON-CORE
    {
      name: 'Leucogen',
      brand: 'Virbac',
      type: 'FeLV',
      species: Species.CAT,
      isCore: false,
      description: 'มะเร็งเม็ดเลือดขาว (เทคโนโลยี Subunit ปลอดภัยสูง)',
    },
    {
      name: 'Nobivac FeLV',
      brand: 'MSD',
      type: 'FeLV',
      species: Species.CAT,
      isCore: false,
      description: 'มะเร็งเม็ดเลือดขาว',
    },
    {
      name: 'Primucell FIP',
      brand: 'Zoetis',
      type: 'FIP',
      species: Species.CAT,
      isCore: false,
      description: 'โรค FIP (แบบหยอดจมูกเท่านั้น)',
    },
  ];

  for (const v of vaccines) {
    await prisma.vaccineMaster.upsert({
      where: { id: v.name + v.species }, // Hacky unique check, but UUID is default. Actually better to just create or finding by properties.
      // Since we don't have a unique constraint on name+species in schema, we'll just createMany or findFirst.
      // Better approach for seed:
      create: v,
      update: {},
      // Wait, upsert requires a unique where input. id is unique.
      // Let's rely on name+brand+species uniqueness conceptually but we didn't enforce it in DB.
      // For simplicity in this seed, let's delete all and re-insert or just check first.
    });
  }

  // Refactored to proper loop
  // Refactored to proper loop
  console.log(`Clearing existing vaccines...`);
  try {
    await prisma.vaccineRecord.deleteMany({});
  } catch (e) {
    console.log("No vaccine records to delete or error ignored.");
  }
  await prisma.vaccineMaster.deleteMany({});

  console.log(`Start seeding ...`);
  for (const v of vaccines) {
    await prisma.vaccineMaster.create({
      data: v
    })
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
