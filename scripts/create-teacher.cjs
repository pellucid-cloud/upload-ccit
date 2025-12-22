const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser (id, password, name, role = 'TEACHER') {
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const teacher = await prisma.user.create({
      data: {
        studentId: id,
        password: hashedPassword,
        name,
        role,
      },
    });

    console.log('账号创建成功:', teacher);
  } catch (error) {
    console.error('创建失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}


// if (!teacherId || !password || !name) {
//   console.log('使用方法: node create-teacher.js <工号> <密码> <姓名>');
//   process.exit(1);
// }


createUser('2311311123', '2311311123', '雷坤棋', 'STUDENT')