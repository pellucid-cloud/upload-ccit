// prisma/seed.ts
import { PrismaClient, Role } from '@prisma/client'
import userData from './data.js'
import bcrypt from 'bcryptjs';
// 初始化 Prisma 客户端
const prisma = new PrismaClient()

async function batchInsertUser() {
  const data = userData.map(item => {
    return {
      studentId: item.no.toString(),
      password: bcrypt.hashSync(item.no.toString(), 10),
      name: item.name,
      role: Role.STUDENT,
    }
  });
  const result = await prisma.user.createMany({
    data,
  })
  console.log(`成功插入 ${result.count} 条用户数据`);

  const teacher = await prisma.user.create({
    data: {
      studentId: '0001',
      password: bcrypt.hashSync('wxb2025', 10),
      name: 'admin',
      role: Role.TEACHER,
    },
  })
  console.log('成功插入老师数据', teacher);
}


batchInsertUser()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })