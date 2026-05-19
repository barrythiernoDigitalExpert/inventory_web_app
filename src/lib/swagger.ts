import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Web App API',
      version: '1.0.0',
      description: `
## Documentation API — Inventory Web App

Application de gestion immobilière pour **Exclusive Algarve Villas**.

### Authentification

Deux mécanismes d'authentification sont supportés :

- **Session NextAuth (Web)** : Cookie \`next-auth.session-token\` — utilisé par l'interface web.
- **JWT Bearer (Mobile)** : Header \`Authorization: Bearer <token>\` — utilisé par l'application mobile.

### Obtenir un token JWT mobile

\`\`\`
POST /api/auth/login
{ "email": "user@example.com", "password": "password" }
→ { "token": "eyJ...", "user": {...} }
\`\`\`

### Rôles
- **ADMIN** : accès complet à toutes les routes
- **USER** : accès restreint à ses propres données
      `,
      contact: {
        name: 'Support',
        email: 'admin@exclusivealgarve.com',
      },
    },
    servers: [
      {
        url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        description: 'Serveur principal',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenu via POST /api/auth/login (mobile)',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'next-auth.session-token',
          description: 'Session NextAuth (web uniquement)',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '1' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { type: 'string', enum: ['ADMIN', 'USER'] },
            isActive: { type: 'boolean' },
            authType: { type: 'string', enum: ['LOCAL', 'GOOGLE'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Property: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            reference: { type: 'string', example: 'PROP-001' },
            name: { type: 'string' },
            address: { type: 'string' },
            roomCount: { type: 'integer' },
            imageCount: { type: 'integer' },
            inventoryStatus: { type: 'string', enum: ['DRAFT', 'COMPLETED', 'FINALIZED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        CanvassingVisit: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            latitude: { type: 'number', format: 'float' },
            longitude: { type: 'number', format: 'float' },
            houseName: { type: 'string' },
            contactMethod: { type: 'string', enum: ['DOOR', 'PHONE', 'EMAIL', 'LETTER', 'SMS', 'BROCHURE', 'VALUATION_CARD'] },
            responseReceived: { type: 'string', enum: ['positive', 'negative', 'no_response', 'pending'], nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            limit: { type: 'integer' },
            offset: { type: 'integer' },
            hasMore: { type: 'boolean' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentification (web + mobile)' },
      { name: 'Properties', description: 'Gestion des propriétés immobilières (web)' },
      { name: 'Canvassing', description: 'Visites de démarchage (web + mobile)' },
      { name: 'Sync', description: 'Synchronisation mobile' },
      { name: 'Users', description: 'Gestion des utilisateurs' },
      { name: 'Admin', description: 'Routes administrateur' },
      { name: 'Profile', description: 'Profil utilisateur' },
      { name: 'Stats', description: 'Statistiques et tableau de bord' },
    ],
    paths: {
      // ─── AUTH ────────────────────────────────────────────────────────────────
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Connexion email/mot de passe (mobile)',
          description: 'Retourne un JWT valable 7 jours.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Authentification réussie',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      token: { type: 'string', description: 'JWT Bearer token (7 jours)' },
                    },
                  },
                },
              },
            },
            400: { description: 'Email ou mot de passe manquant' },
            401: { description: 'Identifiants invalides' },
            403: { description: 'Compte inactif' },
          },
        },
      },
      '/api/auth/google': {
        post: {
          tags: ['Auth'],
          summary: 'Connexion Google (mobile)',
          description: 'Retourne un JWT valable 30 jours. L\'utilisateur doit déjà exister en base.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'uid'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    uid: { type: 'string', description: 'Google UID' },
                    displayName: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Authentification réussie', content: { 'application/json': { schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' }, token: { type: 'string' } } } } } },
            400: { description: 'Email ou UID manquant' },
            403: { description: 'Compte inactif' },
            404: { description: 'Utilisateur non trouvé' },
          },
        },
      },
      '/api/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Profil de l\'utilisateur connecté (mobile)',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Profil utilisateur', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
            401: { description: 'Token manquant ou invalide' },
          },
        },
      },
      // ─── PROPERTIES ──────────────────────────────────────────────────────────
      '/api/properties': {
        get: {
          tags: ['Properties'],
          summary: 'Liste des propriétés',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'include_features', in: 'query', schema: { type: 'boolean' }, description: 'Inclure les features des propriétés' },
          ],
          responses: {
            200: { description: 'Liste des propriétés', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Property' } } } } },
            401: { description: 'Non authentifié' },
          },
        },
        post: {
          tags: ['Properties'],
          summary: 'Créer une propriété',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['reference'],
                  properties: {
                    reference: { type: 'string', example: 'PROP-001' },
                    name: { type: 'string' },
                    image: { type: 'string', description: 'Image en base64' },
                    address: { type: 'string' },
                    listingPerson: { type: 'string' },
                    rooms: { type: 'array', items: { type: 'object', properties: { code: { type: 'string' }, name: { type: 'string' }, images: { type: 'array' } } } },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Propriété créée' },
            400: { description: 'Référence manquante' },
            409: { description: 'Référence déjà existante' },
          },
        },
      },
      '/api/properties/{id}': {
        get: {
          tags: ['Properties'],
          summary: 'Détail d\'une propriété',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Propriété avec pièces et images' }, 404: { description: 'Non trouvé' } },
        },
        put: {
          tags: ['Properties'],
          summary: 'Mettre à jour une propriété',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, address: { type: 'string' }, listingPerson: { type: 'string' }, image: { type: 'string' } } } } } },
          responses: { 200: { description: 'Propriété mise à jour' } },
        },
        delete: {
          tags: ['Properties'],
          summary: 'Supprimer une propriété',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          responses: { 200: { description: 'Supprimée' }, 403: { description: 'Permission insuffisante' } },
        },
      },
      // ─── CANVASSING VISITS ────────────────────────────────────────────────────
      '/api/canvassingvisits': {
        get: {
          tags: ['Canvassing'],
          summary: 'Liste des visites de démarchage',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          parameters: [
            { name: 'contactMethod', in: 'query', schema: { type: 'string', enum: ['DOOR', 'PHONE', 'EMAIL', 'LETTER', 'SMS', 'BROCHURE', 'VALUATION_CARD'] } },
            { name: 'responseReceived', in: 'query', schema: { type: 'string', enum: ['positive', 'negative', 'no_response', 'pending'] } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 100, maximum: 500 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
            { name: 'forMap', in: 'query', schema: { type: 'boolean' }, description: 'Format allégé pour carte (lat/lng seulement)' },
          ],
          responses: {
            200: {
              description: 'Liste paginée des visites',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          visits: { type: 'array', items: { $ref: '#/components/schemas/CanvassingVisit' } },
                          pagination: { $ref: '#/components/schemas/Pagination' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Canvassing'],
          summary: 'Créer une ou plusieurs visites',
          security: [{ bearerAuth: [] }, { cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  oneOf: [
                    {
                      description: 'Visite unique',
                      type: 'object',
                      required: ['latitude', 'longitude', 'contactMethod', 'houseName'],
                      properties: {
                        latitude: { type: 'number' },
                        longitude: { type: 'number' },
                        contactMethod: { type: 'string' },
                        houseName: { type: 'string' },
                        vendorName: { type: 'string' },
                        comments: { type: 'string' },
                        streetAddress: { type: 'string' },
                        city: { type: 'string' },
                        mobileId: { type: 'string', description: 'ID unique mobile pour éviter les doublons' },
                        imagePath: { type: 'string', description: 'Base64 ou URL' },
                        responseReceived: { type: 'string' },
                      },
                    },
                    {
                      description: 'Bulk sync (tableau de visites)',
                      type: 'array',
                      items: { type: 'object' },
                    },
                  ],
                },
              },
            },
          },
          responses: { 201: { description: 'Visite(s) créée(s)' }, 400: { description: 'Champs requis manquants' } },
        },
      },
      '/api/canvassingvisits/web': {
        get: {
          tags: ['Canvassing'],
          summary: 'Visites pour l\'interface web (NextAuth)',
          description: 'Même filtres que /api/canvassingvisits. Les non-admins ne voient que leurs propres visites.',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'userId', in: 'query', schema: { type: 'integer' }, description: 'Admin seulement' },
            { name: 'contactMethod', in: 'query', schema: { type: 'string' } },
            { name: 'forMap', in: 'query', schema: { type: 'boolean' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 100 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
          ],
          responses: { 200: { description: 'Liste des visites' }, 403: { description: 'Accès aux visites d\'un autre utilisateur interdit' } },
        },
      },
      '/api/canvassingvisits/{visitId}/revisit': {
        post: {
          tags: ['Canvassing'],
          summary: 'Créer une revisite',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'visitId', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['latitude', 'longitude', 'contactMethod1', 'houseName'],
                  properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    contactMethod1: { type: 'string' },
                    houseName: { type: 'string' },
                    comments: { type: 'string' },
                    responseReceived: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Revisite créée' },
            400: { description: 'Délai de revisite non atteint ou champs manquants' },
            403: { description: 'Non membre de la visite' },
            404: { description: 'Visite originale non trouvée' },
          },
        },
        get: {
          tags: ['Canvassing'],
          summary: 'Lister les revisites d\'une visite',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'visitId', in: 'path', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Liste des revisites' }, 403: { description: 'Non membre' } },
        },
      },
      // ─── SYNC ─────────────────────────────────────────────────────────────────
      '/api/sync/initiate': {
        post: {
          tags: ['Sync'],
          summary: 'Démarrer une session de synchronisation',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', required: ['deviceId'], properties: { deviceId: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Session démarrée', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { syncId: { type: 'string' }, started: { type: 'string', format: 'date-time' } } } } } } } } },
        },
      },
      '/api/sync/pull': {
        get: {
          tags: ['Sync'],
          summary: 'Récupérer les propriétés mises à jour',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'lastSyncTimestamp', in: 'query', schema: { type: 'integer' }, description: 'Timestamp Unix (ms) du dernier sync' },
            { name: 'propertyReference', in: 'query', schema: { type: 'string' } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 50 }, description: 'Nombre de propriétés par page' },
            { name: 'cursor', in: 'query', schema: { type: 'string' }, description: 'ID de la dernière propriété pour la pagination' },
          ],
          responses: {
            200: {
              description: 'Propriétés mises à jour',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/Property' } },
                      pagination: { type: 'object', properties: { hasMore: { type: 'boolean' }, nextCursor: { type: 'string', nullable: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/sync/upload': {
        post: {
          tags: ['Sync'],
          summary: 'Envoyer des images de pièces',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['syncId', 'propertyReference', 'roomCode', 'roomName'],
                  properties: {
                    syncId: { type: 'string' },
                    propertyReference: { type: 'string' },
                    roomCode: { type: 'string' },
                    roomName: { type: 'string' },
                    hasImages: { type: 'boolean' },
                    'localIds[]': { type: 'array', items: { type: 'string' } },
                    'descriptions[]': { type: 'array', items: { type: 'string' } },
                    'images[]': { type: 'array', items: { type: 'string', format: 'binary' } },
                    propertyImage: { type: 'string', format: 'binary' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Images uploadées' }, 400: { description: 'Session sync invalide ou champs manquants' } },
        },
      },
      '/api/sync/bulk-rooms': {
        post: {
          tags: ['Sync'],
          summary: 'Créer des pièces en masse',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['syncId', 'rooms'],
                  properties: {
                    syncId: { type: 'string' },
                    rooms: {
                      type: 'array',
                      items: {
                        type: 'object',
                        required: ['propertyReference', 'roomCode', 'roomName'],
                        properties: {
                          propertyReference: { type: 'string' },
                          roomCode: { type: 'string' },
                          roomName: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Pièces créées' } },
        },
      },
      '/api/sync/complete': {
        post: {
          tags: ['Sync'],
          summary: 'Finaliser la synchronisation',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['syncId'],
                  properties: {
                    syncId: { type: 'string' },
                    propertyReferences: { type: 'array', items: { type: 'string' } },
                    roomUpdates: { type: 'array', items: { type: 'object' } },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Sync finalisée' } },
        },
      },
      // ─── USERS ───────────────────────────────────────────────────────────────
      '/api/users': {
        get: {
          tags: ['Users'],
          summary: 'Liste des utilisateurs (admin web)',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Liste des utilisateurs' }, 403: { description: 'Admin requis' } },
        },
        post: {
          tags: ['Users'],
          summary: 'Créer un utilisateur (admin web)',
          security: [{ cookieAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    role: { type: 'string', enum: ['ADMIN', 'USER'], default: 'USER' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Utilisateur créé' }, 409: { description: 'Email déjà utilisé' } },
        },
      },
      '/api/users/{id}/status': {
        patch: {
          tags: ['Users'],
          summary: 'Activer / désactiver un utilisateur (admin web)',
          security: [{ cookieAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Statut mis à jour' }, 404: { description: 'Utilisateur non trouvé' } },
        },
      },
      '/api/mobile/users': {
        get: {
          tags: ['Users'],
          summary: 'Liste des utilisateurs (admin mobile)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Liste des utilisateurs' } },
        },
        post: {
          tags: ['Users'],
          summary: 'Créer un utilisateur (admin mobile)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['name', 'email', 'password'], properties: { name: { type: 'string' }, email: { type: 'string' }, password: { type: 'string', minLength: 8 }, role: { type: 'string', enum: ['ADMIN', 'USER'] } } } } } },
          responses: { 201: { description: 'Créé' } },
        },
      },
      '/api/mobile/users/{id}/status': {
        patch: {
          tags: ['Users'],
          summary: 'Activer / désactiver un utilisateur (admin mobile)',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['isActive'], properties: { isActive: { type: 'boolean' } } } } } },
          responses: { 200: { description: 'Statut mis à jour' } },
        },
      },
      // ─── PROFILE ─────────────────────────────────────────────────────────────
      '/api/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Profil de l\'utilisateur connecté (web)',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Profil utilisateur' } },
        },
        patch: {
          tags: ['Profile'],
          summary: 'Mettre à jour le profil',
          security: [{ cookieAuth: [] }],
          requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } } } } },
          responses: { 200: { description: 'Profil mis à jour' } },
        },
      },
      '/api/profile/change-password': {
        post: {
          tags: ['Profile'],
          summary: 'Changer le mot de passe',
          security: [{ cookieAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string', minLength: 8 } } } } } },
          responses: { 200: { description: 'Mot de passe changé' }, 400: { description: 'Mot de passe actuel incorrect ou nouveau invalide' } },
        },
      },
      // ─── ADMIN ───────────────────────────────────────────────────────────────
      '/api/admin/dashboard-stats': {
        get: {
          tags: ['Admin'],
          summary: 'Statistiques globales du dashboard (admin web)',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Agrégats: users, propriétés, visites, images' } },
        },
      },
      '/api/admin/visit-config': {
        get: {
          tags: ['Admin'],
          summary: 'Configuration des revisites (admin web)',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Configuration active' } },
        },
        put: {
          tags: ['Admin'],
          summary: 'Modifier la configuration des revisites',
          security: [{ cookieAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['revisitDelayHours'], properties: { revisitDelayHours: { type: 'integer', minimum: 1, maximum: 8760 } } } } } },
          responses: { 200: { description: 'Configuration mise à jour' } },
        },
      },
      '/api/visit-config': {
        get: {
          tags: ['Admin'],
          summary: 'Configuration des revisites (mobile)',
          security: [{ bearerAuth: [] }],
          responses: { 200: { description: 'Configuration active' } },
        },
        post: {
          tags: ['Admin'],
          summary: 'Modifier la configuration des revisites (admin mobile)',
          security: [{ bearerAuth: [] }],
          requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['revisitDelayHours'], properties: { revisitDelayHours: { type: 'integer', minimum: 1, maximum: 8760 } } } } } },
          responses: { 200: { description: 'Mis à jour' }, 403: { description: 'Admin requis' } },
        },
      },
      // ─── STATS ───────────────────────────────────────────────────────────────
      '/api/dashboard/stats': {
        get: {
          tags: ['Stats'],
          summary: 'Statistiques inventaire (web)',
          security: [{ cookieAuth: [] }],
          responses: { 200: { description: 'Compteurs propriétés, pièces, images' } },
        },
      },
      '/api/stats': {
        get: {
          tags: ['Stats'],
          summary: 'Statistiques globales (admin mobile)',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['day', 'week', 'month'], default: 'month' } },
            { name: 'userId', in: 'query', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Stats complètes équipe, maildrop, inventaire' } },
        },
      },
      '/api/canvassingvisits/stats': {
        get: {
          tags: ['Stats'],
          summary: 'Statistiques de démarchage par utilisateur',
          security: [{ cookieAuth: [] }],
          parameters: [
            { name: 'userId', in: 'query', schema: { type: 'integer' }, description: 'Admin seulement' },
            { name: 'period', in: 'query', schema: { type: 'string', enum: ['all', 'today', 'week', 'month', 'custom'], default: 'all' } },
            { name: 'startDate', in: 'query', schema: { type: 'string', format: 'date' } },
            { name: 'endDate', in: 'query', schema: { type: 'string', format: 'date' } },
          ],
          responses: { 200: { description: 'Stats: visites, zones, méthodes de contact, timeline' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
