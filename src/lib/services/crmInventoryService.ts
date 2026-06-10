import { InventoryStatus, Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/utils/prisma';
import { buildDateRangeFilter, Period } from '@/lib/utils/periodFilter';
import { CrmAgent, parseAgentsJson } from '@/lib/services/crmCanvassingService';

export { parseAgentsJson };
export type { CrmAgent };

export type FeatureFillStatus = 'no_features' | 'partial' | 'fully_filled';

export interface CrmInventoryOwner {
  crmEmail: string;
  userName: string;
  maildropUserId: number;
  crmUserId?: number;
}

export interface CrmInventoryFeatureSummary {
  filledCount: number;
  activeFeaturesCatalogTotal: number;
  status: FeatureFillStatus;
}

export interface CrmStructuredFeature {
  id: number;
  name: unknown;
  type: string;
  currentValue: unknown;
}

export interface CrmStructuredFeatureCategory {
  id: number;
  name: unknown;
  features: CrmStructuredFeature[];
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
  features: Record<string, unknown>;
  featuresUpdatedAt: Date | null;
  schemaVersion: number | null;
  structuredFeatures: CrmStructuredFeatureCategory[];
  featureSummary: CrmInventoryFeatureSummary;
  /** Toutes les images : couverture + images des pièces */
  images: CrmInventoryImage[];
  rooms: CrmInventoryRoom[];
}

export interface CrmInventoryStats {
  total: number;
  activeFeaturesCatalogTotal: number;
  withFeatures: number;
  fullyFilled: number;
  noFeatures: number;
  partiallyFilled: number;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isFeatureValueFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

function countMobileFilled(features: Record<string, unknown>): number {
  return Object.values(features).filter(isFeatureValueFilled).length;
}

function isEavValueFilled(
  pf: {
    valueBool: boolean | null;
    valueText: unknown;
    valueInt: number | null;
    valueFloat: number | null;
    valueFeatureOptionId: number | null;
    propertyFeature: { type: string };
  }
): boolean {
  switch (pf.propertyFeature.type) {
    case 'bool':
      return pf.valueBool !== null;
    case 'text':
      return pf.valueText !== null;
    case 'integer':
      return pf.valueInt !== null;
    case 'float':
      return pf.valueFloat !== null;
    case 'select':
      return pf.valueFeatureOptionId !== null;
    default:
      return false;
  }
}

function computeFilledCount(
  featuresData: { features: unknown } | null,
  propertyFeatures: Array<{
    valueBool: boolean | null;
    valueText: unknown;
    valueInt: number | null;
    valueFloat: number | null;
    valueFeatureOptionId: number | null;
    propertyFeature: { type: string };
  }>
): number {
  const mobileFeatures =
    featuresData?.features && typeof featuresData.features === 'object' && !Array.isArray(featuresData.features)
      ? (featuresData.features as Record<string, unknown>)
      : {};

  const mobileFilled = countMobileFilled(mobileFeatures);
  const eavFilled = propertyFeatures.filter(isEavValueFilled).length;

  return Math.max(mobileFilled, eavFilled);
}

function computeFeatureStatus(
  filledCount: number,
  activeFeaturesCatalogTotal: number
): FeatureFillStatus {
  if (filledCount === 0) return 'no_features';
  if (
    activeFeaturesCatalogTotal > 0 &&
    filledCount >= activeFeaturesCatalogTotal
  ) {
    return 'fully_filled';
  }
  return 'partial';
}

function buildStructuredFeatures(
  propertyFeatures: Array<{
    valueBool: boolean | null;
    valueText: unknown;
    valueInt: number | null;
    valueFloat: number | null;
    valueFeatureOption: { id: number; value: unknown } | null;
    propertyFeature: {
      id: number;
      name: unknown;
      type: string;
      category: { id: number; name: unknown };
    };
  }>
): CrmStructuredFeatureCategory[] {
  const grouped = propertyFeatures.reduce(
    (acc, pf) => {
      const categoryId = pf.propertyFeature.category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: pf.propertyFeature.category.name,
          features: [],
        };
      }

      let currentValue: unknown = null;
      switch (pf.propertyFeature.type) {
        case 'bool':
          currentValue = pf.valueBool;
          break;
        case 'text':
          currentValue = pf.valueText;
          break;
        case 'integer':
          currentValue = pf.valueInt;
          break;
        case 'float':
          currentValue = pf.valueFloat;
          break;
        case 'select':
          currentValue = pf.valueFeatureOption
            ? { id: pf.valueFeatureOption.id, value: pf.valueFeatureOption.value }
            : null;
          break;
      }

      acc[categoryId].features.push({
        id: pf.propertyFeature.id,
        name: pf.propertyFeature.name,
        type: pf.propertyFeature.type,
        currentValue,
      });

      return acc;
    },
    {} as Record<number, CrmStructuredFeatureCategory>
  );

  return Object.values(grouped);
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

function buildRoomsAndImages(
  property: { id: number; imagePath: string | null; rooms: RoomRow[] }
): { rooms: CrmInventoryRoom[]; images: CrmInventoryImage[] } {
  const images: CrmInventoryImage[] = [];

  if (property.imagePath) {
    images.push({
      id: `property-${property.id}`,
      imagePath: property.imagePath,
      source: 'property',
      isMainImage: true,
    });
  }

  const rooms: CrmInventoryRoom[] = property.rooms.map((room) => {
    const roomImages = room.images.map((img) => ({
      id: img.id,
      imagePath: img.imagePath,
      description: img.description,
      name: img.name,
      notes: img.notes,
      condition: img.condition,
      sortOrder: img.sortOrder,
      isMainImage: img.isMainImage,
      createdAt: img.createdAt,
    }));

    for (const img of room.images) {
      images.push({
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
      });
    }

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
  featuresData: {
    features: unknown;
    updatedAt: Date;
    schemaVersion: number;
  } | null;
  propertyFeatures: Array<{
    valueBool: boolean | null;
    valueText: unknown;
    valueInt: number | null;
    valueFloat: number | null;
    valueFeatureOptionId: number | null;
    valueFeatureOption: { id: number; value: unknown } | null;
    propertyFeature: {
      id: number;
      name: unknown;
      type: string;
      category: { id: number; name: unknown };
    };
  }>;
  rooms: RoomRow[];
};

function formatInventory(
  property: PropertyRow,
  agentsByEmail: Map<string, CrmAgent>,
  activeFeaturesCatalogTotal: number
): CrmInventory {
  const filledCount = computeFilledCount(
    property.featuresData,
    property.propertyFeatures
  );

  const mobileFeatures =
    property.featuresData?.features &&
    typeof property.featuresData.features === 'object' &&
    !Array.isArray(property.featuresData.features)
      ? (property.featuresData.features as Record<string, unknown>)
      : {};

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
    features: mobileFeatures,
    featuresUpdatedAt: property.featuresData?.updatedAt ?? null,
    schemaVersion: property.featuresData?.schemaVersion ?? null,
    structuredFeatures: buildStructuredFeatures(property.propertyFeatures),
    featureSummary: {
      filledCount,
      activeFeaturesCatalogTotal,
      status: computeFeatureStatus(filledCount, activeFeaturesCatalogTotal),
    },
    images,
    rooms,
  };
}

function computeStats(
  rows: Array<{
    featuresData: { features: unknown } | null;
    propertyFeatures: Array<{
      valueBool: boolean | null;
      valueText: unknown;
      valueInt: number | null;
      valueFloat: number | null;
      valueFeatureOptionId: number | null;
      propertyFeature: { type: string };
    }>;
  }>,
  activeFeaturesCatalogTotal: number
): CrmInventoryStats {
  let withFeatures = 0;
  let fullyFilled = 0;
  let noFeatures = 0;

  for (const row of rows) {
    const filledCount = computeFilledCount(row.featuresData, row.propertyFeatures);
    const status = computeFeatureStatus(filledCount, activeFeaturesCatalogTotal);

    if (status === 'no_features') noFeatures++;
    else if (status === 'fully_filled') fullyFilled++;
    else withFeatures++;
  }

  const total = rows.length;
  const partiallyFilled = withFeatures;

  return {
    total,
    activeFeaturesCatalogTotal,
    withFeatures: withFeatures + fullyFilled,
    fullyFilled,
    noFeatures,
    partiallyFilled,
  };
}

const propertyInclude = {
  user: {
    select: { id: true, email: true, name: true },
  },
  featuresData: {
    select: { features: true, updatedAt: true, schemaVersion: true },
  },
  propertyFeatures: {
    include: {
      propertyFeature: {
        include: { category: true },
      },
      valueFeatureOption: true,
    },
    orderBy: [
      { propertyFeature: { category: { sort: 'asc' as const } } },
      { propertyFeature: { sort: 'asc' as const } },
    ],
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

  const activeFeaturesCatalogTotal = await prisma.propertyFeature.count({
    where: { isActive: true },
  });

  const [total, statsRows, properties] = await Promise.all([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      select: {
        featuresData: { select: { features: true } },
        propertyFeatures: {
          select: {
            valueBool: true,
            valueText: true,
            valueInt: true,
            valueFloat: true,
            valueFeatureOptionId: true,
            propertyFeature: { select: { type: true } },
          },
        },
      },
    }),
    prisma.property.findMany({
      where,
      include: propertyInclude,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  const stats = computeStats(statsRows, activeFeaturesCatalogTotal);

  return {
    inventories: properties.map((p) =>
      formatInventory(p as PropertyRow, agentsByEmail, activeFeaturesCatalogTotal)
    ),
    stats,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  };
}
