# API Reference — Maps & Features

---

## 1. API Carte des visites (avec statistiques)

### 1.1 Pins de la carte (mode carte léger)

```
GET /api/canvassingvisits/web?forMap=true
```

Auth : session NextAuth (cookie). Utilisé par l'interface web.

**Query params :**

| Paramètre         | Type     | Défaut | Description                                              |
|-------------------|----------|--------|----------------------------------------------------------|
| `forMap`          | boolean  | false  | **Obligatoire** — passer `true` pour le mode carte       |
| `userId`          | number   | —      | Filtre par utilisateur (admin seulement)                 |
| `contactMethod`   | string   | —      | `DOOR`, `PHONE`, `EMAIL`, `LETTER`, `SMS`, `BROCHURE`, `VALUATION_CARD` |
| `responseReceived`| string   | —      | `positive`, `negative`, `no_response`, `pending`         |
| `startDate`       | ISO 8601 | —      | Borne inférieure (inclusif)                              |
| `endDate`         | ISO 8601 | —      | Borne supérieure (inclusif)                              |
| `limit`           | number   | 100    | Max 500                                                  |
| `offset`          | number   | 0      | Pour la pagination                                       |

**Réponse (200) — mode `forMap=true` :**
```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": 42,
        "latitude": 51.5074,
        "longitude": -0.1278,
        "houseName": "12 Baker Street",
        "contactMethod": "DOOR",
        "responseReceived": "positive",
        "createdAt": "2026-05-15T14:30:00.000Z",
        "comments": "Interested, call back next week",
        "imagePath": "https://res.cloudinary.com/...",
        "streetAddress": "12 Baker Street",
        "neighborhood": "Marylebone",
        "city": "London",
        "vendorName": "John Smith",
        "visitUsers": [
          {
            "userId": 7,
            "userName": "Alice Martin",
            "isCreator": true,
            "user": { "id": 7, "name": "Alice Martin", "email": "alice@example.com", "role": "USER" }
          }
        ]
      }
    ],
    "pagination": {
      "total": 312,
      "limit": 100,
      "offset": 0,
      "hasMore": true
    }
  },
  "processingTime": 87
}
```

> En mode `forMap=true` le champ `visitConfig` est omis et les données sont allégées (pas de revisits détaillées).

---

### 1.2 Statistiques par utilisateur

```
GET /api/canvassingvisits/stats
```

Auth : session NextAuth.

**Query params :**

| Paramètre   | Type     | Défaut | Description                                            |
|-------------|----------|--------|--------------------------------------------------------|
| `userId`    | number   | —      | Autre utilisateur (admin seulement)                    |
| `period`    | string   | `all`  | `all`, `today`, `week`, `month`, `custom`              |
| `startDate` | ISO 8601 | —      | Requis si `period=custom`                              |
| `endDate`   | ISO 8601 | —      | Requis si `period=custom`                              |

**Réponse (200) :**
```json
{
  "userId": 7,
  "basicStats": {
    "totalVisits": 148,
    "positiveResponses": 52,
    "negativeResponses": 61,
    "pendingResponses": 35
  },
  "periodStats": {
    "period": "week",
    "totalVisits": 18,
    "positiveResponses": 7,
    "negativeResponses": 8,
    "pendingResponses": 3,
    "responseRate": 83.3,
    "dateRange": { "gte": "2026-05-13T00:00:00.000Z" }
  },
  "recentVisits": [ /* 5 dernières visites */ ],
  "topAreas": [
    {
      "city": "London",
      "neighborhood": "Marylebone",
      "totalVisits": 24,
      "positiveResponses": 11,
      "successRate": 45.8
    }
  ],
  "contactMethodPrefs": [
    {
      "contactMethod": "DOOR",
      "totalVisits": 90,
      "totalResponses": 75,
      "positiveResponses": 32,
      "responseRate": 83.3,
      "successRate": 42.7
    }
  ],
  "activityTimeline": [
    { "date": "2026-04-20", "visits": 3, "responses": 2, "responseRate": 66 }
  ],
  "generatedAt": "2026-05-20T10:00:00.000Z"
}
```

---

### 1.3 Vue admin — visites par utilisateur (pour le dashboard maps)

```
GET /api/admin/visitsbyusers
Authorization: Bearer <jwt_token>
```

Auth : JWT, rôle **ADMIN** requis.

**Query params :**

