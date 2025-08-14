# API Stats - Documentation Complète

## 📊 Vue d'ensemble

L'API `/api/stats` fournit toutes les données nécessaires pour alimenter un dashboard complet avec des métriques d'équipe, de maildrop, d'inventaire et de performance en temps réel.

> **Version**: 1.1  
> **Dernière mise à jour**: 2025-01-14  
> **Status**: Production Ready ✅

## 🔗 Endpoint

```
GET /api/stats
```

### 🔐 Authentification
- **Requis**: Oui (JWT Token)
- **Rôle**: ADMIN uniquement
- **Header**: `Authorization: Bearer <token>`

## 📝 Paramètres de Requête

| Paramètre | Type | Défaut | Description |
|-----------|------|---------|-------------|
| `period` | string | "month" | Période d'analyse: "today", "week", "month", "quarter", "year" |
| `userId` | string | null | ID utilisateur pour filtrer les données (optionnel) |

### 📅 Exemples d'utilisation

```bash
# Toutes les statistiques du mois dernier
GET /api/stats?period=month

# Statistiques d'aujourd'hui pour un utilisateur spécifique
GET /api/stats?period=today&userId=123

# Statistiques de l'année pour toute l'équipe
GET /api/stats?period=year
```

## 📋 Structure de Réponse

### 🎯 Format Global

```json
{
  "success": true,
  "data": {
    "metadata": {
      "period": "month",
      "userId": "all",
      "generatedAt": "2024-01-15T10:30:00.000Z",
      "dateRange": {
        "start": "2023-12-15T10:30:00.000Z",
        "end": "2024-01-15T10:30:00.000Z"
      }
    },
    "team": { /* Données équipe */ },
    "maildrop": { /* Données maildrop */ },
    "inventory": { /* Données inventaire */ },
    "temporal": { /* Données temporelles */ },
    "realTime": { /* Données temps réel */ },
    "system": { /* Métriques système */ }
  }
}
```

## 🎯 1. DONNÉES ÉQUIPE (`team`)

### 👥 Utilisateurs avec Performance (`users`)

```json
{
  "users": [
    {
      "id": "123",
      "name": "Jean Dupont",
      "email": "jean@example.com", 
      "role": "USER",
      "isActive": true,
      "performance": {
        "totalVisits": 45,
        "totalItems": 234,
        "positiveResponses": 23,
        "completedInventories": 12,
        "responseRate": 51.1,
        "performanceScore": 78.5,
        "lastActivity": 1705312200000
      }
    }
  ]
}
```

### 📈 Statistiques d'Équipe (`stats`)

```json
{
  "stats": {
    "totalMembers": 15,
    "activeMembers": 12,
    "newMembers": 3,
    "avgPerformance": 72.3,
    "roleDistribution": {
      "ADMIN": 2,
      "USER": 13
    }
  }
}
```

### 🎬 Activités Utilisateurs (`activities`)

```json
{
  "activities": [
    {
      "type": "CANVASSING_VISIT",
      "count": 156
    },
    {
      "type": "ADD_IMAGE",
      "count": 89
    }
  ]
}
```

## 📬 2. DONNÉES MAILDROP (`maildrop`)

### 🚪 Visites (`visits`)

```json
{
  "visits": [
    {
      "id": "visit_123",
      "latitude": 45.764043,
      "longitude": 4.835659,
      "contactMethod": "DOOR",
      "contactMethod2": "BROCHURE",
      "contactMethod3": null,
      "contactMethod4": null,
      "responseReceived": "positive",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "visitUsers": [
        {
          "userName": "Jean Dupont",
          "user": { "name": "Jean Dupont", "id": 123 }
        }
      ],
      "revisits": [
        {
          "id": "revisit_456",
          "createdAt": "2024-01-20T14:15:00.000Z",
          "responseReceived": "positive"
        }
      ]
    }
  ]
}
```

### 📊 Statistiques Maildrop (`stats`)

```json
{
  "stats": {
    "totalDrops": 312,
    "positiveResponses": 89,
    "negativeResponses": 156,
    "noResponses": 45,
    "pendingResponses": 22,
    "responseRate": 28.5
  }
}
```

