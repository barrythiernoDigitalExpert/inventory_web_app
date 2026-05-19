# Système de rétention des pins — Documentation technique

## Vue d'ensemble

Quand un compte utilisateur est **désactivé** (`isActive = false`), ses pins (CanvassingVisit) restent visibles pendant un nombre de jours configurable, puis sont automatiquement supprimés chaque nuit via un Cron Job Vercel.

---

## Changements de base de données

### 1. Champ `deactivatedAt` sur le modèle `User`

```prisma
isActive      Boolean   @default(true)  @map("is_active")
deactivatedAt DateTime? @map("deactivated_at")   // ← NOUVEAU (nullable)
```

- Rempli automatiquement avec `now()` quand `isActive` passe à `false`
- Remis à `null` quand l'utilisateur est réactivé

### 2. Nouveau modèle `SystemConfig`

```prisma
model SystemConfig {
  id        Int      @id @default(autoincrement())
  key       String   @unique
  value     String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt      @map("updated_at")

  @@map("system_configs")
  @@index([key])
}
```

Stocke les paramètres globaux de l'application. Clé utilisée : `"pin_retention_days"` (défaut : `"30"`).

---

## API — Désactivation / Activation (mis à jour)

### Web
```
PATCH /api/users/{userId}/status
```

### Mobile
```
PATCH /api/mobile/users/{userId}/status
Authorization: Bearer <jwt_token>
```

**Body :**
```json
{ "isActive": false }
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "42",
      "name": "Jean Dupont",
      "email": "jean@example.com",
      "role": "USER",
      "isActive": false,
      "deactivatedAt": "2026-03-05T10:30:00.000Z",
      "authType": "LOCAL",
      "createdAt": "2025-01-15T10:30:00.000Z",
      "updatedAt": "2026-03-05T10:30:00.000Z"
    }
  },
  "message": "User deactivated successfully"
}
```

> `deactivatedAt` est `null` quand le compte est actif.

---

## API — Configuration de la rétention

### Web (admin)
```
GET  /api/admin/settings
PATCH /api/admin/settings
```
Auth : session NextAuth, rôle ADMIN requis.

### Mobile (admin)
```
GET  /api/mobile/admin/settings
PATCH /api/mobile/admin/settings
Authorization: Bearer <jwt_token>
```
Auth : JWT, rôle ADMIN requis.

---

### GET — Lire la configuration

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "pinRetentionDays": 30,
    "updatedAt": "2026-03-01T08:00:00.000Z"
  }
}
```

---

### PATCH — Modifier le nombre de jours de rétention

**Body :**
```json
{ "pinRetentionDays": 14 }
```

**Validation :**
- Doit être un entier
- Valeur min : `1`, valeur max : `365`

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "pinRetentionDays": 14,
    "updatedAt": "2026-03-05T11:00:00.000Z"
  },
  "message": "Pin retention period updated to 14 days."
}
```

**Erreurs :**
| Code | Message |
|------|---------|
| 400 | `"pinRetentionDays must be an integer between 1 and 365"` |
| 401 | `"Unauthorized"` |
| 403 | `"Unauthorized access. Admin privileges required."` |
| 500 | `"Internal server error while updating settings"` |

---

## API — Cron Job de nettoyage

```
POST /api/cron/cleanup-pins
Authorization: Bearer <CRON_SECRET>
```

Déclenché automatiquement chaque nuit à **02:00 UTC** par Vercel Cron.
Peut aussi être appelé manuellement (tests, maintenance).

### Logique de suppression

```
1. Lire pin_retention_days depuis SystemConfig (défaut 30)
2. cutoffDate = maintenant - pin_retention_days
3. Trouver les users : isActive=false ET deactivatedAt < cutoffDate
4. Trouver les CanvassingVisit où l'user est isCreator=true
5. Supprimer ces visits (cascade automatique sur les tables enfants)
```

**Tables supprimées en cascade :**
- `CanvassingVisitUser`
- `CanvassingVisitComment`
- `VisitRevisit` (originalVisitId et newVisitId)
- `Revisit`

**Réponse (200) :**
```json
{
  "success": true,
  "message": "Deleted 12 expired pin(s).",
  "expiredUserCount": 3,
  "deletedCount": 12,
  "retentionDays": 30,
  "cutoffDate": "2026-02-03T02:00:00.000Z",
  "durationMs": 245
}
```

---

## Configuration Vercel

### vercel.json (racine du projet)
```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-pins",
      "schedule": "0 2 * * *"
    }
  ]
}
```

### Variable d'environnement requise
Ajouter dans **Vercel > Settings > Environment Variables** :
```
CRON_SECRET=<valeur aléatoire longue>
```

Vercel injecte automatiquement cette valeur comme header `Authorization: Bearer <CRON_SECRET>` lors de l'appel au cron.

---

## Comportements clés

| Situation | Comportement |
|-----------|-------------|
| Compte désactivé | `deactivatedAt` = timestamp actuel, compte de jours commence |
| Compte réactivé | `deactivatedAt` = `null`, pins protégés définitivement |
| Désactivé avant le déploiement | `deactivatedAt = null` → jamais supprimé (sûr par défaut) |
| Visit avec plusieurs créateurs dont un expiré | Visit supprimée (comportement validé) |

---

## Ordre de déploiement

1. Appliquer la migration Prisma (`npx prisma migrate dev`)
2. Déployer les routes de statut mises à jour
3. Déployer les routes `/admin/settings` et `/mobile/admin/settings`
4. Déployer le cron endpoint `/cron/cleanup-pins`
5. Ajouter `CRON_SECRET` dans Vercel + déployer `vercel.json`
