import { AuthType, UserRole } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import { hash } from 'bcryptjs';

export interface CrmPlatformUser {
  maildropUserId: number;
  crmEmail: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  authType: AuthType;
  deactivatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  propertiesCount: number;
  sharedCount: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function formatUser(
  user: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    authType: AuthType;
    deactivatedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    _count: { properties: number; sharedProperties: number };
  }
): CrmPlatformUser {
  return {
    maildropUserId: user.id,
    crmEmail: normalizeEmail(user.email),
    name: user.name,
    role: user.role,
    isActive: user.isActive,
    authType: user.authType,
    deactivatedAt: user.deactivatedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    propertiesCount: user._count.properties,
    sharedCount: user._count.sharedProperties,
  };
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  authType: true,
  deactivatedAt: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      properties: true,
      sharedProperties: true,
    },
  },
} as const;

export class CrmUserError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export async function listCrmPlatformUsers(params?: {
  isActive?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<{
  users: CrmPlatformUser[];
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}> {
  const limit = Math.min(params?.limit ?? 500, 500);
  const offset = params?.offset ?? 0;
  const search = params?.search?.trim();

  const where = {
    ...(params?.isActive !== undefined ? { isActive: params.isActive } : {}),
    ...(search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    users: users.map(formatUser),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}

export async function createCrmPlatformUser(params: {
  name: string;
  email: string;
  password: string;
  role?: string;
}): Promise<CrmPlatformUser> {
  const name = params.name.trim();
  const email = normalizeEmail(params.email);
  const password = params.password;

  if (!name || !email || !password) {
    throw new CrmUserError('Champs requis : name, email, password', 422);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new CrmUserError('Format email invalide', 422);
  }

  if (password.length < 6) {
    throw new CrmUserError('Le mot de passe doit contenir au moins 6 caractères', 422);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    throw new CrmUserError('Un utilisateur avec cet email existe déjà', 409);
  }

  const role =
    params.role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: await hash(password, 12),
      role,
      isActive: true,
      authType: AuthType.LOCAL,
    },
    select: userSelect,
  });

  return formatUser(user);
}

async function findUserByIdOrEmail(identifier: {
  userId?: number;
  email?: string;
}) {
  if (identifier.userId) {
    return prisma.user.findUnique({
      where: { id: identifier.userId },
      select: userSelect,
    });
  }

  if (identifier.email) {
    return prisma.user.findFirst({
      where: { email: { equals: identifier.email, mode: 'insensitive' } },
      select: userSelect,
    });
  }

  return null;
}

export async function updateCrmPlatformUserStatus(
  identifier: { userId?: number; email?: string },
  isActive: boolean
): Promise<CrmPlatformUser> {
  const user = await findUserByIdOrEmail(identifier);

  if (!user) {
    throw new CrmUserError('Utilisateur introuvable', 404);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      isActive,
      deactivatedAt: isActive ? null : new Date(),
    },
    select: userSelect,
  });

  return formatUser(updated);
}

export async function revokeCrmPlatformUser(identifier: {
  userId?: number;
  email?: string;
}): Promise<CrmPlatformUser> {
  return updateCrmPlatformUserStatus(identifier, false);
}