### 📋 Distribution des Réponses (`responses`)

```json
{
  "responses": [
    { "type": "positive", "count": 89, "percentage": 0 },
    { "type": "negative", "count": 156, "percentage": 0 },
    { "type": "no_response", "count": 45, "percentage": 0 },
    { "type": "pending", "count": 22, "percentage": 0 }
  ]
}
```

### 📞 Performance par Méthode de Contact (`contactMethods`)

```json
{
  "contactMethods": [
    {
      "method": "DOOR",
      "totalVisits": 187,
      "positiveResponses": 45,
      "responseRate": 24.1
    },
    {
      "method": "BROCHURE",
      "totalVisits": 312,
      "positiveResponses": 67,
      "responseRate": 21.5
    }
  ]
}
```

### 🕐 Distribution par Heure (`visitHours`)

```json
{
  "visitHours": [
    {
      "hour": 9,
      "totalVisits": 23,
      "totalRevisits": 5,
      "total": 28
    },
    {
      "hour": 10,
      "totalVisits": 34,
      "totalRevisits": 8,
      "total": 42
    }
  ]
}
```

## 📦 3. DONNÉES INVENTAIRE (`inventory`)

### 📈 Statistiques (`stats`)

```json
{
  "stats": {
    "totalItems": 1247,
    "totalLocations": 89,
    "totalCategories": 12,
    "categoryDistribution": {
      "Living Room": 450,
      "Kitchen": 380,
      "Bedroom": 287,
      "Bathroom": 130
    }
  }
}
```

### 🎬 Activité (`activity`)

```json
{
  "activity": [
    {
      "id": 456,
      "activityType": "ADD_IMAGE",
      "entityId": "room_123",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "user": {
        "name": "Marie Martin",
        "id": 789
      }
    }
  ]
}
```

### 🔄 Statut de Synchronisation (`sync`)

```json
{
  "sync": {
    "syncedItems": 1180,
    "pendingItems": 67,
    "failedItems": 3,
    "lastSyncTime": "2024-01-15T09:45:00.000Z",
    "isOnline": true
  }
}
```

## 📊 4. DONNÉES TEMPORELLES (`temporal`)

### 📅 Métriques Quotidiennes (`daily`)

```json
{
  "daily": [
    {
      "date": "2024-01-01",
      "visits": 23,
      "items": 45,
      "responses": 12,
      "performance": 52.2
    },
    {
      "date": "2024-01-02", 
      "visits": 34,
      "items": 67,
      "responses": 18,
      "performance": 52.9
    }
  ]
}
```

### 📈 Tendances (`trends`)

```json
{
  "trends": {
    "visitsTrend": 12.5,
    "itemsTrend": -3.2,
    "performanceTrend": 8.7
  }
}
```

## 🎮 5. DONNÉES TEMPS RÉEL (`realTime`)

### 🎬 Activités Récentes (`activities`)

```json
{
  "activities": [
    {
      "id": "789",
      "userId": "123",
      "userName": "Jean Dupont",
      "actionType": "CANVASSING_VISIT",
      "description": "A effectué une visite de démarchage",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "metadata": {
        "entityId": "visit_456",
        "entityType": "CANVASSING_VISIT",
        "details": null
      }
    }
  ]
}
```

### 🟢 Statistiques en Direct

```json
{
  "onlineUsers": 5,
  "todayStats": {
    "onlineUsers": 5,
    "todayVisits": 23,
    "todayItems": 67,
    "activeUserIds": ["123", "456", "789"]
  }
}
```

## 🗄️ 6. MÉTRIQUES SYSTÈME (`system`)

```json
{
  "system": [
    {
      "id": 1,
      "date": "2024-01-15T00:00:00.000Z",
      "totalUsers": 15,
      "loggedInUsers": 12,
      "contributingUsers": 8,
      "totalProperties": 89,
      "newProperties": 3,
      "completedInventories": 45,
      "avgCompletionTime": 3600,
      "storageUsed": 2.5,
      "aiRecognitionRate": 0.85,
      "totalImageCount": 1247,
      "newImageCount": 23,
      "totalCanvassingVisits": 456,
      "newCanvassingVisits": 12,
      "positiveResponses": 89,
      "negativeResponses": 156,
      "pendingResponses": 22
    }
  ]
}
```

