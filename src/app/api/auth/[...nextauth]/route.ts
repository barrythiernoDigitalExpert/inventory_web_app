import NextAuth, { AuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { CustomPrismaAdapter } from '@/lib/utils/CustomPrismaAdapter';
import { prisma } from '@/lib/utils/prisma';
import { logger } from '@/lib/utils/logger';

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

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    isActive: boolean;
  }
}

const authOptions: AuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        logger.info('[AUTH] Credentials authorization', { email: credentials?.email });

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        try {
          const user = await prisma.user.findFirst({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              isActive: true
            }
          });

          if (!user) {
            throw new Error('No user found with this email');
          }

          if (!user.isActive) {
            throw new Error('Your account is inactive. Please contact administration.');
          }

          if (!user.password) {
            throw new Error('Invalid user data');
          }

          const isPasswordValid = await compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Invalid password');
          }

          logger.info('[AUTH] Credentials authorization successful', { id: user.id, email: user.email });

          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive
          };
        } catch (error) {
          logger.error('[AUTH] Error during credentials authorization', error);
          throw error;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') {
        return true;
      }

      try {
        const existingUser = await prisma.user.findFirst({
          where: { email: user.email as string },
        });

        if (existingUser) {
          if (!existingUser.isActive) {
            logger.warn('[GOOGLE] Inactive account blocked', { email: user.email });
            return false;
          }

          if (existingUser.authType === 'LOCAL') {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId: profile?.sub, authType: 'GOOGLE' },
            });
          } else if (existingUser.googleId !== profile?.sub) {
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId: profile?.sub },
            });
          }

          user.role = existingUser.role;
          user.id = String(existingUser.id);
          user.isActive = existingUser.isActive;
        } else {
          user.isActive = true;
        }

        return true;
      } catch (error) {
        logger.error('[GOOGLE] Error during sign-in', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
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
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
