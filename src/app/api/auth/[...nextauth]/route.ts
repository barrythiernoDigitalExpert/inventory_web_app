import NextAuth, { AuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { PrismaClient, AuthType } from '@prisma/client';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { CustomPrismaAdapter } from '@/lib/utils/CustomPrismaAdapter';

// Extend the session types to include custom properties
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      isActive: boolean;
    } & DefaultSession["user"]
  }
  
  interface User {
    id: string;
    role: string;
    isActive: boolean;
  }
}

// Extend JWT token type
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isActive: boolean;
  }
}

const prisma = new PrismaClient();

const authOptions: AuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            role: true,
            isActive:true
          }
        });

        if (!user) {
          throw new Error('No user found with this email');
        }

        // Check if user is active
  if (!user.isActive) {
    throw new Error('Your account is inactive. Please contact administration.');
  }


        // Fix the null check for password
        if (!user.password) {
          throw new Error('Invalid user data');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Invalid password');
        }

        // Make sure we return a User object with string ID
        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role,
          isActive: user.isActive
        };
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Only handle Google sign-in flow
      if (account?.provider !== 'google') {
        return true;
      }

      try {
        // Check if user exists by email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email as string },
        });

        if (existingUser) {

          if (!existingUser.isActive) {
          // Block sign-in for inactive users
          return false; // This will prevent login
        }
          // If user exists but has LOCAL auth type, update to support Google login
          if (existingUser.authType === 'LOCAL') {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: profile?.sub,
                authType: 'GOOGLE',
              },
            });
          } 
          // If googleId doesn't match, update it to the current one
          else if (existingUser.googleId !== profile?.sub) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId: profile?.sub },
            });
          }
          
          // Assign the role from the database to maintain permissions
          user.role = existingUser.role;
          user.id = String(existingUser.id);
          user.isActive = existingUser.isActive;
        } else {
        // For new Google users, add isActive property
        user.isActive = true;
      }
        
        return true;
      } catch (error) {
        console.error('Error during Google sign-in:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user && account) {
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Debug mode should be enabled only in development
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };