/**
 * JWT Authentication Utility
 * -------------------------
 * Provides functions to verify JWT authentication for API requests, extract user information from tokens,
 * and handle error responses. Integrates with Prisma to fetch user data and validate account status.
 *
 * Responsibilities:
 * - Verify JWT tokens from incoming requests
 * - Fetch and validate user from the database
 * - Return user info or appropriate error responses
 *
 * All functions are designed to be used by API route handlers and middleware.
 */
// src/lib/utils/auth-jwt.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export interface DecodedToken {
  id: string;
  email: string;
  name?: string;
  role?: string;
  isActive: boolean;
}

/**
 * Verifies JWT authentication and returns user information.
 * @param request The incoming NextRequest object
 * @returns An object containing the user or an error response
 */
export async function verifyJwtAuth(request: NextRequest) {
  // Obtenir l'en-tête d'autorisation
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      error: NextResponse.json({ 
        success: false,
        error: 'Missing or invalid authorization token' 
      }, { status: 401 })
    };
  }
  
  // Extraire le token
  const token = authHeader.split(' ')[1];
  
  // Vérifier le token
  let decodedToken: DecodedToken;
  try {
    decodedToken = jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    return {
      error: NextResponse.json({ 
        success: false,
        error: 'Invalid token' 
      }, { status: 401 })
    };
  }
  
  // Vérifier la présence de l'email dans le token
  if (!decodedToken.email) {
    return {
      error: NextResponse.json({ 
        success: false,
        error: 'Invalid token payload' 
      }, { status: 401 })
    };
  }
  
  // Récupérer l'utilisateur depuis la base de données
  try {
    const user = await prisma.user.findUnique({
      where: { email: decodedToken.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });
    
    if (!user) {
      return {
        error: NextResponse.json({ 
          success: false,
          error: 'User not found' 
        }, { status: 404 })
      };
    }
    
    if (!user.isActive) {
      return {
        error: NextResponse.json({ 
          success: false,
          error: 'Account inactive' 
        }, { status: 403 })
      };
    }
    
    // Retourner l'utilisateur
    return { user };
  } catch (error) {
    console.error('Database error during auth verification:', error);
    return {
      error: NextResponse.json({ 
        success: false,
        error: 'Server error during authentication' 
      }, { status: 500 })
    };
  }
}