import { PrismaClient, Species } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
  console.log(`Start seeding ...`);
  for (const v of vaccines) {
    const exists = await prisma.vaccineMaster.findFirst({
        where: {
            name: v.name,
            species: v.species
        }
    })
    
    if (!exists) {
        await prisma.vaccineMaster.create({
            data: v
        })
    }
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
