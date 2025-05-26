import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';

export async function POST(request: Request) {
  try {
    // Récupérer les données envoyées depuis l'application mobile
    const { email, uid, displayName } = await request.json();

    // Vérifier que les données essentielles sont présentes
    if (!email || !uid) {
      return NextResponse.json(
        { message: 'Email et UID Google sont requis' },
        { status: 400 }
      );
    }

    // Chercher si l'utilisateur existe déjà par email
    let user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
  return NextResponse.json(
    { message: "Erreur lors de la création/mise à jour de l'utilisateur" },
    { status: 500 }
  );
}

    if (user) {
      // Vérifier si l'utilisateur est actif
      if (!user.isActive) {
        return NextResponse.json(
          { message: 'Votre compte est inactif. Veuillez contacter l\'administration.' },
          { status: 403 }
        );
      }

      // Mettre à jour les informations Google si nécessaire
      if (user.authType === 'LOCAL' || user.googleId !== uid) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: uid,
            authType: 'GOOGLE',
            ...(displayName && { name: displayName }),
            
          },
        });
      }
    }

    // Générer un JWT
    const token = jwt.sign(
      { 
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Retourner les données utilisateur et le token
    return NextResponse.json({
      user: {
        id: String(user.id),
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
      },
      token,
    });
  } catch (error) {
    console.error('Erreur d\'authentification Google:', error);
    return NextResponse.json(
      { message: 'Erreur interne du serveur' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}