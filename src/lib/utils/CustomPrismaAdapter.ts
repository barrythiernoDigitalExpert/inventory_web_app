import { PrismaClient } from '@/generated/prisma'
import { Adapter, AdapterUser } from 'next-auth/adapters'

/**
 * Custom Prisma Adapter for NextAuth
 * ---------------------------------
 * Extends the default Prisma Adapter to ensure the user role and active status fields are included
 * in the user object returned by NextAuth. Supports Google authentication and custom user mapping.
 *
 * Responsibilities:
 * - Fetch user by ID, email, or account with role and isActive fields
 * - Map Prisma user model to NextAuth AdapterUser
 *
 * The exported function is used to provide a custom adapter to NextAuth configuration.
 */
/**
 * Custom Prisma Adapter that ensures the role and isActive fields are included in the user object.
 * @param prisma PrismaClient instance
 * @returns Adapter object for NextAuth
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
        isActive: user.isActive,
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
        isActive: user.isActive,

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
      isActive: user.isActive,

    };
  }
  
  return null;
}
    
    
    
    
    
  }
}