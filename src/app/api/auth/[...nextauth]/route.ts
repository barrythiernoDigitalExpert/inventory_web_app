import NextAuth, { AuthOptions, DefaultSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { compare } from 'bcryptjs';
import { PrismaClient, AuthType } from '@prisma/client';
import { PrismaAdapter } from "@auth/prisma-adapter";
import { CustomPrismaAdapter } from '@/lib/utils/CustomPrismaAdapter';
import { prisma } from '@/lib/utils/prisma';

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
        console.log('🔐 [AUTH] Starting credentials authorization');
        console.log('🔐 [AUTH] Credentials received:', { 
          email: credentials?.email, 
          hasPassword: !!credentials?.password 
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ [AUTH] Missing credentials');
          throw new Error('Missing credentials');
        }

        try {
          console.log('🔍 [AUTH] Looking up user in database:', credentials.email);
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

          console.log('🔍 [AUTH] User lookup result:', { 
            found: !!user, 
            isActive: user?.isActive,
            role: user?.role,
            hasPassword: !!user?.password
          });

          if (!user) {
            console.log('❌ [AUTH] No user found with email:', credentials.email);
            throw new Error('No user found with this email');
          }

          // Check if user is active
          if (!user.isActive) {
            console.log('❌ [AUTH] User account is inactive:', credentials.email);
            throw new Error('Your account is inactive. Please contact administration.');
          }

          // Fix the null check for password
          if (!user.password) {
            console.log('❌ [AUTH] User has no password set:', credentials.email);
            throw new Error('Invalid user data');
          }

          console.log('🔓 [AUTH] Comparing passwords...');
          const isPasswordValid = await compare(credentials.password, user.password);
          console.log('🔓 [AUTH] Password validation result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('❌ [AUTH] Invalid password for user:', credentials.email);
            throw new Error('Invalid password');
          }

          const userResponse = {
            id: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive
          };

          console.log('✅ [AUTH] Credentials authorization successful:', {
            id: userResponse.id,
            email: userResponse.email,
            role: userResponse.role
          });

          return userResponse;
        } catch (error) {
          console.error('💥 [AUTH] Error during credentials authorization:', error);
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
      console.log('🔑 [SIGNIN] Starting signIn callback');
      console.log('🔑 [SIGNIN] Provider:', account?.provider);
      console.log('🔑 [SIGNIN] User data:', { 
        email: user.email, 
        name: user.name,
        id: user.id 
      });

      // Only handle Google sign-in flow
      if (account?.provider !== 'google') {
        console.log('🔑 [SIGNIN] Non-Google provider, allowing sign-in');
        return true;
      }

      console.log('🔍 [GOOGLE] Starting Google sign-in flow');
      console.log('🔍 [GOOGLE] Profile data:', { 
        sub: profile?.sub, 
        email: profile?.email 
      });

      try {
        console.log('🔍 [GOOGLE] Looking up existing user by email:', user.email);
        // Check if user exists by email
        const existingUser = await prisma.user.findFirst({
          where: { email: user.email as string },
        });

        console.log('🔍 [GOOGLE] Existing user lookup result:', { 
          found: !!existingUser,
          isActive: existingUser?.isActive,
          authType: existingUser?.authType,
          googleId: existingUser?.googleId
        });

        if (existingUser) {
          if (!existingUser.isActive) {
            console.log('❌ [GOOGLE] User account is inactive, blocking sign-in:', user.email);
            return false; // This will prevent login
          }

          // If user exists but has LOCAL auth type, update to support Google login
          if (existingUser.authType === 'LOCAL') {
            console.log('🔄 [GOOGLE] Converting LOCAL user to GOOGLE auth');
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                googleId: profile?.sub,
                authType: 'GOOGLE',
              },
            });
            console.log('✅ [GOOGLE] User converted to GOOGLE auth successfully');
          } 
          // If googleId doesn't match, update it to the current one
          else if (existingUser.googleId !== profile?.sub) {
            console.log('🔄 [GOOGLE] Updating googleId for existing user');
            await prisma.user.update({
              where: { id: existingUser.id },
              data: { googleId: profile?.sub },
            });
            console.log('✅ [GOOGLE] GoogleId updated successfully');
          }
          
          // Assign the role from the database to maintain permissions
          user.role = existingUser.role;
          user.id = String(existingUser.id);
          user.isActive = existingUser.isActive;
          
          console.log('✅ [GOOGLE] Existing user sign-in successful:', {
            id: user.id,
            email: user.email,
            role: user.role
          });
        } else {
          console.log('👤 [GOOGLE] New Google user, setting default properties');
          // For new Google users, add isActive property
          user.isActive = true;
          console.log('✅ [GOOGLE] New user properties set');
        }
        
        console.log('✅ [GOOGLE] Google sign-in flow completed successfully');
        return true;
      } catch (error) {
        console.error('💥 [GOOGLE] Error during Google sign-in:', error);
        return false;
      }
    },
    async jwt({ token, user, account }) {
      console.log('🎫 [JWT] Starting JWT callback');
      console.log('🎫 [JWT] Has user:', !!user);
      console.log('🎫 [JWT] Has account:', !!account);
      console.log('🎫 [JWT] Current token:', { 
        id: token.id, 
        role: token.role, 
        isActive: token.isActive 
      });

      // Initial sign in
      if (user && account) {
        console.log('🎫 [JWT] Initial sign in, setting token data');
        token.id = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        
        console.log('🎫 [JWT] Token updated with user data:', {
          id: token.id,
          role: token.role,
          isActive: token.isActive
        });
      }
      
      console.log('✅ [JWT] JWT callback completed');
      return token;
    },
    async session({ session, token }) {
      console.log('📱 [SESSION] Starting session callback');
      console.log('📱 [SESSION] Token data:', { 
        id: token.id, 
        role: token.role, 
        isActive: token.isActive 
      });

      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
        
        console.log('📱 [SESSION] Session updated with token data:', {
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          isActive: session.user.isActive
        });
      }
      
      console.log('✅ [SESSION] Session callback completed');
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