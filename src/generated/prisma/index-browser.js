
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


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

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

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

exports.Prisma.PropertyPropertyFeatureScalarFieldEnum = {
  id: 'id',
  propertyFeatureId: 'propertyFeatureId',
  propertyId: 'propertyId',
  valueText: 'valueText',
  valueBool: 'valueBool',
  valueInt: 'valueInt',
  valueFloat: 'valueFloat',
  valueFeatureOptionId: 'valueFeatureOptionId',
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

exports.Prisma.PropertyFeaturesDataScalarFieldEnum = {
  id: 'id',
  propertyId: 'propertyId',
  features: 'features',
  schemaVersion: 'schemaVersion',
  updatedAt: 'updatedAt',
  updatedByUserId: 'updatedByUserId'
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

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
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

exports.PropertyFeatureType = exports.$Enums.PropertyFeatureType = {
  bool: 'bool',
  text: 'text',
  integer: 'integer',
  select: 'select',
  float: 'float'
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
  PropertyPropertyFeature: 'PropertyPropertyFeature',
  SystemConfig: 'SystemConfig',
  PropertyFeaturesData: 'PropertyFeaturesData',
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
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
