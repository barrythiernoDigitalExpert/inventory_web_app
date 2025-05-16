import { PrismaClient } from '@prisma/client'
import { Adapter, AdapterUser } from 'next-auth/adapters'

/**
 * Custom Prisma Adapter that ensures the role field is included
 */
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    
    getUser: async (id) => {
        const numericId = parseInt(id);

      const user = await prisma.user.findUnique({
        where: { id: numericId },
      })
      if (!user) return null
      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        emailVerified: null,
        image: null,
        role: user.role,
      }
    },
    getUserByEmail: async (email) => {
      const user = await prisma.user.findUnique({
        where: { email },
      })
      if (!user) return null
      return {
        id: String(user.id),
        name: user.name,
        email: user.email,
        emailVerified: null,
        image: null,
        role: user.role,
      }
    },

    getUserByAccount: async ({ provider, providerAccountId }) => {

  if (provider === 'google') {
    const user = await prisma.user.findUnique({
      where: { googleId: providerAccountId },
    });
    
    if (!user) return null;
    
    return {
      id: String(user.id),
      name: user.name,
      email: user.email,
      emailVerified: null, 
      image: null, 
      role: user.role,
    };
  }
  
  return null;
}
    
    
    
    
    
  }
}