
Object.defineProperty(exports, "__esModule", { value: true });

const {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
  PrismaClientRustPanicError,
  PrismaClientInitializationError,
  PrismaClientValidationError,
  getPrismaClient,
  sqltag,
  empty,
  join,
  raw,
  skip,
  Decimal,
  Debug,
  objectEnumValues,
  makeStrictEnum,
  Extensions,
  warnOnce,
  defineDmmfProperty,
  Public,
  getRuntime,
  createParam,
} = require('./runtime/edge.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = PrismaClientKnownRequestError;
Prisma.PrismaClientUnknownRequestError = PrismaClientUnknownRequestError
Prisma.PrismaClientRustPanicError = PrismaClientRustPanicError
Prisma.PrismaClientInitializationError = PrismaClientInitializationError
Prisma.PrismaClientValidationError = PrismaClientValidationError
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = sqltag
Prisma.empty = empty
Prisma.join = join
Prisma.raw = raw
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = Extensions.getExtensionContext
Prisma.defineExtension = Extensions.defineExtension

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}





/**
 * Enums
 */
exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  name: 'name',
  password: 'password',
  role: 'role',
  authType: 'authType',
  googleId: 'googleId',
  isActive: 'isActive',
  deactivatedAt: 'deactivatedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyScalarFieldEnum = {
  id: 'id',
  reference: 'reference',
  name: 'name',
  street: 'street',
  city: 'city',
  state: 'state',
  postalCode: 'postalCode',
  country: 'country',
  address: 'address',
  imagePath: 'imagePath',
  roomCount: 'roomCount',
  imageCount: 'imageCount',
  inventoryStatus: 'inventoryStatus',
  startedAt: 'startedAt',
  completedAt: 'completedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  userId: 'userId',
  listingPerson: 'listingPerson'
};

exports.Prisma.PropertyShareScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  userId: 'userId',
  canEdit: 'canEdit',
  canDelete: 'canDelete',
  createdAt: 'createdAt'
};

