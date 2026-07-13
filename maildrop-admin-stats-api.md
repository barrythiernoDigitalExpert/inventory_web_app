# API Admin Stats Maildrop — `GET /api/admin/stats`

Document de référence pour l’intégration **CRM Filament / backend Laravel** — statistiques **Team Performance** (canvassing, inventaire, tendances, pulse).

**Version :** juin 2026  
**Base URL prod :** `https://inventory-web-app-xi.vercel.app/api`  
**Code serveur :** `src/app/api/admin/stats/route.ts` · `src/app/api/admin/stats/[userId]/route.ts` · `src/lib/services/statsApiService.ts`

---

## Sommaire

1. [Routes](#1-routes)
2. [Authentification](#2-authentification)
3. [Paramètres de requête](#3-paramètres-de-requête)
4. [Périodes temporelles](#4-périodes-temporelles)
5. [Réponses d’erreur](#5-réponses-derreur)
6. [Enveloppe de succès](#6-enveloppe-de-succès)
7. [Arbre JSON complet](#7-arbre-json-complet)
8. [Exemple — toute l’équipe](#8-exemple--toute-léquipe)
9. [Exemple — un membre](#9-exemple--un-membre)
10. [Référence détaillée des champs](#10-référence-détaillée-des-champs)
11. [Différences équipe vs membre](#11-différences-équipe-vs-membre)
12. [Tests cURL](#12-tests-curl)
13. [Limites & notes produit](#13-limites--notes-produit)

---

## 1. Routes

| Méthode | Route | Usage |
|---------|-------|-------|
| `GET` | `/api/admin/stats` | Statistiques **toute l’équipe** (utilisateurs actifs) |
| `GET` | `/api/admin/stats/{userId}` | Statistiques **un membre** (id **Maildrop**, pas id CRM) |

Les deux routes renvoient **exactement la même structure JSON** (`success` + `data`). Seul le **filtre des données** change (voir §11).

### Exemples HTTP

```http
GET /api/admin/stats?period=month
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
Accept: application/json
```

```http
GET /api/admin/stats/12?period=month
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
Accept: application/json
```

> **Important :** `{userId}` dans l’URL est l’**id numérique utilisateur Maildrop** (table `users.id`). L’id utilisateur CRM **ne correspond pas**. Pour lier CRM ↔ Maildrop, utiliser l’**email** ou `GET /api/admin/users`.

> **Équivalent mobile :** `GET /api/stats?period=month` (équipe) et `GET /api/stats?period=month&userId=12` (membre) avec JWT admin app — même payload.

---

## 2. Authentification

| Élément | Valeur |
|---------|--------|
| Header | `Authorization: Bearer {MAILDROP_ADMIN_TOKEN}` |
| Variable serveur | `MAILDROP_ADMIN_TOKEN` (`.env` Maildrop / Vercel) |
| Variable CRM | `MAILDROP_ADMIN_TOKEN` + `MAILDROP_APP_URL` |

### Réponse 401 — token absent ou invalide

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
```

```json
{
  "message": "Unauthorized"
}
```

### Réponse 500 — token non configuré côté serveur

```http
HTTP/1.1 500 Internal Server Error
```

```json
{
  "message": "MAILDROP_ADMIN_TOKEN non configuré côté serveur"
}
```

---

## 3. Paramètres de requête

| Paramètre | Emplacement | Type | Défaut | Description |
|-----------|-------------|------|--------|-------------|
| `period` | Query | string | `month` | Fenêtre temporelle (voir §4) |
| `userId` | Path (`/stats/{userId}`) | int | — | Id utilisateur Maildrop (obligatoire dans l’URL pour la route membre) |

Valeur `period` inconnue → traitée comme `month`.

---

## 4. Périodes temporelles

Les dates exactes de la fenêtre courante sont dans `data.metadata.dateRange`.  
La période de comparaison (trends) est dans `data.metadata.previousDateRange`.

| `period` | Période courante | Comparaison trends |
|----------|------------------|-------------------|
| `all` | Depuis la 1re activité en base → aujourd’hui | `null` (trends = 0) |
| `today` | Aujourd’hui 00:00 → 23:59 | Hier |
| `week` | Lundi → dimanche semaine courante | Semaine précédente |
| `month` | 1er du mois courant → aujourd’hui | Mois précédent complet |
| `last3months` | 3 mois complets avant le mois courant | 3 mois d’avant |
| `quarter` | Trimestre calendaire courant → aujourd’hui | Trimestre précédent |
| `year` | 1er janvier → aujourd’hui | Année précédente |

Le filtre membre (`/stats/{userId}`) s’applique à **toutes** les sections agrégées (visites, trends, benchmarks calculés sur ce membre seul, etc.), sauf exceptions documentées en §13.

---

## 5. Réponses d’erreur

### Route membre — `userId` non numérique

```http
HTTP/1.1 400 Bad Request
```

```json
{
  "success": false,
  "error": "Invalid userId"
}
```

### Route membre — utilisateur inconnu

```http
HTTP/1.1 404 Not Found
```

```json
{
  "success": false,
  "error": "User not found"
}
```

### Erreur serveur (les deux routes)

```http
HTTP/1.1 500 Internal Server Error
```

```json
{
  "success": false,
  "error": "Internal server error while fetching dashboard statistics"
}
```

---

## 6. Enveloppe de succès

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "data": {
    "metadata": { },
    "team": { },
    "maildrop": { },
    "inventory": { },
    "temporal": { },
    "realTime": { },
    "system": [ ]
  }
}
```

---

## 7. Arbre JSON complet

```
data
├── metadata
│   ├── period
│   ├── userId                    ← "all" ou id membre (string)
│   ├── generatedAt
│   ├── dateRange                 ← { start, end } ISO 8601
│   └── previousDateRange         ← { start, end } ou null
├── team
│   ├── users[]                   ← performance + vsTeamAverage
│   ├── stats                     ← effectifs équipe
│   ├── activities[]              ← agrégat UserActivity par type
│   ├── benchmarks                ← moyennes (membres ≥ 1 visite)
│   ├── dormantMembers            ← détail inactivité / sous moyenne
│   ├── membersToFollowUp         ← membres à relancer
│   ├── memberActivity[]          ← assiduité par membre
│   └── activityRegularity        ← { hasData, members[] }
├── maildrop
│   ├── visits[]                  ← visites initiales (détail)
│   ├── stats                     ← agrégats canvassing
│   ├── responses[]               ← distribution par type réponse
│   ├── contactMethods[]          ← perf par méthode contact
│   ├── visitHours[]              ← distribution horaire UTC
│   ├── cityStats[]               ← stats par ville
│   ├── revisitEfficiency         ← efficacité revisits
│   └── geographicCoverage        ← concentration géographique
├── inventory
│   ├── stats                     ← items, propriétés, catégories
│   ├── activity[]                ← 50 dernières activités inventaire
│   └── sync                      ← état sync serveur
├── temporal
│   ├── daily[]                   ← série journalière période
│   └── trends                    ← % vs période précédente
├── realTime
│   ├── activities[]              ← 20 dernières activités app (global)
│   ├── pulse                     ← alias todayStats
│   ├── todayStats                ← pulse du jour
│   └── onlineUsers               ← nombre (dupliqué dans pulse)
└── system[]                      ← métriques SystemMetrics (table BDD)
```

---

## 8. Exemple — toute l’équipe

**Requête :**

```http
GET /api/admin/stats?period=month
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
```

**Réponse 200 (structure complète — valeurs illustratives) :**

```json
{
  "success": true,
  "data": {
    "metadata": {
      "period": "month",
      "userId": "all",
      "generatedAt": "2026-06-12T15:00:00.000Z",
      "dateRange": {
        "start": "2026-06-01T00:00:00.000Z",
        "end": "2026-06-12T23:59:59.999Z"
      },
      "previousDateRange": {
        "start": "2026-05-01T00:00:00.000Z",
        "end": "2026-05-31T23:59:59.999Z"
      }
    },
    "team": {
      "users": [
        {
          "id": "12",
          "name": "Jean Dupont",
          "email": "jean@example.com",
          "role": "USER",
          "isActive": true,
          "performance": {
            "totalVisits": 45,
            "totalItems": 120,
            "positiveResponses": 12,
            "completedInventories": 4,
            "responseRate": 26.7,
            "performanceScore": 68.5,
            "lastActivity": 1717598400000,
            "daysSinceLastActivity": 3,
            "lastActivityLabel": "3 days ago",
            "zeroVisitsInPeriod": false,
            "isDormant": false,
            "needsFollowUp": false,
            "activeDays": 12,
            "daysWithVisits": 11,
            "daysWithRevisits": 3,
            "streakDays": 4,
            "activityRate": 40.0,
            "calendarDaysInPeriod": 30,
            "fieldTime": {
              "totalPins": 53,
              "totalVisits": 45,
              "totalRevisits": 8,
              "activeHoursDistinct": 4,
              "fieldWindowHours": 3.2,
              "fieldWindowMinutes": 192,
              "estimatedFieldHours": 5.3,
              "estimatedFieldMinutes": 318,
              "averageMinutesPerPin": 3.6,
              "estimationMethod": "field_window"
            }
          },
          "vsTeamAverage": {
            "team": {
              "totalVisits": 28.5,
              "responseRate": 22.1,
              "completedInventories": 1.8,
              "fieldWindowHours": 4.2,
              "performanceScore": 55.0,
              "totalItems": 42.0,
              "activeDays": 8.5
            },
            "delta": {
              "totalVisits": 16.5,
              "responseRate": 4.6,
              "completedInventories": 2.2,
              "fieldWindowHours": -1.0,
              "performanceScore": 13.5,
              "totalItems": 78.0,
              "activeDays": 3.5
            },
            "visitsDelta": 16.5,
            "conversionDelta": 4.6,
            "fieldHoursDelta": -1.0,
            "completedInventoriesDelta": 2.2,
            "performanceScoreDelta": 13.5,
            "activeDaysDelta": 3.5
          }
        }
      ],
      "stats": {
        "totalMembers": 10,
        "activeMembers": 8,
        "newMembers": 1,
        "avgPerformance": 62.3,
        "roleDistribution": {
          "ADMIN": 2,
          "USER": 8
        }
      },
      "activities": [
        { "type": "ADD_IMAGE", "count": 142 },
        { "type": "ADD_CANVASSING_VISIT", "count": 980 }
      ],
      "benchmarks": {
        "avgVisitsPerActiveMember": 28.5,
        "avgVisitsPerMember": 28.5,
        "avgConversionRate": 22.1,
        "avgFieldWindowHours": 4.2,
        "avgCompletedInventories": 1.8,
        "avgPerformanceScore": 55.0,
        "avgTotalItems": 42.0,
        "avgActiveDays": 8.5,
        "totalMembers": 8,
        "membersWithVisits": 6
      },
      "dormantMembers": {
        "hasData": true,
        "count": 2,
        "teamAvgVisitsInPeriod": 28.5,
        "zeroVisitsInPeriod": [
          { "userId": "7", "name": "Marie Martin" }
        ],
        "belowTeamAverage": [
          {
            "userId": "9",
            "name": "Paul Durand",
            "totalVisitsInPeriod": 8,
            "teamAvgVisitsInPeriod": 28.5,
            "visitsVsTeamAverage": -20.5
          }
        ],
        "inactiveOver7Days": [
          {
            "userId": "9",
            "name": "Paul Durand",
            "daysSinceLastActivity": 12
          }
        ]
      },
      "membersToFollowUp": {
        "hasData": true,
        "count": 2,
        "teamAvgVisitsInPeriod": 28.5,
        "members": [
          {
            "userId": "7",
            "name": "Marie Martin",
            "reasons": ["zero_visits_in_period"],
            "daysSinceLastActivity": 45,
            "totalVisitsInPeriod": 0,
            "teamAvgVisitsInPeriod": 28.5,
            "visitsVsTeamAverage": -28.5,
            "priority": "high"
          },
          {
            "userId": "9",
            "name": "Paul Durand",
            "reasons": ["below_team_avg_visits"],
            "daysSinceLastActivity": 12,
            "totalVisitsInPeriod": 8,
            "teamAvgVisitsInPeriod": 28.5,
            "visitsVsTeamAverage": -20.5,
            "priority": "medium"
          }
        ]
      },
      "memberActivity": [
        {
          "userId": "12",
          "daysWithVisits": 11,
          "daysWithRevisits": 3,
          "daysWithActivity": 12,
          "activeDays": 12,
          "calendarDaysInPeriod": 30,
          "streakDays": 4,
          "activityRate": 40.0
        }
      ],
      "activityRegularity": {
        "hasData": true,
        "members": [
          {
            "userId": "12",
            "daysWithVisits": 11,
            "daysWithRevisits": 3,
            "daysWithActivity": 12,
            "activeDays": 12,
            "calendarDaysInPeriod": 30,
            "streakDays": 4,
            "activityRate": 40.0
          }
        ]
      }
    },
    "maildrop": {
      "visits": [
        {
          "id": "clx123abc",
          "latitude": 37.0892,
          "longitude": -8.2478,
          "contactMethod": "DOOR",
          "contactMethod2": null,
          "contactMethod3": null,
          "contactMethod4": null,
          "responseReceived": "positive",
          "createdAt": "2026-06-03T10:15:00.000Z",
          "isRevisit": false,
          "originalVisitId": null,
          "city": "Lagos",
          "country": "Portugal"
        }
      ],
      "stats": {
        "totalDrops": 1250,
        "positiveResponses": 320,
        "negativeResponses": 85,
        "noResponses": 780,
        "pendingResponses": 65,
        "responseRate": 25.6,
        "totalRevisits": 142,
        "revisitsByResponseType": {
          "positive": 38,
          "negative": 22,
          "no_response": 72,
          "pending": 10
        }
      },
      "responses": [
        { "type": "positive", "count": 320, "percentage": 0 },
        { "type": "negative", "count": 85, "percentage": 0 },
        { "type": "no_response", "count": 780, "percentage": 0 },
        { "type": "pending", "count": 65, "percentage": 0 }
      ],
      "contactMethods": [
        {
          "method": "DOOR",
          "totalVisits": 890,
          "positiveResponses": 210,
          "responseRate": 23.59550561797753
        },
        {
          "method": "PHONE",
          "totalVisits": 120,
          "positiveResponses": 35,
          "responseRate": 29.166666666666668
        }
      ],
      "visitHours": [
        {
          "hour": 0,
          "totalVisits": 0,
          "totalRevisits": 0,
          "total": 0,
          "responses": {
            "positive": 0,
            "negative": 0,
            "no_response": 0,
            "pending": 0
          }
        },
        {
          "hour": 10,
          "totalVisits": 45,
          "totalRevisits": 8,
          "total": 53,
          "responses": {
            "positive": 12,
            "negative": 3,
            "no_response": 28,
            "pending": 2
          }
        }
      ],
      "cityStats": [
        {
          "city": "Faro",
          "country": "Portugal",
          "totalVisits": 420,
          "positive": 112,
          "negative": 28,
          "noResponse": 260,
          "pending": 20,
          "totalRevisits": 48,
          "responseRate": 26.7
        }
      ],
      "revisitEfficiency": {
        "totalRevisits": 142,
        "revisitSuccessRate": 26.8,
        "revisitNoResponseRate": 50.7,
        "revisitNegativeRate": 15.5,
        "revisitsByResponseType": {
          "positive": 38,
          "negative": 22,
          "no_response": 72,
          "pending": 10
        }
      },
      "geographicCoverage": {
        "hasData": true,
        "cityCount": 6,
        "totalVisitsMapped": 1250,
        "unmappedVisits": 0,
        "topTwoCitiesShare": 82.5,
        "concentrationLevel": "high",
        "topCities": [
          {
            "city": "Faro",
            "country": "Portugal",
            "totalVisits": 420,
            "share": 33.6
          },
          {
            "city": "Lagos",
            "country": "Portugal",
            "totalVisits": 380,
            "share": 30.4
          }
        ]
      }
    },
    "inventory": {
      "stats": {
        "totalItems": 3420,
        "totalLocations": 85,
        "totalCategories": 12,
        "categoryDistribution": {
          "Salon": 420,
          "Cuisine": 380,
          "Chambre": 290
        }
      },
      "activity": [
        {
          "id": 5678,
          "activityType": "ADD_IMAGE",
          "entityId": "9012",
          "timestamp": "2026-06-12T14:30:00.000Z",
          "user": {
            "name": "Jean Dupont",
            "id": 12
          }
        }
      ],
      "sync": {
        "syncedItems": 1200,
        "pendingItems": 45,
        "failedItems": 3,
        "lastSyncTime": "2026-06-12T14:30:00.000Z",
        "isOnline": true
      }
    },
    "temporal": {
      "daily": [
        {
          "date": "2026-06-01",
          "visits": 14,
          "items": 38,
          "responses": 4,
          "performance": 28.57142857142857
        },
        {
          "date": "2026-06-12",
          "visits": 18,
          "items": 42,
          "responses": 5,
          "performance": 27.77777777777778
        }
      ],
      "trends": {
        "visitsTrend": 12.5,
        "itemsTrend": 8.3,
        "performanceTrend": 4.1,
        "locationsTrend": 5.0,
        "categoriesTrend": 2.0,
        "conversionTrend": -2.3,
        "productivityTrend": 8.1,
        "currentProductivity": 14.2,
        "previousProductivity": 13.1
      }
    },
    "realTime": {
      "activities": [
        {
          "id": "1234",
          "userId": "12",
          "userName": "Jean Dupont",
          "actionType": "ADD_IMAGE",
          "description": "Added image to property",
          "timestamp": "2026-06-12T14:22:00.000Z",
          "metadata": {
            "entityId": "56",
            "entityType": "property",
            "details": null
          }
        }
      ],
      "pulse": {
        "onlineUsers": 3,
        "todayVisits": 18,
        "todayItems": 42,
        "activeUserIds": ["12", "15"],
        "membersWithPinToday": 2,
        "totalActiveMembers": 8,
        "membersWithPinTodayRatio": "2/8",
        "periodDailyAverageVisits": 14.2,
        "todayVisitsVsPeriodAverage": 26.8
      },
      "todayStats": {
        "onlineUsers": 3,
        "todayVisits": 18,
        "todayItems": 42,
        "activeUserIds": ["12", "15"],
        "membersWithPinToday": 2,
        "totalActiveMembers": 8,
        "membersWithPinTodayRatio": "2/8",
        "periodDailyAverageVisits": 14.2,
        "todayVisitsVsPeriodAverage": 26.8
      },
      "onlineUsers": 3
    },
    "system": [
      {
        "id": 42,
        "date": "2026-06-12T00:00:00.000Z",
        "totalUsers": 10,
        "loggedInUsers": 4,
        "contributingUsers": 6,
        "totalProperties": 85,
        "newProperties": 2,
        "completedInventories": 12,
        "avgCompletionTime": 3600,
        "storageUsed": 1250.5,
        "aiRecognitionRate": 0.92,
        "totalImageCount": 3420,
        "newImageCount": 42
      }
    ]
  }
}
```

> `maildrop.visits[]` contient **toutes** les visites initiales de la période (peut être volumineux). Les autres tableaux (`visitHours`, `daily`) ont une taille fixe (24 heures / nb jours période).

---

## 9. Exemple — un membre

**Requête :**

```http
GET /api/admin/stats/12?period=month
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
```

**Réponse 200 — extraits clés (même structure, données filtrées) :**

```json
{
  "success": true,
  "data": {
    "metadata": {
      "period": "month",
      "userId": "12",
      "generatedAt": "2026-06-12T15:00:00.000Z",
      "dateRange": {
        "start": "2026-06-01T00:00:00.000Z",
        "end": "2026-06-12T23:59:59.999Z"
      },
      "previousDateRange": {
        "start": "2026-05-01T00:00:00.000Z",
        "end": "2026-05-31T23:59:59.999Z"
      }
    },
    "team": {
      "users": [
        {
          "id": "12",
          "name": "Jean Dupont",
          "email": "jean@example.com",
          "role": "USER",
          "isActive": true,
          "performance": {
            "totalVisits": 45,
            "totalItems": 120,
            "positiveResponses": 12,
            "completedInventories": 4,
            "responseRate": 26.7,
            "performanceScore": 68.5,
            "lastActivity": 1717598400000,
            "daysSinceLastActivity": 3,
            "lastActivityLabel": "3 days ago",
            "zeroVisitsInPeriod": false,
            "isDormant": false,
            "needsFollowUp": false,
            "activeDays": 12,
            "daysWithVisits": 11,
            "daysWithRevisits": 3,
            "streakDays": 4,
            "activityRate": 40.0,
            "calendarDaysInPeriod": 30,
            "fieldTime": {
              "totalPins": 53,
              "totalVisits": 45,
              "totalRevisits": 8,
              "activeHoursDistinct": 4,
              "fieldWindowHours": 3.2,
              "fieldWindowMinutes": 192,
              "estimatedFieldHours": 5.3,
              "estimatedFieldMinutes": 318,
              "averageMinutesPerPin": 3.6,
              "estimationMethod": "field_window"
            }
          },
          "vsTeamAverage": {
            "team": {
              "totalVisits": 45,
              "responseRate": 26.7,
              "completedInventories": 4,
              "fieldWindowHours": 3.2,
              "performanceScore": 68.5,
              "totalItems": 120,
              "activeDays": 12
            },
            "delta": {
              "totalVisits": 0,
              "responseRate": 0,
              "completedInventories": 0,
              "fieldWindowHours": 0,
              "performanceScore": 0,
              "totalItems": 0,
              "activeDays": 0
            },
            "visitsDelta": 0,
            "conversionDelta": 0,
            "fieldHoursDelta": 0,
            "completedInventoriesDelta": 0,
            "performanceScoreDelta": 0,
            "activeDaysDelta": 0
          }
        }
      ],
      "stats": {
        "totalMembers": 10,
        "activeMembers": 8,
        "newMembers": 0,
        "avgPerformance": 68.5,
        "roleDistribution": { "ADMIN": 2, "USER": 8 }
      },
      "benchmarks": {
        "avgVisitsPerActiveMember": 45,
        "avgVisitsPerMember": 45,
        "avgConversionRate": 26.7,
        "avgFieldWindowHours": 3.2,
        "avgCompletedInventories": 4,
        "avgPerformanceScore": 68.5,
        "avgTotalItems": 120,
        "avgActiveDays": 12,
        "totalMembers": 1,
        "membersWithVisits": 1
      },
      "membersToFollowUp": {
        "hasData": false,
        "count": 0,
        "teamAvgVisitsInPeriod": 45,
        "members": []
      },
      "dormantMembers": {
        "hasData": false,
        "count": 0,
        "teamAvgVisitsInPeriod": 45,
        "zeroVisitsInPeriod": [],
        "belowTeamAverage": [],
        "inactiveOver7Days": []
      },
      "memberActivity": [
        {
          "userId": "12",
          "daysWithVisits": 11,
          "daysWithRevisits": 3,
          "daysWithActivity": 12,
          "activeDays": 12,
          "calendarDaysInPeriod": 30,
          "streakDays": 4,
          "activityRate": 40.0
        }
      ],
      "activityRegularity": {
        "hasData": true,
        "members": [
          {
            "userId": "12",
            "daysWithVisits": 11,
            "daysWithRevisits": 3,
            "daysWithActivity": 12,
            "activeDays": 12,
            "calendarDaysInPeriod": 30,
            "streakDays": 4,
            "activityRate": 40.0
          }
        ]
      },
      "activities": [
        { "type": "ADD_IMAGE", "count": 120 }
      ]
    },
    "maildrop": {
      "visits": [ "… uniquement les visites du membre 12 …" ],
      "stats": {
        "totalDrops": 45,
        "positiveResponses": 12,
        "negativeResponses": 5,
        "noResponses": 26,
        "pendingResponses": 2,
        "responseRate": 26.7,
        "totalRevisits": 8,
        "revisitsByResponseType": {
          "positive": 3,
          "negative": 1,
          "no_response": 3,
          "pending": 1
        }
      },
      "responses": [ "… filtré membre …" ],
      "contactMethods": [ "… filtré membre …" ],
      "visitHours": [ "… 24 entrées, filtré membre …" ],
      "cityStats": [ "… filtré membre …" ],
      "revisitEfficiency": { "… filtré membre …" },
      "geographicCoverage": { "… filtré membre …" }
    },
    "inventory": {
      "stats": {
        "totalItems": 120,
        "totalLocations": 4,
        "totalCategories": 8,
        "categoryDistribution": { "Salon": 35, "Cuisine": 28 }
      },
      "activity": [ "… activités inventaire du membre …" ],
      "sync": {
        "syncedItems": 1200,
        "pendingItems": 45,
        "failedItems": 3,
        "lastSyncTime": "2026-06-12T14:30:00.000Z",
        "isOnline": true
      }
    },
    "temporal": {
      "daily": [ "… série journalière membre …" ],
      "trends": {
        "visitsTrend": 15.0,
        "itemsTrend": 10.0,
        "performanceTrend": 2.5,
        "locationsTrend": 0,
        "categoriesTrend": 1.0,
        "conversionTrend": 1.2,
        "productivityTrend": 15.0,
        "currentProductivity": 45,
        "previousProductivity": 39
      }
    },
    "realTime": {
      "activities": [ "… feed global, non filtré par membre …" ],
      "pulse": { "… global plateforme …" },
      "todayStats": { "… idem pulse …" },
      "onlineUsers": 3
    },
    "system": [ "… métriques système globales …" ]
  }
}
```

---

## 10. Référence détaillée des champs

### 10.1 `metadata`

| Champ | Type | Description |
|-------|------|-------------|
| `period` | string | Valeur `period` de la requête |
| `userId` | string | `"all"` (équipe) ou id membre |
| `generatedAt` | string ISO | Horodatage génération réponse |
| `dateRange.start` / `.end` | string ISO | Fenêtre courante |
| `previousDateRange` | object \| null | Fenêtre comparaison ; `null` si `period=all` |

### 10.2 `team.users[]`

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Id Maildrop |
| `name` | string | Nom affiché |
| `email` | string | Email |
| `role` | string | `ADMIN` \| `USER` |
| `isActive` | boolean | Compte actif |
| `performance.totalVisits` | int | Visites canvassing période |
| `performance.totalItems` | int | Images inventaire créées |
| `performance.positiveResponses` | int | Réponses `positive` |
| `performance.completedInventories` | int | Propriétés `COMPLETED` ou `FINALIZED` |
| `performance.responseRate` | float | `positive / totalVisits × 100` |
| `performance.performanceScore` | float | Score 0–100 |
| `performance.lastActivity` | int \| null | Timestamp ms (visites + revisits + app) |
| `performance.daysSinceLastActivity` | int \| null | Jours depuis dernière activité |
| `performance.lastActivityLabel` | string | `"Today"`, `"3 days ago"`, `"Never active"` |
| `performance.zeroVisitsInPeriod` | boolean | 0 visite sur la période |
| `performance.isDormant` | boolean | Inactif > 7 jours (informatif) |
| `performance.needsFollowUp` | boolean | 0 pin OU pins < moyenne équipe active |
| `performance.activeDays` | int | Jours distincts avec ≥ 1 pin ou revisit |
| `performance.fieldTime` | object | Estimation heures terrain (voir ci-dessous) |
| `vsTeamAverage.team` | object | Moyennes équipe (= `benchmarks` en vue équipe) |
| `vsTeamAverage.delta` | object | Écart membre − moyenne |
| `vsTeamAverage.*Delta` | float | Alias plats de `delta.*` |

**`fieldTime` :**

| Champ | Description |
|-------|-------------|
| `totalPins` | Visites + revisits |
| `fieldWindowHours` | Fenêtre min–max timestamps/jour (plafond 12 h/j) |
| `estimatedFieldHours` | `totalPins × 6 min` |
| `estimationMethod` | `field_window` \| `fixed_estimate` \| `none` |

### 10.3 `team.benchmarks`

Moyennes sur membres avec **≥ 1 visite** sur la période.

| Champ | Description |
|-------|-------------|
| `avgVisitsPerActiveMember` | Moyenne pins membres actifs |
| `avgConversionRate` | Taux conversion moyen |
| `avgFieldWindowHours` | Heures terrain moyennes |
| `avgCompletedInventories` | Inventaires finalisés moyens |
| `avgPerformanceScore` | Score performance moyen |
| `avgTotalItems` | Items inventaire moyens |
| `avgActiveDays` | Jours actifs moyens |
| `totalMembers` | Membres dans le calcul |
| `membersWithVisits` | Membres avec ≥ 1 visite |

### 10.4 `team.membersToFollowUp`

**Règle :** relancer si `totalVisits === 0` **OU** `totalVisits < avgVisitsPerActiveMember`.

| Champ | Description |
|-------|-------------|
| `reasons[]` | `zero_visits_in_period` \| `below_team_avg_visits` |
| `priority` | `high` (0 pin) \| `medium` (sous moyenne) |
| `visitsVsTeamAverage` | `totalVisitsInPeriod - teamAvgVisitsInPeriod` |

### 10.5 `team.dormantMembers`

| Sous-liste | Description |
|------------|-------------|
| `zeroVisitsInPeriod` | Membres sans pin période |
| `belowTeamAverage` | Pins > 0 mais < moyenne |
| `inactiveOver7Days` | Inactifs > 7 jours (informatif) |

### 10.6 `maildrop.stats`

| Champ | Description |
|-------|-------------|
| `totalDrops` | Visites **initiales** uniquement |
| `totalRevisits` | Table `revisits` |
| `revisitsByResponseType` | Répartition revisits |
| `responseRate` | Arrondi 1 décimale |

**Types de réponse :** `positive`, `negative`, `no_response`, `pending`.

**Méthodes de contact :** `DOOR`, `PHONE`, `EMAIL`, `LETTER`, `SMS`, `BROCHURE`, `VALUATION_CARD`.

### 10.7 `maildrop.geographicCoverage`

| `concentrationLevel` | Condition |
|----------------------|-----------|
| `high` | `topTwoCitiesShare` ≥ 80 % |
| `medium` | ≥ 50 % |
| `low` | < 50 % |

Résolution ville : `city` → `streetAddress` → `neighborhood` → GPS → `"Unknown"`.

### 10.8 `maildrop.visitHours[]`

24 entrées (`hour` 0–23). Heures en **UTC**. Champ `responses` = répartition par type sur cette heure.

### 10.9 `inventory.stats`

| Champ | Description |
|-------|-------------|
| `totalItems` | Images `roomImage` créées période |
| `totalLocations` | Propriétés |
| `categoryDistribution` | Nb **items** par nom de pièce |

### 10.10 `inventory.sync`

État **global serveur** (non filtré par membre).

### 10.11 `temporal.trends`

Variation en **%** vs `previousDateRange`. Si `period=all` → tous à `0`.

| Champ | Usage UI |
|-------|----------|
| `conversionTrend` | Efficacité conversion |
| `productivityTrend` | Productivité (`totalDrops / membres ≥ 1 pin`) |
| `visitsTrend` | Volume visites |
| `currentProductivity` / `previousProductivity` | Valeurs absolues productivité |

Formule trend :

```
previous == 0 → (current > 0 ? 100.0 : 0.0)
sinon → ((current - previous) / previous) × 100
```

### 10.12 `realTime.pulse` (= `todayStats`)

| Champ | Description |
|-------|-------------|
| `todayVisits` | Pins canvassing aujourd’hui |
| `todayItems` | Images inventaire aujourd’hui |
| `activeUserIds` | Membres avec ≥ 1 pin aujourd’hui |
| `membersWithPinTodayRatio` | Ex. `"2/8"` |
| `periodDailyAverageVisits` | Moyenne journalière sur la période demandée |
| `todayVisitsVsPeriodAverage` | % vs cette moyenne |
| `onlineUsers` | Activité app < 15 min |

### 10.13 `realTime.activities[]`

| Champ | Description |
|-------|-------------|
| `actionType` | Type `ActivityType` Prisma |
| `description` | Libellé généré serveur |
| `metadata.entityId` | Id entité liée |
| `metadata.entityType` | Type entité |

### 10.14 `system[]`

Enregistrements table `SystemMetrics` sur la période (champs Prisma : `totalUsers`, `loggedInUsers`, `contributingUsers`, `totalProperties`, `newProperties`, `completedInventories`, `avgCompletionTime`, `storageUsed`, `aiRecognitionRate`, `totalImageCount`, `newImageCount`, + métriques canvassing si présentes en BDD).

---

## 11. Différences équipe vs membre

| Section | `/api/admin/stats` | `/api/admin/stats/{userId}` |
|---------|-------------------|----------------------------|
| `metadata.userId` | `"all"` | id membre (string) |
| `team.users[]` | Tous utilisateurs **actifs** | **1 seul** utilisateur |
| `team.benchmarks` | Moyenne des actifs équipe | Moyennes = stats du membre seul |
| `team.membersToFollowUp` | Liste équipe | Souvent vide si membre OK |
| `maildrop.*` | Toute l’équipe | Filtré membre |
| `inventory.stats` / `activity` | Global ou filtré selon agrégats | Filtré membre |
| `temporal.daily` / `trends` | Équipe | Membre |
| `realTime.pulse` | **Global** plateforme | **Global** (non filtré) |
| `realTime.activities` | **Global** | **Global** |
| `inventory.sync` | **Global** serveur | **Global** |
| `system[]` | Global | Global |
| `team.stats.totalMembers` | Effectif BDD | Inchangé (stats globales users) |

---

## 12. Tests cURL

```bash
BASE="https://inventory-web-app-xi.vercel.app/api"
TOKEN="votre_MAILDROP_ADMIN_TOKEN"

# Stats équipe — mois courant
curl -s "$BASE/admin/stats?period=month" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" | jq '.success, .data.metadata'

# Stats membre Maildrop id 12
curl -s "$BASE/admin/stats/12?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.team.users[0].performance'

# Members to follow up (vue équipe)
curl -s "$BASE/admin/stats?period=month" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.team.membersToFollowUp'

# Période all — pas de comparaison trends
curl -s "$BASE/admin/stats?period=all" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.metadata.previousDateRange, .data.temporal.trends'

# Erreur 404 — user inconnu
curl -s -w "\nHTTP %{http_code}\n" "$BASE/admin/stats/999999?period=month" \
  -H "Authorization: Bearer $TOKEN"

# Erreur 401 — token invalide
curl -s -w "\nHTTP %{http_code}\n" "$BASE/admin/stats?period=month" \
  -H "Authorization: Bearer invalid"
```

---

## 13. Limites & notes produit

1. **Pas de scope CRM** (`scope`, `agentsJson`, emails) sur ces routes — stats **plateforme entière**. Pour filtrer par agence/agents CRM, voir `/api/admin/canvassingvisits` (scope) ; extension stats CRM possible ultérieurement.
2. **Id membre** = id Maildrop uniquement ; mapper via email depuis le CRM.
3. **Heures terrain** = estimations (fenêtre timestamps + 6 min/pin), pas temps GPS mesuré.
4. **`visitHours`** = heure UTC du pin, pas durée de travail.
5. **`realTime`** et **`inventory.sync`** restent **globaux** même en vue membre.
6. **`maildrop.visits[]`** peut être très volumineux — paginer côté CRM si besoin (pas de pagination serveur actuellement).
7. **`responses[].percentage`** = `0` côté serveur — calculer en client : `count / totalDrops × 100`.
8. Convention JSON **camelCase** ; exception clés `no_response` dans les maps de réponses.

---

## Référence code

| Fichier | Rôle |
|---------|------|
| `src/app/api/admin/stats/route.ts` | Route équipe |
| `src/app/api/admin/stats/[userId]/route.ts` | Route membre + validation 404 |
| `src/lib/services/statsApiService.ts` | Assemblage payload `getStatsPayload()` |
| `src/lib/services/teamStatsService.ts` | Périodes, trends, benchmarks, follow-up |
| `src/lib/utils/auth-maildrop-admin.ts` | Vérification Bearer token |

Document complémentaire mobile (même payload) : [`api-stats-mobile-integration.md`](./api-stats-mobile-integration.md).
