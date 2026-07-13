import { InventoryStatus, Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import { buildDateRangeFilter, Period } from '@/lib/utils/periodFilter';
import { CrmAgent, parseAgentsJson } from '@/lib/services/crmCanvassingService';

export { parseAgentsJson };
export type { CrmAgent };

export interface CrmInventoryOwner {
  crmEmail: string;
  userName: string;
  maildropUserId: number;
  crmUserId?: number;
}

export interface CrmInventoryImage {
  id: number | string;
  imagePath: string;
  source: 'property' | 'room';
  roomId?: number;
  roomCode?: string;
  roomName?: string;
  description?: string | null;
  name?: string | null;
  notes?: string | null;
  condition?: string | null;
  sortOrder?: number;
  isMainImage?: boolean;
  createdAt?: Date;
}

export interface CrmInventoryRoom {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  imageCount: number;
  images: Omit<CrmInventoryImage, 'source' | 'roomId' | 'roomCode' | 'roomName'>[];
}

export interface CrmInventory {
  id: number;
  /** Référence CRM : userName-reference-name */
  ref: string;
  reference: string;
  name: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  imagePath?: string;
  inventoryStatus: InventoryStatus;
  roomCount: number;
  imageCount: number;
  listingPerson: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  owner: CrmInventoryOwner;
  /** Toutes les images : couverture + images des pièces */
  images: CrmInventoryImage[];
  rooms: CrmInventoryRoom[];
}

export interface CrmInventoryStats {
  total: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function buildWhereClause(
  scope: 'all' | 'agents',
  agents: CrmAgent[] | null,
  period: Period,
  startDate?: string | null,
  endDate?: string | null
): Prisma.PropertyWhereInput {
  const where: Prisma.PropertyWhereInput = {};

  const dateFilter = buildDateRangeFilter(period, startDate, endDate);
  if (dateFilter) {
    where.createdAt = dateFilter;
  }

  if (scope === 'agents' && agents) {
    const emails = agents.map((a) => a.email);
    where.user = {
      email: { in: emails, mode: 'insensitive' },
    };
  }

  return where;
}

function buildRef(
  userName: string,
  reference: string,
  propertyName: string | null
): string {
  const parts = [userName, reference, propertyName ?? ''].filter(
    (p) => p.trim() !== ''
  );
  return parts.join('-');
}

function formatOwner(
  user: { id: number; email: string; name: string },
  agentsByEmail: Map<string, CrmAgent>
): CrmInventoryOwner {
  const crmEmail = normalizeEmail(user.email);
  const agent = agentsByEmail.get(crmEmail);
  const userName = agent?.name || user.name;
  return {
    crmEmail,
    userName,
    maildropUserId: user.id,
    ...(agent?.crmUserId !== undefined ? { crmUserId: agent.crmUserId } : {}),
  };
}

type RoomImageRow = {
  id: number;
  imagePath: string;
  description: string | null;
  name: string | null;
  notes: string | null;
  condition: string | null;
  sortOrder: number;
  isMainImage: boolean;
  createdAt: Date;
};

type RoomRow = {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  imageCount: number;
  images: RoomImageRow[];
};

function buildRoomsAndImages(property: {
  id: number;
  imagePath: string | null;
  rooms: RoomRow[];
}): { rooms: CrmInventoryRoom[]; images: CrmInventoryImage[] } {
  const images: CrmInventoryImage[] = [];

  if (property.imagePath) {
    images.push({
      id: `property-${property.id}`,
      imagePath: property.imagePath,
      source: 'property',
      isMainImage: true,
    });
  }

  const rooms = property.rooms.map((room) => {
    const roomImages = room.images.map((img) => {
      const mapped: CrmInventoryImage = {
        id: img.id,
        imagePath: img.imagePath,
        source: 'room',
        roomId: room.id,
        roomCode: room.code,
        roomName: room.name,
        description: img.description,
        name: img.name,
        notes: img.notes,
        condition: img.condition,
        sortOrder: img.sortOrder,
        isMainImage: img.isMainImage,
        createdAt: img.createdAt,
      };
      images.push(mapped);
      return {
        id: img.id,
        imagePath: img.imagePath,
        description: img.description,
        name: img.name,
        notes: img.notes,
        condition: img.condition,
        sortOrder: img.sortOrder,
        isMainImage: img.isMainImage,
        createdAt: img.createdAt,
      };
    });

    return {
      id: room.id,
      code: room.code,
      name: room.name,
      sortOrder: room.sortOrder,
      imageCount: room.imageCount,
      images: roomImages,
    };
  });

  return { rooms, images };
}

type PropertyRow = {
  id: number;
  reference: string;
  name: string | null;
  address: string | null;
  street: string | null;
  city: string | null;
  postalCode: string | null;
  country: string | null;
  imagePath: string | null;
  inventoryStatus: InventoryStatus;
  roomCount: number;
  imageCount: number;
  listingPerson: string | null;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  user: { id: number; email: string; name: string };
  rooms: RoomRow[];
};

function formatInventory(
  property: PropertyRow,
  agentsByEmail: Map<string, CrmAgent>
): CrmInventory {
  const owner = formatOwner(property.user, agentsByEmail);
  const { rooms, images } = buildRoomsAndImages(property);

  return {
    id: property.id,
    ref: buildRef(owner.userName, property.reference, property.name),
    reference: property.reference,
    name: property.name,
    address: property.address,
    street: property.street,
    city: property.city,
    postalCode: property.postalCode,
    country: property.country,
    ...(property.imagePath ? { imagePath: property.imagePath } : {}),
    inventoryStatus: property.inventoryStatus,
    roomCount: property.roomCount,
    imageCount: property.imageCount,
    listingPerson: property.listingPerson,
    createdAt: property.createdAt,
    startedAt: property.startedAt,
    completedAt: property.completedAt,
    owner,
    images,
    rooms,
  };
}

const propertyInclude = {
  user: {
    select: { id: true, email: true, name: true },
  },
  rooms: {
    select: {
      id: true,
      code: true,
      name: true,
      sortOrder: true,
      imageCount: true,
      images: {
        select: {
          id: true,
          imagePath: true,
          description: true,
          name: true,
          notes: true,
          condition: true,
          sortOrder: true,
          isMainImage: true,
          createdAt: true,
        },
        orderBy: { sortOrder: 'asc' as const },
      },
    },
    orderBy: { sortOrder: 'asc' as const },
  },
} satisfies Prisma.PropertyInclude;

export async function getCrmInventoryData(params: {
  scope: 'all' | 'agents';
  agents: CrmAgent[] | null;
  period: Period;
  startDate?: string | null;
  endDate?: string | null;
  limit?: number;
  offset?: number;
}): Promise<{
  inventories: CrmInventory[];
  stats: CrmInventoryStats;
  pagination: { total: number; limit: number; offset: number; hasMore: boolean };
}> {
  const { scope, agents, period, startDate, endDate } = params;
  const limit = Math.min(params.limit ?? 500, 500);
  const offset = params.offset ?? 0;

  const where = buildWhereClause(scope, agents, period, startDate, endDate);
  const agentsByEmail = new Map((agents ?? []).map((a) => [a.email, a]));

  const [total, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return {
    inventories: properties.map((p) =>
      formatInventory(p as PropertyRow, agentsByEmail)
    ),
    stats: { total },
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}
