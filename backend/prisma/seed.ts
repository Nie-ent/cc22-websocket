import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // สร้าง Rooms
  const generalRoom = await prisma.room.upsert({
    where: { name: 'General' },
    update: {},
    create: { name: 'General' },
  });

  const secretRoom = await prisma.room.upsert({
    where: { name: 'Secret' },
    update: {},
    create: { name: 'Secret' },
  });

  console.log('✅ Rooms created:', { generalRoom, secretRoom });

  // สร้าง Users ตัวอย่าง
  const hashedPassword = await bcrypt.hash('password123', 10);

  const alice = await prisma.user.upsert({
    where: { username: 'alice' },
    update: {},
    create: { username: 'alice', password: hashedPassword },
  });

  const bob = await prisma.user.upsert({
    where: { username: 'bob' },
    update: {},
    create: { username: 'bob', password: hashedPassword },
  });

  console.log('✅ Users created:', { alice, bob });
  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