| Paramètre   | Type     | Défaut | Description                     |
|-------------|----------|--------|---------------------------------|
| `startDate` | ISO 8601 | —      | Filtre la période                |
| `endDate`   | ISO 8601 | —      | Filtre la période                |
| `limit`     | number   | 200    | Max 1000 (pagination utilisateurs) |
| `offset`    | number   | 0      |                                 |

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "userStats": {
      "7": {
        "userName": "Alice Martin",
        "userEmail": "alice@example.com",
        "totalVisits": 148,
        "todayVisits": 4,
        "responseRate": 77.7,
        "positiveResponses": 52,
        "negativeResponses": 61,
        "pendingResponses": 35,
        "lastActivity": "2026-05-20T09:15:00.000Z"
      }
    },
    "visitsByUser": {
      "7": [
        {
          "id": 42,
          "houseName": "12 Baker Street",
          "contactMethod": "DOOR",
          "responseReceived": "positive",
          "createdAt": "2026-05-15T14:30:00.000Z",
          "latitude": 51.5074,
          "longitude": -0.1278,
          "visitUsers": [
            { "userId": 7, "userName": "Alice Martin", "isCreator": true }
          ]
        }
      ]
    },
    "totalUsers": 12,
    "pagination": {
      "limit": 200,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

> Maximum 50 visites récentes chargées par utilisateur dans `visitsByUser`.

---

## 2. API Features — Inventory (Administration)

Les features sont les caractéristiques structurées d'une propriété (type de chauffage, nombre de pièces, état du toit, etc.), regroupées par catégorie.

### 2.1 Lire les features d'une propriété

```
GET /api/properties/{propertyId}/features
```

Auth : session NextAuth.  
Accès : propriétaire, utilisateurs avec accès partagé, ou ADMIN.

**Réponse (200) :**
```json
{
  "propertyId": 15,
  "categories": [
    {
      "id": 1,
      "name": "General",
      "features": [
        {
          "id": 3,
          "name": "Number of bedrooms",
          "type": "integer",
          "options": [],
          "currentValue": 4
        },
        {
          "id": 7,
          "name": "Heating type",
          "type": "select",
          "options": [
            { "id": 1, "value": "Gas" },
            { "id": 2, "value": "Electric" },
            { "id": 3, "value": "Heat pump" }
          ],
          "currentValue": { "id": 2, "value": "Electric" }
        },
        {
          "id": 12,
          "name": "Has garden",
          "type": "bool",
          "options": [],
          "currentValue": true
        },
        {
          "id": 18,
          "name": "Notes",
          "type": "text",
          "options": [],
          "currentValue": "Renovated kitchen in 2024"
        }
      ]
    }
  ]
}
```

**Types de feature possibles :**

| `type`     | `currentValue` retourné            |
|------------|------------------------------------|
| `bool`     | `true` / `false` / `null`          |
| `text`     | `string` / `null`                  |
| `integer`  | `number` / `null`                  |
| `float`    | `number` / `null`                  |
| `select`   | `{ id, value }` / `null`           |

---

### 2.2 Sauvegarder les features d'une propriété

```
POST /api/properties/{propertyId}/features
Content-Type: application/json
```

Auth : session NextAuth.  
Accès : propriétaire, ADMIN, ou utilisateur partagé avec `canEdit = true`.

**Body :**
```json
{
  "features": [
    { "featureId": 3, "value": 4 },
    { "featureId": 7, "value": 2 },
    { "featureId": 12, "value": true },
    { "featureId": 18, "value": "Renovated kitchen in 2024" }
  ]
}
```

> Pour un `select`, `value` est l'**id** de l'option choisie (entier).  
> Pour remettre une valeur à vide, passer `"value": null`.

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Property features saved successfully"
}
```

**Erreurs :**

| Code | Message                                                        |
|------|----------------------------------------------------------------|
| 400  | `"Invalid features data"`                                      |
| 401  | `"Unauthorized"`                                               |
| 403  | `"You do not have permission to edit this property"`           |
| 404  | `"Property not found or access denied"`                        |
| 500  | `"Failed to save property features"`                           |

---

## Résumé des routes

| Route                                | Méthode | Auth         | Usage                                       |
|--------------------------------------|---------|--------------|---------------------------------------------|
| `/api/canvassingvisits/web`          | GET     | NextAuth     | Carte — pins + données complètes (web)      |
| `/api/canvassingvisits/stats`        | GET     | NextAuth     | Statistiques détaillées par utilisateur     |
| `/api/admin/visitsbyusers`           | GET     | JWT (ADMIN)  | Dashboard admin — stats agrégées par user   |
| `/api/properties/{id}/features`      | GET     | NextAuth     | Lire les features d'une propriété           |
| `/api/properties/{id}/features`      | POST    | NextAuth     | Sauvegarder les features d'une propriété    |
