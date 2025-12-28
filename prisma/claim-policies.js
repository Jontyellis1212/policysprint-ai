const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL?.trim().toLowerCase();

  if (!email) {
    throw new Error(
      "Missing SEED_EMAIL in .env. Set SEED_EMAIL to the email you logged in with, then run again."
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    throw new Error(`No user found for SEED_EMAIL=${email}`);
  }

  const result = await prisma.policy.updateMany({
    where: { userId: null },
    data: { userId: user.id },
  });

  console.log(`✅ Claimed ${result.count} policies for ${user.email}`);
}

main()
  .catch((e) => {
    console.error("❌ Claim failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