## 🔧 Calculs et Métriques

### 📊 Score de Performance

```typescript
performanceScore = (responseRate * 0.7 + activityScore * 0.3) * 100

où:
- responseRate = positiveResponses / totalVisits
- activityScore = min((visits + items) / 100, 1)
```

### 🎯 Types d'Activités Inventaire

L'API filtre automatiquement les activités liées à l'inventaire :
- `ActivityType.ADD_IMAGE` - Ajout d'image
- `ActivityType.EDIT_IMAGE` - Modification d'image  
- `ActivityType.DELETE_IMAGE` - Suppression d'image
- `ActivityType.ADD_ROOM` - Ajout de pièce
- `ActivityType.COMPLETE_INVENTORY` - Inventaire terminé

### 📈 Taux de Réponse

```typescript
responseRate = (positiveResponses / totalVisits) * 100
```

### 🕐 Utilisateurs En Ligne

Considéré comme "en ligne" si activité dans les 15 dernières minutes.

## ⚡ Performance & Optimisations

### 🚀 Requêtes Parallèles
- Toutes les métriques sont calculées en parallèle avec `Promise.all()`
- Optimisation des requêtes Prisma avec des `select` spécifiques
- Index de base de données sur les champs fréquemment filtrés

### 💾 Caching Recommandé
```typescript
// Exemple d'implémentation côté client
const cacheKey = `stats_${period}_${userId}_${Math.floor(Date.now() / (5 * 60 * 1000))}`;
// Cache de 5 minutes
```

## 🚨 Gestion d'Erreurs

### Codes de Retour

| Code | Description |
|------|-------------|
| 200 | Succès |
| 401 | Non authentifié |
| 403 | Accès refusé (non-admin) |
| 500 | Erreur serveur |

### Format d'Erreur

```json
{
  "success": false,
  "error": "Unauthorized access. Admin privileges required."
}
```

### 🔍 Corrections Apportées

**v1.1 - 2025-01-14**
- ✅ Correction des types TypeScript pour `ActivityType`
- ✅ Utilisation des énums Prisma au lieu de chaînes littérales
- ✅ Amélioration de la sécurité des types

## 📚 Exemples d'Utilisation

### JavaScript/TypeScript

```typescript
async function fetchDashboardStats(period: string = 'month', userId?: string) {
  const params = new URLSearchParams({ period });
  if (userId) params.append('userId', userId);
  
  const response = await fetch(`/api/stats?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  
  return await response.json();
}

// Utilisation
const stats = await fetchDashboardStats('week', '123');
console.log(stats.data.team.stats.avgPerformance);
```

### React Hook

```typescript
import { useState, useEffect } from 'react';

function useDashboardStats(period: string, userId?: string) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchDashboardStats(period, userId)
      .then(setStats)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [period, userId]);
  
  return { stats, loading, error };
}
```

## 🔄 Mise à Jour et Maintenance

### Fréquence de Mise à Jour Recommandée
- **Temps réel**: 30 secondes - 1 minute
- **Données quotidiennes**: 15 minutes  
- **Métriques historiques**: 1 heure

### Surveillance
- Temps de réponse API
- Taille des données retournées
- Erreurs et timeouts

---

## 📋 Changelog

### v1.1 (2025-01-14)
- 🔧 **Fix**: Correction types TypeScript `ActivityType` 
- 🔧 **Fix**: Utilisation des énums Prisma natifs
- ✨ **Feature**: Documentation des heures de visite/revisit
- 📚 **Docs**: Ajout section corrections et types d'activités

### v1.0 (2025-01-14)  
- 🎉 **Release**: Version initiale de l'API Stats
- ✨ **Feature**: Toutes les métriques dashboard en une requête
- ✨ **Feature**: Filtrage par période et utilisateur
- ✨ **Feature**: Authentification admin requise

---

*Documentation générée automatiquement pour l'API Stats v1.1*