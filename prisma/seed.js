const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing SEED_EMAIL or SEED_PASSWORD in .env. Add them and run again."
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });
    console.log(`✅ Updated password for existing user: ${email}`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      passwordHash,
    },
  });

  console.log(`✅ Created user: ${email}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
