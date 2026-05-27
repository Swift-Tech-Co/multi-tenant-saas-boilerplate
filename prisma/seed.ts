import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      emailVerified: true,
      memberships: {
        create: {
          role: "OWNER",
          organization: {
            create: {
              name: "Acme Corp",
              slug: "acme-corp",
              plan: "PRO",
            },
          },
        },
      },
    },
  });

  console.log("Seeded user:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
