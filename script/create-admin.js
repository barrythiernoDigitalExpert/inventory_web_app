const { PrismaClient, UserRole, AuthType } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function createAdminUser() {
  try {
    const adminEmail = 'develop@inventoryapp.com';
    const adminName = 'Super Admin';
    const adminPassword = 'develop@inventoryapp.com'; 
    
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });
    
    if (existingUser) {
      return;
    }
    
    const hashedPassword = await bcrypt.hash(adminPassword, SALT_ROUNDS);
    
    const newAdmin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: adminName,
        password: hashedPassword,
        role: UserRole.ADMIN,
        authType: AuthType.LOCAL
      }
    });
  } catch (error) {
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();