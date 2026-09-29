import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { id: 'default-workspace' },
    update: {},
    create: { id: 'default-workspace', name: 'Default Workspace' },
  })

  const passwordHash = await bcrypt.hash('admin123', 10)

  await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      passwordHash,
      role: Role.ADMIN,
      workspaceId: workspace.id,
    },
  })

  // Also create an analyst and viewer for demo
  const analystHash = await bcrypt.hash('analyst123', 10)
  await prisma.user.upsert({
    where: { email: 'analyst@example.com' },
    update: {},
    create: {
      email: 'analyst@example.com',
      name: 'Analyst User',
      passwordHash: analystHash,
      role: Role.ANALYST,
      workspaceId: workspace.id,
    },
  })

  const viewerHash = await bcrypt.hash('viewer123', 10)
  await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      name: 'Viewer User',
      passwordHash: viewerHash,
      role: Role.VIEWER,
      workspaceId: workspace.id,
    },
  })

  console.log('Seed complete: default workspace + 3 demo users created')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
