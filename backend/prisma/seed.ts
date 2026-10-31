import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.oAuthClient.upsert({
    where: {
      clientId: "work-app-client",
    },
    update: {},
    create: {
      clientId: "work-app-client",
      name: "Work App",
      redirectUris: [
        "http://localhost:5173/auth/callback",
      ],
    },
  });

  await prisma.oAuthClient.upsert({
    where: {
      clientId: "docs-app-client",
    },
    update: {},
    create: {
      clientId: "docs-app-client",
      name: "Docs App",
      redirectUris: [
        "http://localhost:5174/auth/callback",
      ],
    },
  });

  console.log("OAuth clients created");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());