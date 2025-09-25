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

const [teacherId, password, name] = process.argv.slice(2);

// if (!teacherId || !password || !name) {
//   console.log('使用方法: node create-teacher.js <工号> <密码> <姓名>');
//   process.exit(1);
// }

// createTeacher(teacherId, password, name);

// createUser('20210001', '123', '王相博', 'STUDENT')