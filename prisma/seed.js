const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminUsername = 'admin';
  const adminPassword = 'admin';

  // Comprobar si el usuario admin ya existe para no duplicarlo ni pisarlo
  const existingAdmin = await prisma.user.findUnique({
    where: { username: adminUsername }
  });

  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    await prisma.user.create({
      data: {
        name: 'Administrador',
        username: adminUsername,
        password: hashedPassword,
        isAdmin: true,
      }
    });
    console.log('✅ Usuario admin (admin/admin) creado automáticamente en el primer despliegue.');
  } else {
    console.log('ℹ️ El usuario admin ya existe. No se ha modificado.');
  }
}

main()
  .catch((e) => {
    console.error('Error al poblar la base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