exports.Prisma.RoomScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  code: 'code',
  name: 'name',
  imageCount: 'imageCount',
  isComplete: 'isComplete',
  sortOrder: 'sortOrder',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RoomImageScalarFieldEnum = {
  id: 'id',
  roomId: 'roomId',
  imagePath: 'imagePath',
  description: 'description',
  name: 'name',
  notes: 'notes',
  condition: 'condition',
  aiDetected: 'aiDetected',
  aiAccuracy: 'aiAccuracy',
  sortOrder: 'sortOrder',
  isMainImage: 'isMainImage',
  localId: 'localId',
  syncStatus: 'syncStatus',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyFeatureCategoryScalarFieldEnum = {
  id: 'id',
  name: 'name',
  sort: 'sort',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyFeatureScalarFieldEnum = {
  id: 'id',
  categoryId: 'categoryId',
  type: 'type',
  name: 'name',
  sort: 'sort',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.PropertyFeatureOptionScalarFieldEnum = {
  id: 'id',
  propertyFeatureId: 'propertyFeatureId',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SystemConfigScalarFieldEnum = {
  id: 'id',
  key: 'key',
  value: 'value',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.FeatureSheetScalarFieldEnum = {
  id: 'id',
  name: 'name',
  values: 'values',
  schemaVersion: 'schemaVersion',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CanvassingVisitScalarFieldEnum = {
  id: 'id',
  latitude: 'latitude',
  longitude: 'longitude',
  contactMethod: 'contactMethod',
  contactMethod2: 'contactMethod2',
  contactMethod3: 'contactMethod3',
  contactMethod4: 'contactMethod4',
  houseName: 'houseName',
  vendorName: 'vendorName',
  comments: 'comments',
  streetAddress: 'streetAddress',
  neighborhood: 'neighborhood',
  city: 'city',
  postalCode: 'postalCode',
  imagePath: 'imagePath',
  responseReceived: 'responseReceived',
  responseDate: 'responseDate',
  isSynced: 'isSynced',
  mobileId: 'mobileId',
  syncedAt: 'syncedAt',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.InventorySessionScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  propertyId: 'propertyId',
  startTime: 'startTime',
  endTime: 'endTime',
  duration: 'duration',
  deviceType: 'deviceType'
};

exports.Prisma.SystemMetricsScalarFieldEnum = {
  id: 'id',
  date: 'date',
  totalUsers: 'totalUsers',
  loggedInUsers: 'loggedInUsers',
  contributingUsers: 'contributingUsers',
  totalProperties: 'totalProperties',
  newProperties: 'newProperties',
  completedInventories: 'completedInventories',
  avgCompletionTime: 'avgCompletionTime',
  storageUsed: 'storageUsed',
  aiRecognitionRate: 'aiRecognitionRate',
  totalImageCount: 'totalImageCount',
  newImageCount: 'newImageCount',
  totalCanvassingVisits: 'totalCanvassingVisits',
  newCanvassingVisits: 'newCanvassingVisits',
  positiveResponses: 'positiveResponses',
  negativeResponses: 'negativeResponses',
  pendingResponses: 'pendingResponses'
};

exports.Prisma.SyncLogScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  deviceId: 'deviceId',
  syncStarted: 'syncStarted',
  syncCompleted: 'syncCompleted',
  itemsSynced: 'itemsSynced',
  syncStatus: 'syncStatus',
  errorMessage: 'errorMessage'
};

exports.Prisma.UserActivityScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  activityType: 'activityType',
  entityId: 'entityId',
  entityType: 'entityType',
  details: 'details',
  deviceType: 'deviceType',
  duration: 'duration',
  timestamp: 'timestamp',
  metadata: 'metadata'
};

exports.Prisma.VisitConfigurationScalarFieldEnum = {
  id: 'id',
  revisitDelayHours: 'revisitDelayHours',
  isActive: 'isActive',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CanvassingVisitUserScalarFieldEnum = {
  id: 'id',
  visitId: 'visitId',
  userId: 'userId',
  userName: 'userName',
  isCreator: 'isCreator',
  joinedAt: 'joinedAt'
};

exports.Prisma.VisitRevisitScalarFieldEnum = {
  id: 'id',
  originalVisitId: 'originalVisitId',
  newVisitId: 'newVisitId',
  revisitReason: 'revisitReason',
  createdAt: 'createdAt'
};

exports.Prisma.CanvassingVisitCommentScalarFieldEnum = {
  id: 'id',
  visitId: 'visitId',
  userId: 'userId',
  comment: 'comment',
  isInitial: 'isInitial',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RevisitScalarFieldEnum = {
  id: 'id',
  originalVisitId: 'originalVisitId',
  latitude: 'latitude',
  longitude: 'longitude',
  contactMethod1: 'contactMethod1',
  contactMethod2: 'contactMethod2',
  contactMethod3: 'contactMethod3',
  contactMethod4: 'contactMethod4',
  houseName: 'houseName',
  vendorName: 'vendorName',
  comments: 'comments',
  streetAddress: 'streetAddress',
  neighborhood: 'neighborhood',
  city: 'city',
  postalCode: 'postalCode',
  imagePath: 'imagePath',
  responseReceived: 'responseReceived',
  responseDate: 'responseDate',
  userId: 'userId',
  userName: 'userName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.UserRole = exports.$Enums.UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER'
};

exports.AuthType = exports.$Enums.AuthType = {
  LOCAL: 'LOCAL',
  GOOGLE: 'GOOGLE'
};

exports.InventoryStatus = exports.$Enums.InventoryStatus = {
  DRAFT: 'DRAFT',
  COMPLETED: 'COMPLETED',
  FINALIZED: 'FINALIZED'
};

exports.ContactMethod = exports.$Enums.ContactMethod = {
  DOOR: 'DOOR',
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  LETTER: 'LETTER',
  SMS: 'SMS',
  BROCHURE: 'BROCHURE',
  VALUATION_CARD: 'VALUATION_CARD',
  FLYER: 'FLYER',
  SOCIAL_MEDIA: 'SOCIAL_MEDIA',
  REFERRAL: 'REFERRAL'
};

exports.ResponseType = exports.$Enums.ResponseType = {
  positive: 'positive',
  negative: 'negative',
  no_response: 'no_response',
  pending: 'pending'
};

exports.PropertyFeatureType = exports.$Enums.PropertyFeatureType = {
  bool: 'bool',
  text: 'text',
  integer: 'integer',
  select: 'select',
  float: 'float'
};

exports.ActivityType = exports.$Enums.ActivityType = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_PROPERTY: 'CREATE_PROPERTY',
  EDIT_PROPERTY: 'EDIT_PROPERTY',
  DELETE_PROPERTY: 'DELETE_PROPERTY',
  VIEW_PROPERTY: 'VIEW_PROPERTY',
  ADD_ROOM: 'ADD_ROOM',
  EDIT_ROOM: 'EDIT_ROOM',
  DELETE_ROOM: 'DELETE_ROOM',
  ADD_IMAGE: 'ADD_IMAGE',
  DELETE_IMAGE: 'DELETE_IMAGE',
  EDIT_IMAGE: 'EDIT_IMAGE',
  COMPLETE_INVENTORY: 'COMPLETE_INVENTORY',
  CANVASSING_VISIT: 'CANVASSING_VISIT',
  CREATE_USER: 'CREATE_USER',
  EDIT_USER: 'EDIT_USER',
  DELETE_USER: 'DELETE_USER',
  CHANGE_PASSWORD: 'CHANGE_PASSWORD',
  RESET_PASSWORD: 'RESET_PASSWORD',
  PROPERTY_SHARE: 'PROPERTY_SHARE',
  SYNC_DATA: 'SYNC_DATA',
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA'
};

exports.EntityType = exports.$Enums.EntityType = {
  USER: 'USER',
  PROPERTY: 'PROPERTY',
  ROOM: 'ROOM',
  IMAGE: 'IMAGE',
  CANVASSING_VISIT: 'CANVASSING_VISIT',
  SYSTEM: 'SYSTEM'
};

exports.Prisma.ModelName = {
  User: 'User',
  Property: 'Property',
  PropertyShare: 'PropertyShare',
  Room: 'Room',
  RoomImage: 'RoomImage',
  PropertyFeatureCategory: 'PropertyFeatureCategory',
  PropertyFeature: 'PropertyFeature',
  PropertyFeatureOption: 'PropertyFeatureOption',
  SystemConfig: 'SystemConfig',
  FeatureSheet: 'FeatureSheet',
  CanvassingVisit: 'CanvassingVisit',
  InventorySession: 'InventorySession',
  SystemMetrics: 'SystemMetrics',
  SyncLog: 'SyncLog',
  UserActivity: 'UserActivity',
  VisitConfiguration: 'VisitConfiguration',
  CanvassingVisitUser: 'CanvassingVisitUser',
  VisitRevisit: 'VisitRevisit',
  CanvassingVisitComment: 'CanvassingVisitComment',
  Revisit: 'Revisit'
};
/**
 * Create the Client
 */
const config = {
  "generator": {
    "name": "client",
    "provider": {
      "fromEnvVar": null,
      "value": "prisma-client-js"
    },
    "output": {
      "value": "C:\\Users\\thier\\Documents\\inventory_web_app\\src\\generated\\prisma",
      "fromEnvVar": null
    },
    "config": {
      "engineType": "library"
    },
    "binaryTargets": [
      {
        "fromEnvVar": null,
        "value": "windows",
        "native": true
      }
    ],
    "previewFeatures": [],
    "sourceFilePath": "C:\\Users\\thier\\Documents\\inventory_web_app\\prisma\\schema.prisma",
    "isCustomOutput": true
  },
  "relativeEnvPaths": {
    "rootEnvPath": null,
    "schemaEnvPath": "../../../.env"
  },
  "relativePath": "../../../prisma",
  "clientVersion": "6.6.0",
  "engineVersion": "f676762280b54cd07c770017ed3711ddde35f37a",
  "datasourceNames": [
    "db"
  ],
  "activeProvider": "postgresql",
  "inlineDatasources": {
    "db": {
      "url": {
        "fromEnvVar": "DATABASE_URL",
        "value": "prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiMDFKWlJWWTEwOFgxRFpEVzNXME1BUU5WMlAiLCJ0ZW5hbnRfaWQiOiJmNDUxNjZlNGE2N2E4Nzg2M2JlMmY4ZjQ4ZjViMzI3ZmFlZDcwNzllZDNmMWMzNTViMWE2MzE0NTI2ZTQxOTBmIiwiaW50ZXJuYWxfc2VjcmV0IjoiZTljMTFjOGYtODhiMi00NmYxLWE0MDAtNzllY2M1OGJjYjdiIn0.uyArpqSXdTPBPh6uG6HAL4K2CmINVJFTVqurlYcij7g"
      }
    }
  },
  "inlineSchema": "generator client {\n  provider = \"prisma-client-js\"\n  output   = \"../src/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"postgresql\"\n  url      = env(\"DATABASE_URL\")\n}\n\n// User model with role enum and active status\nenum UserRole {\n  ADMIN\n  USER\n}\n\nenum AuthType {\n  LOCAL\n  GOOGLE\n}\n\n// Status for inventory progress tracking\nenum InventoryStatus {\n  DRAFT // Started but not completed\n  COMPLETED // All items inventoried\n  FINALIZED // Process complete\n}\n\n// Canvassing visit contact methods\nenum ContactMethod {\n  DOOR // Door to door\n  PHONE // Phone call\n  EMAIL // Email contact\n  LETTER // Letter drop\n  SMS // SMS message\n  BROCHURE // Brochure drop\n  VALUATION_CARD // Valuation card\n  FLYER // Flyer distribution\n  SOCIAL_MEDIA // Social media contact\n  REFERRAL // Referral contact\n}\n\n// Response types for canvassing visits\nenum ResponseType {\n  positive // Interested\n  negative // Not interested\n  no_response // No response received\n  pending // Awaiting response\n}\n\nenum PropertyFeatureType {\n  bool\n  text\n  integer\n  select\n  float\n}\n\nmodel User {\n  id            Int       @id @default(autoincrement())\n  email         String    @unique\n  name          String\n  password      String? // Optional as Google auth won't need it\n  role          UserRole  @default(USER)\n  authType      AuthType  @default(LOCAL) @map(\"auth_type\")\n  googleId      String?   @unique @map(\"google_id\")\n  isActive      Boolean   @default(true) @map(\"is_active\")\n  deactivatedAt DateTime? @map(\"deactivated_at\") // Set when isActive → false, cleared on reactivation\n  createdAt     DateTime  @default(now()) @map(\"created_at\")\n  updatedAt     DateTime  @updatedAt @map(\"updated_at\")\n\n  // Relations\n  properties        Property[] // Properties created by this user\n  sharedProperties  PropertyShare[] // Properties shared with this user\n  inventorySessions InventorySession[] // Track time spent on inventories\n  canvassingVisits  CanvassingVisitUser[] // Canvassing visits by this user\n  activities        UserActivity[] // User activity tracking\n  visitComments     CanvassingVisitComment[] // Comments on canvassing visits\n  revisits          Revisit[] // Revisits performed by this user\n  featureSheets     FeatureSheet[] // Named feature value sheets (independent of properties)\n\n  @@map(\"users\")\n}\n\nmodel Property {\n  id                Int                @id @default(autoincrement())\n  reference         String             @unique\n  name              String?\n  // Address fields\n  street            String?\n  city              String?\n  state             String?\n  postalCode        String?            @map(\"postal_code\")\n  country           String?\n  address           String?\n  // End of address fields\n  imagePath         String?            @map(\"image_path\")\n  // Summary data for performance optimization\n  roomCount         Int                @default(0) @map(\"room_count\")\n  imageCount        Int                @default(0) @map(\"image_count\")\n  // Inventory status\n  inventoryStatus   InventoryStatus    @default(DRAFT) @map(\"inventory_status\")\n  startedAt         DateTime?          @map(\"started_at\")\n  completedAt       DateTime?          @map(\"completed_at\")\n  // Timestamps\n  createdAt         DateTime           @default(now()) @map(\"created_at\")\n  updatedAt         DateTime           @updatedAt @map(\"updated_at\")\n  // Relations\n  userId            Int                @map(\"user_id\")\n  user              User               @relation(fields: [userId], references: [id])\n  rooms             Room[]\n  sharedWith        PropertyShare[]\n  inventorySessions InventorySession[]\n  // Client information fields\n  listingPerson     String?            @map(\"listing_person\")\n\n  @@index([userId])\n  @@index([inventoryStatus])\n  @@map(\"properties\")\n}\n\n// Model for sharing properties with other users\nmodel PropertyShare {\n  id         Int      @id @default(autoincrement())\n  propertyId Int      @map(\"property_id\")\n  userId     Int      @map(\"user_id\")\n  canEdit    Boolean  @default(false) @map(\"can_edit\")\n  canDelete  Boolean  @default(false) @map(\"can_delete\")\n  createdAt  DateTime @default(now()) @map(\"created_at\")\n  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)\n  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([propertyId, userId])\n  @@index([propertyId])\n  @@index([userId])\n  @@map(\"property_shares\")\n}\n\nmodel Room {\n  id         Int         @id @default(autoincrement())\n  propertyId Int         @map(\"property_id\")\n  code       String\n  name       String\n  // Summary data for performance optimization\n  imageCount Int         @default(0) @map(\"image_count\")\n  isComplete Boolean     @default(false) @map(\"is_complete\")\n  // Add common query filter fields\n  sortOrder  Int         @default(0) @map(\"sort_order\")\n  // Timestamps\n  createdAt  DateTime    @default(now()) @map(\"created_at\")\n  updatedAt  DateTime    @updatedAt @map(\"updated_at\")\n  // Relations\n  property   Property    @relation(fields: [propertyId], references: [id], onDelete: Cascade)\n  images     RoomImage[]\n\n  @@index([propertyId])\n  @@index([propertyId, sortOrder])\n  @@index([propertyId, isComplete])\n  @@map(\"rooms\")\n}\n\nmodel RoomImage {\n  id          Int      @id @default(autoincrement())\n  roomId      Int      @map(\"room_id\")\n  imagePath   String   @map(\"image_path\")\n  description String?  @db.Text\n  name        String? // Name of the item in the image\n  notes       String?  @db.Text\n  condition   String?\n  aiDetected  Boolean  @default(false) @map(\"ai_detected\")\n  aiAccuracy  Float?   @map(\"ai_accuracy\") // Score between 0 and 1\n  // Add common query filter fields\n  sortOrder   Int      @default(0) @map(\"sort_order\")\n  isMainImage Boolean  @default(false) @map(\"is_main_image\")\n  // Synchronization and mobile app fields\n  localId     String?  @map(\"local_id\") // For mobile sync\n  syncStatus  String?  @map(\"sync_status\") // \"pending\", \"synced\", \"conflict\"\n  // Timestamps\n  createdAt   DateTime @default(now()) @map(\"created_at\")\n  updatedAt   DateTime @updatedAt @map(\"updated_at\")\n  // Relations\n  room        Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)\n\n  @@index([roomId])\n  @@index([roomId, sortOrder])\n  @@index([roomId, isMainImage])\n  @@index([aiDetected, aiAccuracy])\n  @@index([syncStatus])\n  @@map(\"room_images\")\n}\n\nmodel PropertyFeatureCategory {\n  id        Int      @id @default(autoincrement())\n  name      Json // Multilingual names stored as JSON\n  sort      Int      @default(1)\n  isActive  Boolean  @default(false) @map(\"is_active\")\n  createdAt DateTime @default(now()) @map(\"created_at\")\n  updatedAt DateTime @updatedAt @map(\"updated_at\")\n\n  // Relations\n  features PropertyFeature[]\n\n  @@index([sort])\n  @@index([isActive])\n  @@map(\"property_feature_categories\")\n}\n\nmodel PropertyFeature {\n  id         Int                 @id @default(autoincrement())\n  categoryId Int                 @map(\"category_id\")\n  type       PropertyFeatureType\n  name       Json // Multilingual names stored as JSON\n  sort       Int                 @default(1)\n  isActive   Boolean             @default(false) @map(\"is_active\")\n  createdAt  DateTime            @default(now()) @map(\"created_at\")\n  updatedAt  DateTime            @updatedAt @map(\"updated_at\")\n\n  // Relations\n  category PropertyFeatureCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)\n  options  PropertyFeatureOption[]\n\n  @@index([categoryId])\n  @@index([type])\n  @@index([sort])\n  @@index([isActive])\n  @@map(\"property_features\")\n}\n\n// NEW: Property Feature Options (for select type features)\nmodel PropertyFeatureOption {\n  id                Int      @id @default(autoincrement())\n  propertyFeatureId Int      @map(\"property_feature_id\")\n  value             Json // Multilingual values stored as JSON\n  createdAt         DateTime @default(now()) @map(\"created_at\")\n  updatedAt         DateTime @updatedAt @map(\"updated_at\")\n\n  // Relations\n  propertyFeature PropertyFeature @relation(fields: [propertyFeatureId], references: [id], onDelete: Cascade)\n\n  @@index([propertyFeatureId])\n  @@map(\"property_feature_options\")\n}\n\n// Global application configuration (key-value store)\n// Key used by the pin-retention system: \"pin_retention_days\" (default \"30\")\nmodel SystemConfig {\n  id        Int      @id @default(autoincrement())\n  key       String   @unique\n  value     String\n  createdAt DateTime @default(now()) @map(\"created_at\")\n  updatedAt DateTime @updatedAt @map(\"updated_at\")\n\n  @@index([key])\n  @@map(\"system_configs\")\n}\n\n// Named feature sheet — independent from properties (Option A).\n// `values` is a flat key→value object (catalog keys from template / catalogue).\nmodel FeatureSheet {\n  id            Int      @id @default(autoincrement())\n  name          String\n  values        Json     @default(\"{}\")\n  schemaVersion Int      @default(1) @map(\"schema_version\")\n  userId        Int      @map(\"user_id\")\n  createdAt     DateTime @default(now()) @map(\"created_at\")\n  updatedAt     DateTime @updatedAt @map(\"updated_at\")\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([updatedAt])\n  @@index([name])\n  @@map(\"feature_sheets\")\n}\n\n// NEW: Canvassing Visit Model\nmodel CanvassingVisit {\n  id String @id @default(cuid())\n\n  // GPS coordinates\n  latitude  Float\n  longitude Float\n\n  // Contact information\n  contactMethod  ContactMethod  @map(\"contact_method\")\n  contactMethod2 ContactMethod? @map(\"contact_method_2\")\n  contactMethod3 ContactMethod? @map(\"contact_method_3\")\n  contactMethod4 ContactMethod? @map(\"contact_method_4\")\n  houseName      String         @map(\"house_name\")\n  vendorName     String?        @map(\"vendor_name\")\n  comments       String?        @db.Text // Initial comment\n\n  // Address components (optional, from geocoding)\n  streetAddress String? @map(\"street_address\")\n  neighborhood  String?\n  city          String?\n  postalCode    String? @map(\"postal_code\")\n\n  // Optional image\n  imagePath String? @map(\"image_path\")\n\n  // Response tracking\n  responseReceived ResponseType? @map(\"response_received\")\n  responseDate     DateTime?     @map(\"response_date\")\n\n  // Sync status\n  isSynced Boolean   @default(false) @map(\"is_synced\")\n  mobileId String?   @map(\"mobile_id\") // Original mobile UUID\n  syncedAt DateTime? @map(\"synced_at\")\n\n  // Timestamps\n  createdAt DateTime @default(now()) @map(\"created_at\")\n  updatedAt DateTime @updatedAt @map(\"updated_at\")\n\n  // Relations - Many-to-many with users\n  visitUsers CanvassingVisitUser[]\n\n  // Revisit tracking\n  originalRevisits VisitRevisit[] @relation(\"OriginalVisit\")\n  revisitOf        VisitRevisit[] @relation(\"RevisitVisit\")\n\n  // Additional comments\n  additionalComments CanvassingVisitComment[]\n\n  // Revisits - this visit can have multiple revisits\n  revisits Revisit[] @relation(\"OriginalVisit\")\n\n  @@index([latitude, longitude])\n  @@index([contactMethod])\n  @@index([responseReceived])\n  @@index([createdAt])\n  @@index([isSynced])\n  @@map(\"canvassing_visits\")\n}\n\n// Track time spent on inventory tasks\nmodel InventorySession {\n  id         Int       @id @default(autoincrement())\n  userId     Int       @map(\"user_id\")\n  propertyId Int       @map(\"property_id\")\n  startTime  DateTime  @map(\"start_time\")\n  endTime    DateTime? @map(\"end_time\")\n  duration   Int? // Duration in seconds\n  deviceType String?   @map(\"device_type\") // \"mobile\" or \"desktop\"\n  // Relations\n  user       User      @relation(fields: [userId], references: [id], onDelete: Cascade)\n  property   Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([propertyId])\n  @@map(\"inventory_sessions\")\n}\n\n// System metrics\nmodel SystemMetrics {\n  id                   Int      @id @default(autoincrement())\n  date                 DateTime @default(now())\n  totalUsers           Int      @default(0) @map(\"total_users\")\n  loggedInUsers        Int      @default(0) @map(\"logged_in_users\") // Utilisateurs connectés\n  contributingUsers    Int      @default(0) @map(\"contributing_users\") // Utilisateurs ayant créé/modifié du contenu\n  totalProperties      Int      @default(0) @map(\"total_properties\")\n  newProperties        Int      @default(0) @map(\"new_properties\") // Nouvelles propriétés ce jour\n  completedInventories Int      @default(0) @map(\"completed_inventories\")\n  avgCompletionTime    Int?     @map(\"avg_completion_time\") // En secondes\n  storageUsed          Float    @default(0) @map(\"storage_used\") // En MB\n  aiRecognitionRate    Float?   @map(\"ai_recognition_rate\") // Taux de réussite\n  totalImageCount      Int      @default(0) @map(\"total_image_count\") // Nombre total d'images\n  newImageCount        Int      @default(0) @map(\"new_image_count\") // Nouvelles images ce jour\n\n  // Canvassing metrics\n  totalCanvassingVisits Int @default(0) @map(\"total_canvassing_visits\")\n  newCanvassingVisits   Int @default(0) @map(\"new_canvassing_visits\")\n  positiveResponses     Int @default(0) @map(\"positive_responses\")\n  negativeResponses     Int @default(0) @map(\"negative_responses\")\n  pendingResponses      Int @default(0) @map(\"pending_responses\")\n\n  @@index([date])\n  @@map(\"system_metrics\")\n}\n\n// Mobile app sync tracking\nmodel SyncLog {\n  id            Int       @id @default(autoincrement())\n  userId        Int       @map(\"user_id\")\n  deviceId      String    @map(\"device_id\")\n  syncStarted   DateTime  @map(\"sync_started\")\n  syncCompleted DateTime? @map(\"sync_completed\")\n  itemsSynced   Int       @default(0) @map(\"items_synced\")\n  syncStatus    String    @default(\"in_progress\") // \"in_progress\", \"completed\", \"failed\"\n  errorMessage  String?   @map(\"error_message\") @db.Text\n\n  @@index([userId])\n  @@index([syncStatus])\n  @@map(\"sync_logs\")\n}\n\n// User activity tracking for detailed analytics\nenum ActivityType {\n  LOGIN\n  LOGOUT\n  CREATE_PROPERTY\n  EDIT_PROPERTY\n  DELETE_PROPERTY\n  VIEW_PROPERTY\n  ADD_ROOM\n  EDIT_ROOM\n  DELETE_ROOM\n  ADD_IMAGE\n  DELETE_IMAGE\n  EDIT_IMAGE\n  COMPLETE_INVENTORY\n  CANVASSING_VISIT\n  CREATE_USER\n  EDIT_USER\n  DELETE_USER\n  CHANGE_PASSWORD\n  RESET_PASSWORD\n  PROPERTY_SHARE\n  SYNC_DATA\n  EXPORT_DATA\n  IMPORT_DATA\n}\n\nenum EntityType {\n  USER\n  PROPERTY\n  ROOM\n  IMAGE\n  CANVASSING_VISIT\n  SYSTEM\n}\n\nmodel UserActivity {\n  id           Int          @id @default(autoincrement())\n  userId       Int          @map(\"user_id\")\n  activityType ActivityType @default(LOGIN) @map(\"activity_type\")\n  entityId     String?      @map(\"entity_id\")\n  entityType   EntityType?  @map(\"entity_type\")\n  details      String?      @db.Text\n  deviceType   String?      @map(\"device_type\")\n  duration     Int?\n  timestamp    DateTime     @default(now())\n  metadata     String?      @db.Text\n\n  user User @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([userId])\n  @@index([timestamp])\n  @@index([activityType])\n  @@index([entityType, entityId])\n  @@map(\"user_activities\")\n}\n\n// Visit configuration settings\nmodel VisitConfiguration {\n  id                Int      @id @default(autoincrement())\n  revisitDelayHours Int      @default(168) @map(\"revisit_delay_hours\") // Default 1 week (168 hours)\n  isActive          Boolean  @default(true) @map(\"is_active\")\n  createdAt         DateTime @default(now()) @map(\"created_at\")\n  updatedAt         DateTime @updatedAt @map(\"updated_at\")\n\n  @@map(\"visit_configurations\")\n}\n\n// Junction table for visit-user relationships\nmodel CanvassingVisitUser {\n  id        Int      @id @default(autoincrement())\n  visitId   String   @map(\"visit_id\")\n  userId    Int      @map(\"user_id\")\n  userName  String   @map(\"user_name\")\n  isCreator Boolean  @default(false) @map(\"is_creator\") // Who created the visit\n  joinedAt  DateTime @default(now()) @map(\"joined_at\")\n\n  // Relations\n  visit CanvassingVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)\n  user  User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@unique([visitId, userId])\n  @@index([visitId])\n  @@index([userId])\n  @@index([isCreator])\n  @@index([joinedAt])\n  @@map(\"canvassing_visit_users\")\n}\n\n// Visit Revisit tracking\nmodel VisitRevisit {\n  id              String   @id @default(cuid())\n  originalVisitId String   @map(\"original_visit_id\")\n  newVisitId      String   @map(\"new_visit_id\")\n  revisitReason   String?  @map(\"revisit_reason\")\n  createdAt       DateTime @default(now()) @map(\"created_at\")\n\n  // Relations\n  originalVisit CanvassingVisit @relation(\"OriginalVisit\", fields: [originalVisitId], references: [id], onDelete: Cascade)\n  newVisit      CanvassingVisit @relation(\"RevisitVisit\", fields: [newVisitId], references: [id], onDelete: Cascade)\n\n  @@index([originalVisitId])\n  @@index([newVisitId])\n  @@map(\"visit_revisits\")\n}\n\n// Additional comments for CanvassingVisit\nmodel CanvassingVisitComment {\n  id        String   @id @default(cuid())\n  visitId   String   @map(\"visit_id\")\n  userId    Int      @map(\"user_id\")\n  comment   String   @db.Text\n  isInitial Boolean  @default(false) @map(\"is_initial\") // True if this is the initial comment\n  createdAt DateTime @default(now()) @map(\"created_at\")\n  updatedAt DateTime @updatedAt @map(\"updated_at\")\n\n  // Relations\n  visit CanvassingVisit @relation(fields: [visitId], references: [id], onDelete: Cascade)\n  user  User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([visitId])\n  @@index([userId])\n  @@index([createdAt])\n  @@map(\"canvassing_visit_comments\")\n}\n\n// Revisit Model - similar to CanvassingVisit but linked to an original visit\nmodel Revisit {\n  id              String @id @default(cuid())\n  originalVisitId String @map(\"original_visit_id\")\n\n  // GPS coordinates\n  latitude  Float\n  longitude Float\n\n  // Contact information - can use up to 4 contact methods\n  contactMethod1 ContactMethod? @map(\"contact_method_1\")\n  contactMethod2 ContactMethod? @map(\"contact_method_2\")\n  contactMethod3 ContactMethod? @map(\"contact_method_3\")\n  contactMethod4 ContactMethod? @map(\"contact_method_4\")\n\n  houseName  String  @map(\"house_name\")\n  vendorName String? @map(\"vendor_name\")\n  comments   String? @db.Text\n\n  // Address components (optional, from geocoding)\n  streetAddress String? @map(\"street_address\")\n  neighborhood  String?\n  city          String?\n  postalCode    String? @map(\"postal_code\")\n\n  // Optional image\n  imagePath String? @map(\"image_path\")\n\n  // Response tracking\n  responseReceived ResponseType? @map(\"response_received\")\n  responseDate     DateTime?     @map(\"response_date\")\n\n  // User who performed the revisit\n  userId   Int    @map(\"user_id\")\n  userName String @map(\"user_name\")\n\n  // Timestamps\n  createdAt DateTime @default(now()) @map(\"created_at\")\n  updatedAt DateTime @updatedAt @map(\"updated_at\")\n\n  // Relations\n  originalVisit CanvassingVisit @relation(\"OriginalVisit\", fields: [originalVisitId], references: [id], onDelete: Cascade)\n  user          User            @relation(fields: [userId], references: [id], onDelete: Cascade)\n\n  @@index([originalVisitId])\n  @@index([userId])\n  @@index([latitude, longitude])\n  @@index([responseReceived])\n  @@index([createdAt])\n  @@map(\"revisits\")\n}\n",
  "inlineSchemaHash": "5b5c05bfcb11fb24311baf2256524074d8a4eefb21c8c0c6bc8fc6d42bcdf22a",
  "copyEngine": false
}
config.dirname = '/'

config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"dbName\":\"users\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"email\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"password\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"role\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"UserRole\",\"nativeType\":null,\"default\":\"USER\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"authType\",\"dbName\":\"auth_type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"AuthType\",\"nativeType\":null,\"default\":\"LOCAL\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"googleId\",\"dbName\":\"google_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"dbName\":\"is_active\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deactivatedAt\",\"dbName\":\"deactivated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"properties\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Property\",\"nativeType\":null,\"relationName\":\"PropertyToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sharedProperties\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PropertyShare\",\"nativeType\":null,\"relationName\":\"PropertyShareToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"inventorySessions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InventorySession\",\"nativeType\":null,\"relationName\":\"InventorySessionToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"canvassingVisits\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisitUser\",\"nativeType\":null,\"relationName\":\"CanvassingVisitUserToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"activities\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"UserActivity\",\"nativeType\":null,\"relationName\":\"UserToUserActivity\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"visitComments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisitComment\",\"nativeType\":null,\"relationName\":\"CanvassingVisitCommentToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"revisits\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Revisit\",\"nativeType\":null,\"relationName\":\"RevisitToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"featureSheets\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"FeatureSheet\",\"nativeType\":null,\"relationName\":\"FeatureSheetToUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Property\":{\"dbName\":\"properties\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"reference\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"street\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"city\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"state\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"postalCode\",\"dbName\":\"postal_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"country\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"address\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"imagePath\",\"dbName\":\"image_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"roomCount\",\"dbName\":\"room_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"imageCount\",\"dbName\":\"image_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"inventoryStatus\",\"dbName\":\"inventory_status\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"InventoryStatus\",\"nativeType\":null,\"default\":\"DRAFT\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"startedAt\",\"dbName\":\"started_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completedAt\",\"dbName\":\"completed_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"PropertyToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"rooms\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Room\",\"nativeType\":null,\"relationName\":\"PropertyToRoom\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sharedWith\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PropertyShare\",\"nativeType\":null,\"relationName\":\"PropertyToPropertyShare\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"inventorySessions\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"InventorySession\",\"nativeType\":null,\"relationName\":\"InventorySessionToProperty\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"listingPerson\",\"dbName\":\"listing_person\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PropertyShare\":{\"dbName\":\"property_shares\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"propertyId\",\"dbName\":\"property_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"canEdit\",\"dbName\":\"can_edit\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"canDelete\",\"dbName\":\"can_delete\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"property\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Property\",\"nativeType\":null,\"relationName\":\"PropertyToPropertyShare\",\"relationFromFields\":[\"propertyId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"PropertyShareToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"propertyId\",\"userId\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"propertyId\",\"userId\"]}],\"isGenerated\":false},\"Room\":{\"dbName\":\"rooms\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"propertyId\",\"dbName\":\"property_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"imageCount\",\"dbName\":\"image_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isComplete\",\"dbName\":\"is_complete\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sortOrder\",\"dbName\":\"sort_order\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"property\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Property\",\"nativeType\":null,\"relationName\":\"PropertyToRoom\",\"relationFromFields\":[\"propertyId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"images\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"RoomImage\",\"nativeType\":null,\"relationName\":\"RoomToRoomImage\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"RoomImage\":{\"dbName\":\"room_images\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"roomId\",\"dbName\":\"room_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"imagePath\",\"dbName\":\"image_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"description\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"notes\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"condition\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"aiDetected\",\"dbName\":\"ai_detected\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"aiAccuracy\",\"dbName\":\"ai_accuracy\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sortOrder\",\"dbName\":\"sort_order\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isMainImage\",\"dbName\":\"is_main_image\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"localId\",\"dbName\":\"local_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"syncStatus\",\"dbName\":\"sync_status\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"room\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Room\",\"nativeType\":null,\"relationName\":\"RoomToRoomImage\",\"relationFromFields\":[\"roomId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PropertyFeatureCategory\":{\"dbName\":\"property_feature_categories\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sort\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"dbName\":\"is_active\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"features\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PropertyFeature\",\"nativeType\":null,\"relationName\":\"PropertyFeatureToPropertyFeatureCategory\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PropertyFeature\":{\"dbName\":\"property_features\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"categoryId\",\"dbName\":\"category_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PropertyFeatureType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"sort\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"dbName\":\"is_active\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"category\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PropertyFeatureCategory\",\"nativeType\":null,\"relationName\":\"PropertyFeatureToPropertyFeatureCategory\",\"relationFromFields\":[\"categoryId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"options\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PropertyFeatureOption\",\"nativeType\":null,\"relationName\":\"PropertyFeatureToPropertyFeatureOption\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"PropertyFeatureOption\":{\"dbName\":\"property_feature_options\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"propertyFeatureId\",\"dbName\":\"property_feature_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"value\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Json\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"propertyFeature\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"PropertyFeature\",\"nativeType\":null,\"relationName\":\"PropertyFeatureToPropertyFeatureOption\",\"relationFromFields\":[\"propertyFeatureId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SystemConfig\":{\"dbName\":\"system_configs\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"key\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":true,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"value\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"FeatureSheet\":{\"dbName\":\"feature_sheets\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"values\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Json\",\"nativeType\":null,\"default\":\"{}\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"schemaVersion\",\"dbName\":\"schema_version\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":1,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"FeatureSheetToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"CanvassingVisit\":{\"dbName\":\"canvassing_visits\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"cuid\",\"args\":[1]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"latitude\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"longitude\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod\",\"dbName\":\"contact_method\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod2\",\"dbName\":\"contact_method_2\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod3\",\"dbName\":\"contact_method_3\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod4\",\"dbName\":\"contact_method_4\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"houseName\",\"dbName\":\"house_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"vendorName\",\"dbName\":\"vendor_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"comments\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"streetAddress\",\"dbName\":\"street_address\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"neighborhood\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"city\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"postalCode\",\"dbName\":\"postal_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"imagePath\",\"dbName\":\"image_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"responseReceived\",\"dbName\":\"response_received\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ResponseType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"responseDate\",\"dbName\":\"response_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isSynced\",\"dbName\":\"is_synced\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"mobileId\",\"dbName\":\"mobile_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"syncedAt\",\"dbName\":\"synced_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"visitUsers\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisitUser\",\"nativeType\":null,\"relationName\":\"CanvassingVisitToCanvassingVisitUser\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"originalRevisits\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"VisitRevisit\",\"nativeType\":null,\"relationName\":\"OriginalVisit\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"revisitOf\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"VisitRevisit\",\"nativeType\":null,\"relationName\":\"RevisitVisit\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"additionalComments\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisitComment\",\"nativeType\":null,\"relationName\":\"CanvassingVisitToCanvassingVisitComment\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"revisits\",\"kind\":\"object\",\"isList\":true,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Revisit\",\"nativeType\":null,\"relationName\":\"OriginalVisit\",\"relationFromFields\":[],\"relationToFields\":[],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"InventorySession\":{\"dbName\":\"inventory_sessions\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"propertyId\",\"dbName\":\"property_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"startTime\",\"dbName\":\"start_time\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"endTime\",\"dbName\":\"end_time\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duration\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceType\",\"dbName\":\"device_type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"InventorySessionToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"property\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Property\",\"nativeType\":null,\"relationName\":\"InventorySessionToProperty\",\"relationFromFields\":[\"propertyId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SystemMetrics\":{\"dbName\":\"system_metrics\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalUsers\",\"dbName\":\"total_users\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"loggedInUsers\",\"dbName\":\"logged_in_users\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contributingUsers\",\"dbName\":\"contributing_users\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalProperties\",\"dbName\":\"total_properties\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"newProperties\",\"dbName\":\"new_properties\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"completedInventories\",\"dbName\":\"completed_inventories\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"avgCompletionTime\",\"dbName\":\"avg_completion_time\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"storageUsed\",\"dbName\":\"storage_used\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Float\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"aiRecognitionRate\",\"dbName\":\"ai_recognition_rate\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalImageCount\",\"dbName\":\"total_image_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"newImageCount\",\"dbName\":\"new_image_count\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"totalCanvassingVisits\",\"dbName\":\"total_canvassing_visits\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"newCanvassingVisits\",\"dbName\":\"new_canvassing_visits\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"positiveResponses\",\"dbName\":\"positive_responses\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"negativeResponses\",\"dbName\":\"negative_responses\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"pendingResponses\",\"dbName\":\"pending_responses\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"SyncLog\":{\"dbName\":\"sync_logs\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceId\",\"dbName\":\"device_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"syncStarted\",\"dbName\":\"sync_started\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"syncCompleted\",\"dbName\":\"sync_completed\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"itemsSynced\",\"dbName\":\"items_synced\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":0,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"syncStatus\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":\"in_progress\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"errorMessage\",\"dbName\":\"error_message\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"UserActivity\":{\"dbName\":\"user_activities\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"activityType\",\"dbName\":\"activity_type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"ActivityType\",\"nativeType\":null,\"default\":\"LOGIN\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"entityId\",\"dbName\":\"entity_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"entityType\",\"dbName\":\"entity_type\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"EntityType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"details\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"deviceType\",\"dbName\":\"device_type\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"duration\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"timestamp\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"metadata\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"UserToUserActivity\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"VisitConfiguration\":{\"dbName\":\"visit_configurations\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"revisitDelayHours\",\"dbName\":\"revisit_delay_hours\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":168,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isActive\",\"dbName\":\"is_active\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":true,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"CanvassingVisitUser\":{\"dbName\":\"canvassing_visit_users\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Int\",\"nativeType\":null,\"default\":{\"name\":\"autoincrement\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"visitId\",\"dbName\":\"visit_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userName\",\"dbName\":\"user_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isCreator\",\"dbName\":\"is_creator\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"joinedAt\",\"dbName\":\"joined_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"visit\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisit\",\"nativeType\":null,\"relationName\":\"CanvassingVisitToCanvassingVisitUser\",\"relationFromFields\":[\"visitId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"CanvassingVisitUserToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[[\"visitId\",\"userId\"]],\"uniqueIndexes\":[{\"name\":null,\"fields\":[\"visitId\",\"userId\"]}],\"isGenerated\":false},\"VisitRevisit\":{\"dbName\":\"visit_revisits\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"cuid\",\"args\":[1]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"originalVisitId\",\"dbName\":\"original_visit_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"newVisitId\",\"dbName\":\"new_visit_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"revisitReason\",\"dbName\":\"revisit_reason\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"originalVisit\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisit\",\"nativeType\":null,\"relationName\":\"OriginalVisit\",\"relationFromFields\":[\"originalVisitId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"newVisit\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisit\",\"nativeType\":null,\"relationName\":\"RevisitVisit\",\"relationFromFields\":[\"newVisitId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"CanvassingVisitComment\":{\"dbName\":\"canvassing_visit_comments\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"cuid\",\"args\":[1]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"visitId\",\"dbName\":\"visit_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"comment\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"isInitial\",\"dbName\":\"is_initial\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"Boolean\",\"nativeType\":null,\"default\":false,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"visit\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisit\",\"nativeType\":null,\"relationName\":\"CanvassingVisitToCanvassingVisitComment\",\"relationFromFields\":[\"visitId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"CanvassingVisitCommentToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false},\"Revisit\":{\"dbName\":\"revisits\",\"schema\":null,\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":true,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"String\",\"nativeType\":null,\"default\":{\"name\":\"cuid\",\"args\":[1]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"originalVisitId\",\"dbName\":\"original_visit_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"latitude\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"longitude\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"Float\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod1\",\"dbName\":\"contact_method_1\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod2\",\"dbName\":\"contact_method_2\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod3\",\"dbName\":\"contact_method_3\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"contactMethod4\",\"dbName\":\"contact_method_4\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ContactMethod\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"houseName\",\"dbName\":\"house_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"vendorName\",\"dbName\":\"vendor_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"comments\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":[\"Text\",[]],\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"streetAddress\",\"dbName\":\"street_address\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"neighborhood\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"city\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"postalCode\",\"dbName\":\"postal_code\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"imagePath\",\"dbName\":\"image_path\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"responseReceived\",\"dbName\":\"response_received\",\"kind\":\"enum\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"ResponseType\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"responseDate\",\"dbName\":\"response_date\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":false,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userId\",\"dbName\":\"user_id\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":true,\"hasDefaultValue\":false,\"type\":\"Int\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"userName\",\"dbName\":\"user_name\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"String\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"createdAt\",\"dbName\":\"created_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":true,\"type\":\"DateTime\",\"nativeType\":null,\"default\":{\"name\":\"now\",\"args\":[]},\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"updatedAt\",\"dbName\":\"updated_at\",\"kind\":\"scalar\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"DateTime\",\"nativeType\":null,\"isGenerated\":false,\"isUpdatedAt\":true},{\"name\":\"originalVisit\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"CanvassingVisit\",\"nativeType\":null,\"relationName\":\"OriginalVisit\",\"relationFromFields\":[\"originalVisitId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false},{\"name\":\"user\",\"kind\":\"object\",\"isList\":false,\"isRequired\":true,\"isUnique\":false,\"isId\":false,\"isReadOnly\":false,\"hasDefaultValue\":false,\"type\":\"User\",\"nativeType\":null,\"relationName\":\"RevisitToUser\",\"relationFromFields\":[\"userId\"],\"relationToFields\":[\"id\"],\"relationOnDelete\":\"Cascade\",\"isGenerated\":false,\"isUpdatedAt\":false}],\"primaryKey\":null,\"uniqueFields\":[],\"uniqueIndexes\":[],\"isGenerated\":false}},\"enums\":{\"UserRole\":{\"values\":[{\"name\":\"ADMIN\",\"dbName\":null},{\"name\":\"USER\",\"dbName\":null}],\"dbName\":null},\"AuthType\":{\"values\":[{\"name\":\"LOCAL\",\"dbName\":null},{\"name\":\"GOOGLE\",\"dbName\":null}],\"dbName\":null},\"InventoryStatus\":{\"values\":[{\"name\":\"DRAFT\",\"dbName\":null},{\"name\":\"COMPLETED\",\"dbName\":null},{\"name\":\"FINALIZED\",\"dbName\":null}],\"dbName\":null},\"ContactMethod\":{\"values\":[{\"name\":\"DOOR\",\"dbName\":null},{\"name\":\"PHONE\",\"dbName\":null},{\"name\":\"EMAIL\",\"dbName\":null},{\"name\":\"LETTER\",\"dbName\":null},{\"name\":\"SMS\",\"dbName\":null},{\"name\":\"BROCHURE\",\"dbName\":null},{\"name\":\"VALUATION_CARD\",\"dbName\":null},{\"name\":\"FLYER\",\"dbName\":null},{\"name\":\"SOCIAL_MEDIA\",\"dbName\":null},{\"name\":\"REFERRAL\",\"dbName\":null}],\"dbName\":null},\"ResponseType\":{\"values\":[{\"name\":\"positive\",\"dbName\":null},{\"name\":\"negative\",\"dbName\":null},{\"name\":\"no_response\",\"dbName\":null},{\"name\":\"pending\",\"dbName\":null}],\"dbName\":null},\"PropertyFeatureType\":{\"values\":[{\"name\":\"bool\",\"dbName\":null},{\"name\":\"text\",\"dbName\":null},{\"name\":\"integer\",\"dbName\":null},{\"name\":\"select\",\"dbName\":null},{\"name\":\"float\",\"dbName\":null}],\"dbName\":null},\"ActivityType\":{\"values\":[{\"name\":\"LOGIN\",\"dbName\":null},{\"name\":\"LOGOUT\",\"dbName\":null},{\"name\":\"CREATE_PROPERTY\",\"dbName\":null},{\"name\":\"EDIT_PROPERTY\",\"dbName\":null},{\"name\":\"DELETE_PROPERTY\",\"dbName\":null},{\"name\":\"VIEW_PROPERTY\",\"dbName\":null},{\"name\":\"ADD_ROOM\",\"dbName\":null},{\"name\":\"EDIT_ROOM\",\"dbName\":null},{\"name\":\"DELETE_ROOM\",\"dbName\":null},{\"name\":\"ADD_IMAGE\",\"dbName\":null},{\"name\":\"DELETE_IMAGE\",\"dbName\":null},{\"name\":\"EDIT_IMAGE\",\"dbName\":null},{\"name\":\"COMPLETE_INVENTORY\",\"dbName\":null},{\"name\":\"CANVASSING_VISIT\",\"dbName\":null},{\"name\":\"CREATE_USER\",\"dbName\":null},{\"name\":\"EDIT_USER\",\"dbName\":null},{\"name\":\"DELETE_USER\",\"dbName\":null},{\"name\":\"CHANGE_PASSWORD\",\"dbName\":null},{\"name\":\"RESET_PASSWORD\",\"dbName\":null},{\"name\":\"PROPERTY_SHARE\",\"dbName\":null},{\"name\":\"SYNC_DATA\",\"dbName\":null},{\"name\":\"EXPORT_DATA\",\"dbName\":null},{\"name\":\"IMPORT_DATA\",\"dbName\":null}],\"dbName\":null},\"EntityType\":{\"values\":[{\"name\":\"USER\",\"dbName\":null},{\"name\":\"PROPERTY\",\"dbName\":null},{\"name\":\"ROOM\",\"dbName\":null},{\"name\":\"IMAGE\",\"dbName\":null},{\"name\":\"CANVASSING_VISIT\",\"dbName\":null},{\"name\":\"SYSTEM\",\"dbName\":null}],\"dbName\":null}},\"types\":{}}")
defineDmmfProperty(exports.Prisma, config.runtimeDataModel)
config.engineWasm = undefined
config.compilerWasm = undefined

config.injectableEdgeEnv = () => ({
  parsed: {
    DATABASE_URL: typeof globalThis !== 'undefined' && globalThis['DATABASE_URL'] || typeof process !== 'undefined' && process.env && process.env.DATABASE_URL || undefined
  }
})

if (typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined) {
  Debug.enable(typeof globalThis !== 'undefined' && globalThis['DEBUG'] || typeof process !== 'undefined' && process.env && process.env.DEBUG || undefined)
}

const PrismaClient = getPrismaClient(config)
exports.PrismaClient = PrismaClient
Object.assign(exports, Prisma)

