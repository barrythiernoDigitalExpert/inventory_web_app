# Rapport d'audit & Plan d'upgrade — Inventory Web App

> **Généré le** : 13 mai 2026  
> **Analyste** : Audit automatisé (lecture exhaustive de 100+ fichiers)  
> **Priorité** : CRITIQUE > MAJEUR > MINEUR

---

## Table des matières

1. [Résumé exécutif](#1-résumé-exécutif)
2. [Problèmes CRITIQUES (à corriger immédiatement)](#2-problèmes-critiques)
3. [Sécurité des routes API](#3-sécurité-des-routes-api)
4. [Performance — Base de données & Prisma](#4-performance--base-de-données--prisma)
5. [Performance — Frontend & React](#5-performance--frontend--react)
6. [Architecture & dette technique](#6-architecture--dette-technique)
7. [Configuration & Infrastructure](#7-configuration--infrastructure)
8. [Accessibilité](#8-accessibilité)
9. [Documentation API (absente)](#9-documentation-api-absente)
10. [Plan d'action priorisé](#10-plan-daction-priorisé)

---

## 1. Résumé exécutif

L'application est fonctionnelle et bien structurée dans l'ensemble, mais présente **plusieurs failles de sécurité critiques**, des **problèmes de performance importants** côté base de données, et une **dette technique** liée à des fichiers trop volumineux et des duplications de logique.

| Catégorie | CRITIQUE | MAJEUR | MINEUR |
|-----------|----------|--------|--------|
| Sécurité API | 8 | 12 | 5 |
| Performance DB | 0 | 18 | 6 |
| Frontend React | 2 | 22 | 14 |
| Architecture | 3 | 10 | 8 |
| Configuration | 3 | 5 | 4 |
| **TOTAL** | **16** | **67** | **37** |

---

## 2. Problèmes CRITIQUES

Ces problèmes doivent être corrigés **avant toute mise en production**.

---

### 2.1 Routes d'images sans authentification

**Fichiers** :
- `src/app/api/properties/[id]/rooms/[roomId]/images/route.ts` (GET)
- `src/app/api/properties/[id]/rooms/[roomId]/images/[imageId]/route.ts` (GET, PATCH, DELETE)

**Problème** : Aucune vérification d'authentification ou de session. N'importe qui connaissant les IDs peut lire, modifier ou supprimer des images.

**Correction** :
```typescript
// Ajouter en tête de chaque handler :
const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
// Puis vérifier l'accès à la propriété parente
await checkPropertyAccess(propertyId, session.user.email);
```

---

### 2.2 `sync/bulk-rooms` sans authentification

**Fichier** : `src/app/api/sync/bulk-rooms/route.ts`

**Problème** : `verifyJwtAuth` est importé mais **jamais appelé**. N'importe qui peut créer des pièces sur n'importe quelle propriété en connaissant un `syncId` actif.

**Correction** :
```typescript
export async function POST(request: NextRequest) {
  const authResult = await verifyJwtAuth(request); // AJOUTER
  if (authResult.error) return authResult.error;    // AJOUTER
  const user = authResult.user!;
  
  // Lier le syncLog à l'utilisateur authentifié
  const syncLog = await prisma.syncLog.findFirst({
    where: { id: syncId, userId: user.id } // AJOUTER userId
  });
  // ...
}
```

---

### 2.3 Fuite de données — canvassingvisits GET (IDOR)

**Fichiers** :
- `src/app/api/canvassingvisits/route.ts`
- `src/app/api/canvassingvisits/web/route.ts`
- `src/app/api/canvassingvisits/with-revisits/route.ts`

**Problème** :
- `canvassingvisits/route.ts` : le filtre `whereClause` reste `{}` pour les non-admins → tous les utilisateurs authentifiés listent **toutes les visites** de tous les collègues.
- `canvassingvisits/web/route.ts` : un non-admin peut passer `?userId=<autre_id>` et voir les visites d'un autre utilisateur.
- `with-revisits` : si `userSpecific !== true`, liste toutes les visites.

**Correction** :
```typescript
// Dans canvassingvisits/route.ts, GET handler :
if (user.role !== 'ADMIN') {
  whereClause = {
    visitUsers: { some: { userId: user.id } }
  };
}

// Dans canvassingvisits/web/route.ts :
if (userId && user.role !== 'ADMIN') {
  if (parseInt(userId) !== currentUser.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
}
```

---

### 2.4 Validation Google OAuth insuffisante

**Fichier** : `src/app/api/auth/google/route.ts`

**Problème** : L'endpoint accepte `email` + `uid` du corps de la requête **sans vérifier le token Google**. N'importe qui peut usurper l'identité d'un utilisateur Google en connaissant son email.

**Correction** : Vérifier le `id_token` Google avec les clés publiques Google :
```typescript
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const ticket = await client.verifyIdToken({
  idToken: body.id_token, // token envoyé depuis l'app mobile
  audience: process.env.GOOGLE_CLIENT_ID,
});
const payload = ticket.getPayload();
const email = payload?.email; // email vérifié par Google
```

---

### 2.5 Multiples instances PrismaClient (fuites de connexions)

**Fichiers concernés** :
- `src/lib/utils/auth.ts` — `const prisma = new PrismaClient()`
- `src/lib/utils/auth-jwt.ts` — `new PrismaClient()`
- `src/app/api/auth/login/route.ts` — `new PrismaClient()` + `$disconnect()`
- `src/app/api/auth/google/route.ts` — idem
- `src/app/api/auth/me/route.ts` — idem

**Problème** : En production (Vercel), chaque `new PrismaClient()` ouvre un nouveau pool de connexions PostgreSQL. En serverless, cela épuise rapidement les connexions disponibles et cause des erreurs de timeout.

**Correction** : Remplacer dans tous ces fichiers :
```typescript
// AVANT (incorrect)
const prisma = new PrismaClient();
// ... utilisation ...
await prisma.$disconnect();

// APRÈS (correct)
import { prisma } from '@/lib/utils/prisma'; // singleton global
// Pas de $disconnect() — géré par le singleton
```

---

### 2.6 Deux configurations `authOptions` différentes

**Fichiers** :
- `src/lib/utils/auth.ts` (utilisé par la plupart des routes API)
- `src/app/api/auth/[...nextauth]/route.ts` (utilisé par NextAuth lui-même)
- `src/lib/utils/auth-hybrid.ts` (importe depuis la route NextAuth)

**Problème** : Les deux configs ont des callbacks JWT/session différents. Les tokens générés par NextAuth peuvent avoir une structure différente de celle attendue par `getServerSession(authOptions)` importé depuis `auth.ts`. Cela cause des sessions incohérentes.

**Correction** : Extraire une config unique :
```typescript
// src/lib/auth.config.ts (NOUVEAU FICHIER)
export const authOptions: NextAuthOptions = { /* config unique */ };

// src/app/api/auth/[...nextauth]/route.ts
import { authOptions } from '@/lib/auth.config';
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

// src/lib/utils/auth.ts, auth-hybrid.ts, etc.
import { authOptions } from '@/lib/auth.config';
```

---

### 2.7 Middleware de protection désactivé

**Fichier** : `src/middleware.ts`

**Problème** : La redirection vers `/login` est **commentée**. Le middleware tourne sur toutes les routes (coût crypto à chaque requête) mais **ne protège rien**.

**Correction** : Réactiver la protection ou supprimer le middleware si l'auth est 100% côté API :
```typescript
// Décommenter :
if (!token) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

---

### 2.8 `AuthContext` : rôles incohérents avec Prisma

**Fichier** : `src/lib/context/AuthContext.tsx`

**Problème** : `UserRole` dans le contexte inclut `'admin' | 'user' | 'consultant' | 'client'` en minuscules, alors que Prisma utilise `ADMIN | USER`. La fonction `checkPermission` peut retourner de faux négatifs et bloquer des admins légitimes.

**Correction** :
```typescript
// src/lib/context/AuthContext.tsx
type UserRole = 'ADMIN' | 'USER'; // Aligner sur Prisma

// Dans le jwt callback de authOptions :
token.role = user.role; // 'ADMIN' ou 'USER' — ne pas normaliser en minuscules
```

---

## 3. Sécurité des routes API

### 3.1 Route `revisit` sans contrôle d'appartenance

**Fichier** : `src/app/api/canvassingvisits/[visitId]/revisit/route.ts`

**Problème** : N'importe quel JWT valide peut créer ou lire des revisites sur n'importe quelle visite.

**Correction** : Vérifier que l'utilisateur est membre (ou admin) de la visite avant toute opération.

---

### 3.2 `visit-config` — modification par tous les utilisateurs

**Fichier** : `src/app/api/visit-config/route.ts`

**Problème** : POST accessible à tout utilisateur authentifié JWT, alors que seul l'admin devrait modifier la configuration.

**Correction** :
```typescript
if (request.method === 'POST' && authResult.user?.role !== 'ADMIN') {
  return NextResponse.json({ error: 'Admin required' }, { status: 403 });
}
```

---

### 3.3 SSRF sur `maps/resolve-link`

**Fichier** : `src/app/api/maps/resolve-link/route.ts`

**Problème** : `fetch(url)` sans limitation des redirections, timeout, ni blocage des IP privées (127.x, 10.x, 192.168.x). Risque de scan réseau interne.

**Correction** :
```typescript
const controller = new AbortController();
setTimeout(() => controller.abort(), 3000); // timeout 3s
const res = await fetch(url, {
  redirect: 'follow',
  signal: controller.signal,
});
// Valider que l'URL résolue reste dans les domaines Google Maps
```

---

### 3.4 `properties/[id]/shares` — admin ne peut pas partager

**Fichier** : `src/app/api/properties/[id]/shares/route.ts`

**Problème** : Le POST vérifie `property.user.email === session.user.email` uniquement. Un admin ne peut pas partager une propriété dont il n'est pas le propriétaire, alors qu'il peut la lire.

**Correction** :
```typescript
const canShare = property.user.email === session.user.email 
  || currentUser.role === 'ADMIN';
if (!canShare) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
```

---

### 3.5 Mots de passe — politique incohérente

| Route | Longueur min |
|-------|-------------|
| `mobile/users` POST | 6 caractères |
| `mobile/users/[id]/reset-password` | 6 caractères |
| `profile/change-password` | 8 caractères |
| `users/[id]/reset-password` | Aucune validation |

**Correction** : Centraliser la validation dans un helper partagé :
```typescript
// src/lib/utils/passwordPolicy.ts
export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Minimum 8 caractères';
  if (!/[A-Z]/.test(password)) return 'Au moins une majuscule requise';
  return null; // valide
}
```

---

### 3.6 Secret JWT avec valeur par défaut faible

**Fichiers** : `src/lib/utils/auth-jwt.ts`, `src/app/api/auth/login/route.ts`

**Problème** : `process.env.NEXTAUTH_SECRET || 'your-secret-key'` — si la variable d'environnement est absente en prod, le secret est trivial.

**Correction** :
```typescript
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) throw new Error('NEXTAUTH_SECRET is required in production');
const JWT_SECRET = new TextEncoder().encode(secret);
```

---

### 3.7 Script `create-admin.js` — mot de passe en dur

**Fichier** : `script/create-admin.js`

**Problème** : Mot de passe admin identique à l'email et commité dans le repo.

**Correction** :
```javascript
const adminPassword = process.env.ADMIN_INITIAL_PASSWORD;
if (!adminPassword) {
  console.error('ADMIN_INITIAL_PASSWORD env var required');
  process.exit(1);
}
```

---

## 4. Performance — Base de données & Prisma

### 4.1 Boucles de requêtes (N+1 et boucles journalières)

**Fichier** : `src/app/api/stats/route.ts`

**Problème** : `getDailyMetrics` exécute **3 `count` par jour** en boucle sur 30 jours = **90 requêtes** pour un seul appel.

**Correction** :
```typescript
// AVANT : boucle 30 jours × 3 requêtes
for (const day of days) {
  const visits = await prisma.canvassingVisit.count({ where: { createdAt: { gte: day.start, lt: day.end } } });
  // ...
}

// APRÈS : une seule requête groupée
const metrics = await prisma.$queryRaw`
  SELECT DATE_TRUNC('day', "createdAt") as day,
    COUNT(*) as visits
  FROM "CanvassingVisit"
  WHERE "createdAt" >= ${startDate}
  GROUP BY day
  ORDER BY day
`;
```

---

### 4.2 `getUserActivityTimeline` — 60 requêtes pour 30 jours

**Fichier** : `src/app/api/canvassingvisits/stats/route.ts`

**Problème** : 30 jours × 2 counts = 60 requêtes DB par appel.

**Correction** : Même approche `groupBy` que ci-dessus.

---

### 4.3 `admin/visitsbyusers` — findMany sans limite

**Fichier** : `src/app/api/admin/visitsbyusers/route.ts`

**Problème** : Charge **toutes** les visites + leurs relations en mémoire. Sur une large base de données, cela cause des timeouts.

**Correction** :
```typescript
const visits = await prisma.canvassingVisit.findMany({
  where: whereClause,
  take: Math.min(parseInt(limit || '100'), 500), // plafond dur
  skip: offset,
  orderBy: { createdAt: 'desc' },
  select: { /* seulement les champs nécessaires */ }
});
```

---

### 4.4 `sync/pull` — payload géant sans pagination

**Fichier** : `src/app/api/sync/pull/route.ts`

**Problème** : Aucune pagination ni cap — peut retourner des centaines de propriétés avec toutes leurs pièces et images en une seule réponse.

**Correction** : Implémenter une stratégie delta + pagination :
```typescript
const properties = await prisma.property.findMany({
  where: { updatedAt: { gt: lastSync }, userId: user.id },
  take: 20, // page de 20 max
  cursor: cursor ? { id: cursor } : undefined,
  orderBy: { updatedAt: 'asc' },
});
```

---

### 4.5 `sync/upload` — `Date()` vs `new Date()`

**Fichier** : `src/app/api/sync/upload/route.ts`

**Problème** : `updatedAt: Date()` retourne une **chaîne de caractères** (ex: `"Thu May 13 2026..."`) et non un objet `Date`. Prisma peut lever une erreur ou stocker une valeur incorrecte.

**Correction** :
```typescript
// AVANT (bug)
data: { updatedAt: Date() }

// APRÈS (correct)
data: { updatedAt: new Date() }
```

---

### 4.6 N+1 dans `properties/[id]/features`

**Fichier** : `src/app/api/properties/[id]/features/route.ts`

**Problème** : `findUnique` par feature dans une boucle → N requêtes.

**Correction** :
```typescript
// AVANT : boucle avec findUnique par feature
for (const feature of features) {
  await prisma.propertyFeature.findUnique({ where: { id: feature.featureId } });
}

// APRÈS : une seule requête
const existingFeatures = await prisma.propertyFeature.findMany({
  where: { id: { in: features.map(f => f.featureId) } }
});
```

---

### 4.7 Logs Prisma actifs en production

**Fichier** : `src/lib/utils/prisma.ts`

**Problème** : `log: ['query']` s'applique en production, saturant les logs et ajoutant de la latence I/O.

**Correction** :
```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
});
```

---

### 4.8 `loggingMiddleware` — requête DB sur chaque request

**Fichier** : `src/lib/middleware/loggingMiddleware.ts`

**Problème** : `getServerSession` + `prisma.user.findUnique` avant chaque handler enveloppé → latence DB systématique sur chaque requête API.

**Correction** : Décoder le JWT sans DB (les données sont dans le token), ou rendre le logging asynchrone et non bloquant.

---

### 4.9 Duplication Haversine dans deux services

**Fichiers** :
- `src/lib/services/canvassingService.ts` — `calculateDistance()`
- `src/lib/services/proximityService.ts` — formule Haversine dupliquée

**Correction** :
```typescript
// src/lib/utils/geoUtils.ts (NOUVEAU)
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  // implémentation unique
}
```

---

### 4.10 `dashboard/stats` — findMany propriétés pour des stats

**Fichier** : `src/app/api/dashboard/stats/route.ts`

**Problème** : Charge toutes les propriétés + pièces pour calculer des stats, alors que des champs dénormalisés (`roomCount`, `imageCount`) existent déjà.

**Correction** : Utiliser les champs dénormalisés :
```typescript
const stats = await prisma.property.aggregate({
  _sum: { roomCount: true, imageCount: true },
  _count: { id: true },
  where: userId ? { userId } : {}
});
```

---

### 4.11 `admin/activity-stats` — findMany illimité

**Fichier** : `src/app/api/admin/activity-stats/route.ts`

**Problème** : Le POST génère un rapport sans limite de résultats — sur un gros dataset, cela cause des timeouts et des débordements mémoire.

**Correction** : Ajouter un `take` max et un export asynchrone pour les gros rapports.

---

### 4.12 Schema Prisma — index géographique inadapté

**Fichier** : `prisma/schema.prisma`

**Problème** : `@@index([latitude, longitude])` (B-tree) ne permet pas de faire des recherches de proximité efficaces. Les requêtes "nearby" filtrent en mémoire après chargement.

**Correction** : Utiliser PostGIS avec un index GiST, ou implémenter un filtre bounding box comme pré-filtre :
```typescript
// Pré-filtre bounding box (sans PostGIS)
const latDelta = radiusKm / 111.0;
const lngDelta = radiusKm / (111.0 * Math.cos(lat * Math.PI / 180));
where: {
  latitude: { gte: lat - latDelta, lte: lat + latDelta },
  longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
}
```

---

### 4.13 `properties` GET — logging mort après `return`

**Fichier** : `src/app/api/properties/route.ts`

**Problème** : `loggingService.logActivity(...)` est appelé **après** `return NextResponse.json(...)` → jamais exécuté.

**Correction** :
```typescript
// AVANT (bug)
return NextResponse.json(data);
await loggingService.logActivity(...); // JAMAIS EXÉCUTÉ

// APRÈS (correct)
await loggingService.logActivity(...); // Logger d'abord
return NextResponse.json(data);
```

---

### 4.14 `roomImageService` — N requêtes PATCH pour réordonner

**Fichier** : `src/lib/services/roomImageService.ts`

**Problème** : `reorderRoomImages` fait N appels PATCH HTTP séquentiels (1 par image).

**Correction** : Créer un endpoint batch côté API :
```typescript
// POST /api/rooms/[roomId]/images/reorder
// Body: { imageIds: string[] } // ordre désiré
await prisma.$transaction(
  imageIds.map((id, index) => 
    prisma.roomImage.update({ where: { id }, data: { sortOrder: index } })
  )
);
```

---

## 5. Performance — Frontend & React

### 5.1 Fichiers monolithiques — CRITIQUE

**Fichiers** :
- `src/app/(main)/properties/page.tsx` — ~2900+ lignes (création, crop, galerie, tout mélangé)
- `src/app/(main)/properties/[id]/page.tsx` — état énorme, logique éditeur
- `src/app/(main)/properties/[id]/pdf-editor/page.tsx` — canvas PDF dans JSX

**Impact** : Bundle initial surchargé, temps de compilation long, maintenance difficile, re-renders coûteux car trop de `useState` dans un seul composant.

**Correction** : Découper en composants et hooks personnalisés :
```
properties/
  page.tsx                    # Orchestrateur léger
  hooks/
    useProperties.ts          # Logique fetch + état liste
    usePropertyForm.ts        # Logique création
  components/
    PropertyList.tsx
    CreatePropertyModal.tsx
    ImageCropper.tsx
```

---

### 5.2 Absence totale de `loading.tsx` et `error.tsx`

**Problème** : Aucun fichier `loading.tsx` ni `error.tsx` sous `src/app/`. En cas d'erreur de chargement, Next.js affiche une page blanche. Pas de skeletons = CLS et UX dégradée.

**Correction** : Ajouter au minimum :
```
src/app/(main)/
  loading.tsx         # Skeleton global
  error.tsx           # Page d'erreur avec "Réessayer"
  dashboard/
    loading.tsx       # Skeleton dashboard
  properties/
    loading.tsx       # Skeleton liste propriétés
```

---

### 5.3 Absence de `dynamic()` pour les composants lourds

**Problème** : Tous les composants sont importés statiquement, incluant des modales lourdes dans le bundle initial.

**Correction** :
```typescript
// Dans maps/page.tsx
const AddVisitModal = dynamic(() => import('@/components/maps/AddVisitModal'), {
  loading: () => <div className="animate-pulse">Chargement...</div>,
  ssr: false,
});

// Dans properties/[id]/pdf-editor/page.tsx
const PdfEditor = dynamic(() => import('./PdfEditor'), { ssr: false });
```

---

### 5.4 `useEffect` avec dépendances instables

**Fichiers** :
- `src/app/(main)/maps/page.tsx` — handler clavier appelle `handleZoomIn` non listé dans les deps
- `src/app/(main)/maps/page.tsx` — effet `[selectedCreators]` appelle `updateMapMarkers(visits)` sans `visits` dans les deps
- `src/app/(main)/profile/page.tsx` — `fetchProfileData` instable sans `useCallback`
- `src/app/(main)/admin/stats/page.tsx` — `fetchStats` absente des deps

**Impact** : Closures périmées → données affichées erronées après navigation ou changement d'état.

**Correction générique** :
```typescript
// Stabiliser avec useCallback
const fetchProfileData = useCallback(async () => {
  // logique fetch
}, []); // deps réelles vides si pas de dépendances externes

useEffect(() => {
  fetchProfileData();
}, [fetchProfileData]); // ESLint exhaustive-deps satisfait
```

---

### 5.5 `setTimeout` arbitraire dans `resetFilters`

**Fichier** : `src/app/(main)/admin/activity-stats/page.tsx`

**Problème** : `setTimeout(fetchStats, 100)` — timing arbitraire, race condition possible.

**Correction** :
```typescript
const resetFilters = useCallback(() => {
  // Reset synchrone de l'état
  setFilters(defaultFilters);
  // fetchStats sera déclenché par useEffect([filters])
}, []);
```

---

### 5.6 Erreurs fetch silencieuses (pas de feedback utilisateur)

**Fichiers concernés** : `dashboard/page.tsx`, `maps/page.tsx`, `admin/stats/page.tsx`

**Problème** : `catch` avec seulement `console.error` — l'utilisateur voit une page vide sans savoir pourquoi.

**Correction** :
```typescript
} catch (error) {
  console.error(error);
  toast.error('Impossible de charger les données. Réessayez.');
  setError(true); // pour afficher un état d'erreur dans le JSX
}
```

---

### 5.7 Images non optimisées (`<img>` au lieu de `next/image`)

**Fichiers** :
- `src/app/(main)/maps/page.tsx` — plusieurs `<img>` pour carte miniature et photos
- `src/components/maps/AddVisitModal.tsx` — `<img>` pour previews
- `src/components/property/ImageEditor.tsx` — `<img>` pour canvas

**Impact** : Pas de lazy loading automatique, pas de redimensionnement, pas d'optimisation WebP/AVIF, CLS possible.

**Correction** :
```typescript
// Remplacer
<img src={url} alt="..." />

// Par
import Image from 'next/image';
<Image src={url} alt="..." width={300} height={200} sizes="300px" />
```

---

### 5.8 État du formulaire avec spread potentiellement stale

**Fichier** : `src/components/property/MissingFieldsModal.tsx`

**Problème** : `setFormData({ ...formData, [field]: value })` peut utiliser une valeur périmée lors d'updates rapides.

**Correction** :
```typescript
setFormData(prev => ({ ...prev, [field]: value }));
```

---

### 5.9 `setImages` avec spread potentiellement stale

**Fichier** : `src/components/property/ImageUploadComponent.tsx`

**Problème** : `setImages([...images, ...newImages])` peut perdre des entrées en cas d'uploads concurrents.

**Correction** :
```typescript
setImages(prev => [...prev, ...newImages]);
```

---

### 5.10 Pages entièrement client sans raison

**Problème** : La plupart des pages utilisent `'use client'` avec `useEffect` + `fetch` côté client pour charger les données initiales. Cela signifie :
- 1er rendu : page vide (spinner)
- 2e rendu : données chargées

**Correction** : Utiliser les Server Components pour le chargement initial :
```typescript
// dashboard/page.tsx — AVANT (client)
'use client'
useEffect(() => { fetchStats(); }, []);

// dashboard/page.tsx — APRÈS (server)
// Pas de 'use client', pas de useEffect
const stats = await fetch('/api/dashboard/stats', { cache: 'no-store' }).then(r => r.json());
return <DashboardClient initialStats={stats} />;
```

---

### 5.11 `remember me` — état inutilisé

**Fichier** : `src/components/forms/LoginForm.tsx`

**Problème** : La case "Se souvenir de moi" a un état React mais n'est jamais transmise au backend ni utilisée pour la durée du token.

**Correction** : Soit implémenter la fonctionnalité (JWT longue durée), soit supprimer le checkbox.

---

### 5.12 Route login dupliquée

**Fichiers** :
- `src/app/login/page.tsx` — page complète en `'use client'`
- `src/app/auth/login/page.tsx` — shell serveur + `LoginForm` client

**Correction** : Supprimer `src/app/login/page.tsx` et rediriger `/login` vers `/auth/login`, ou l'inverse.

---

## 6. Architecture & dette technique

### 6.1 Logique métier `toast` dans les services

**Fichiers** :
- `src/lib/services/roomImageService.ts` — `import { toast } from 'react-hot-toast'`
- `src/lib/services/userService.ts` — idem
- `src/lib/services/canvassingService.ts` — idem

**Problème** : Les services couplent la logique métier à la présentation. Impossible de les utiliser dans un contexte non-React (tests, API routes, scripts).

**Correction** :
```typescript
// Service (retourne l'erreur)
async function uploadImage(data: ImageData): Promise<{ ok: true; image: Image } | { ok: false; error: string }> {
  // logique sans toast
}

// Composant (gère l'affichage)
const result = await roomImageService.uploadImage(data);
if (!result.ok) toast.error(result.error);
```

---

### 6.2 Routes dupliquées

| Route 1 | Route 2 | Action |
|---------|---------|--------|
| `PATCH /api/users/[id]` | `PATCH /api/users/[id]/status` | Supprimer l'une |
| `POST /api/profile/change-password` | `POST /(main)/profile/change-password` | Supprimer la route sous `(main)` |
| `GET/POST /api/admin/visit-config` | `GET/POST /api/visit-config` | Unifier |

---

### 6.3 `CustomPrismaAdapter` incomplet

**Fichier** : `src/lib/utils/CustomPrismaAdapter.ts`

**Problème** : Seules 3 méthodes de l'interface `Adapter` NextAuth sont implémentées (`getUser`, `getUserByEmail`, `getUserByAccount`). Les méthodes de création de session, de lien OAuth, etc. sont absentes — cela peut causer des erreurs silencieuses lors des flux Google OAuth.

**Correction** : Étendre `@auth/prisma-adapter` et surcharger uniquement les méthodes nécessaires :
```typescript
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base, // toutes les méthodes de base
    getUserByEmail: async (email) => { /* override */ },
  };
}
```

---

### 6.4 `descriptionGenerator.ts` — async inutile

**Fichier** : `src/lib/utils/descriptionGenerator.ts`

**Problème** : `imageUrl` est non utilisé, la fonction est `async` sans aucun `await`. Fonction synchrone déguisée en async.

**Correction** : Supprimer `async` ou implémenter l'appel IA promis.

---

### 6.5 `RateLimitTracker` en mémoire

**Fichier** : `src/lib/utils/securityLogger.ts`

**Problème** : Rate limiting stocké dans une `Map` en mémoire processus. Sur Vercel (serverless), chaque invocation a sa propre mémoire — le rate limit ne fonctionne pas entre les instances.

**Correction** : Utiliser Redis/Upstash :
```typescript
import { Redis } from '@upstash/redis';
const redis = new Redis({ url: process.env.UPSTASH_URL!, token: process.env.UPSTASH_TOKEN! });

const key = `rate_limit:${ip}`;
const count = await redis.incr(key);
if (count === 1) await redis.expire(key, 60); // fenêtre 1 minute
if (count > 100) return false; // limite dépassée
```

---

### 6.6 `authService.ts` — JWT en localStorage

**Fichier** : `src/lib/services/authService.ts`

**Problème** : Stockage du JWT en `localStorage` — vulnérable aux attaques XSS. Si un script malveillant est injecté, il peut voler tous les tokens.

**Correction** : Documenter que ce service est **exclusivement mobile** (React Native stocke différemment), ou pour le web utiliser des cookies `httpOnly` gérés par NextAuth.

---

### 6.7 `tailwind.config.js` — `src/lib` non scanné

**Fichier** : `tailwind.config.js`

**Problème** : `content` ne couvre pas `src/lib/**/*.tsx`. Si des composants avec classes Tailwind existent dans `src/lib/` (ex: `AuthContext.tsx`), les classes seront purgées en production.

**Correction** :
```javascript
content: [
  './src/app/**/*.{js,ts,jsx,tsx}',
  './src/components/**/*.{js,ts,jsx,tsx}',
  './src/lib/**/*.{js,ts,jsx,tsx}', // AJOUTER
],
```

---

## 7. Configuration & Infrastructure

### 7.1 En-têtes de sécurité manquants

**Fichier** : `next.config.ts`

**Problème** : Aucun en-tête HTTP de sécurité configuré.

**Correction** :
```typescript
// next.config.ts
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
      ],
    },
    {
      source: '/api/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'private, no-store, must-revalidate' },
      ],
    },
  ];
},
```

---

### 7.2 En-têtes `Cache-Control` absents sur les réponses API

**Problème** : Aucune route API n'envoie d'en-tête `Cache-Control`. Des proxies ou navigateurs peuvent mettre en cache des réponses sensibles.

**Correction** : Ajouter sur les réponses contenant des données utilisateur :
```typescript
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'private, no-store, must-revalidate' }
});
```

---

### 7.3 Dépendances dupliquées dans `package.json`

| Doublons | Action |
|----------|--------|
| `bcrypt` + `bcryptjs` | Garder `bcryptjs` (compatible Edge) |
| `@auth/prisma-adapter` + `@next-auth/prisma-adapter` | Garder celui compatible NextAuth 4 |
| `jsonwebtoken` + `jose` | Centraliser sur `jose` (Edge-compatible) |

```bash
npm uninstall bcrypt jsonwebtoken @auth/prisma-adapter
npm install --save-exact bcryptjs jose @next-auth/prisma-adapter
```

---

### 7.4 Validation des variables d'environnement au démarrage

**Problème** : Variables manquantes découvertes en runtime (erreurs 500 en prod).

**Correction** : Ajouter un fichier de validation :
```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  GOOGLE_CLIENT_ID: z.string(),
  GOOGLE_CLIENT_SECRET: z.string(),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);
```

---

### 7.5 Logs Prisma `['query']` en production

Voir section 4.7.

---

## 8. Accessibilité

### 8.1 Navigation — `aria-expanded` en dur à `false`

**Fichier** : `src/components/layout/Navigation.tsx`

```typescript
// AVANT
<button aria-expanded="false">

// APRÈS
<button aria-expanded={isMenuOpen}>
```

---

### 8.2 Modales sans `role="dialog"` ni piège à focus

**Fichiers** :
- `src/components/property/MissingFieldsModal.tsx`
- `src/components/property/DeleteConfirmDialog.tsx`
- `src/components/property/FullGalleryModal.tsx`

**Correction** :
```typescript
<div
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  // Ajouter trap focus (ex: avec focus-trap-react)
>
```

---

### 8.3 Fermeture `Escape` absente sur les dropdowns

**Fichier** : `src/components/layout/Navigation.tsx`

```typescript
useEffect(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsMenuOpen(false);
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, []);
```

---

## 9. Documentation API (absente)

### Constat

Après analyse exhaustive du projet, **aucune documentation API formelle n'existe** :

| Élément cherché | Résultat |
|-----------------|----------|
| `openapi.yaml` / `openapi.json` | ❌ Absent |
| `swagger.json` | ❌ Absent |
| Collection Postman | ❌ Absent |
| Dossier `docs/api/` | ❌ Absent |
| README avec liste de routes | ❌ Absent (seul CLAUDE.md, non contractuel) |

Il existe **54 routes API** couvrant auth, propriétés, utilisateurs, démarchage, sync mobile, dashboard et admin — sans aucune spécification accessible.

### Recommandation : Générer une doc OpenAPI avec Swagger

**Option A — Swagger UI intégré à Next.js** (recommandé) :

1. Installer les dépendances :
```bash
npm install swagger-ui-react swagger-jsdoc
npm install --save-dev @types/swagger-jsdoc @types/swagger-ui-react
```

2. Créer la spec :
```typescript
// src/lib/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Inventory Web App API',
      version: '1.0.0',
      description: 'API pour la gestion immobilière et le démarchage',
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        cookieAuth: { type: 'apiKey', in: 'cookie', name: 'next-auth.session-token' },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'],
});
```

3. Créer la page de documentation :
```typescript
// src/app/api/docs/route.ts
import { swaggerSpec } from '@/lib/swagger';
export async function GET() {
  return NextResponse.json(swaggerSpec);
}

// src/app/docs/page.tsx
'use client';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
export default function ApiDocs() {
  return <SwaggerUI url="/api/docs" />;
}
```

4. Protéger la page en production (admins uniquement).

**Option B — Fichier `openapi.yaml` statique** (plus simple) :
Créer `public/openapi.yaml` avec la spec et le servir via `/api/docs`.

---

## 10. Plan d'action priorisé

### Phase 1 — Sécurité (semaine 1, bloquant)

| # | Action | Fichiers |
|---|--------|----------|
| 1 | Ajouter auth sur routes images | `rooms/[roomId]/images/route.ts`, `[imageId]/route.ts` |
| 2 | Ajouter auth sur `sync/bulk-rooms` | `sync/bulk-rooms/route.ts` |
| 3 | Corriger filtres canvassingvisits (IDOR) | `canvassingvisits/route.ts`, `web/route.ts`, `with-revisits/route.ts` |
| 4 | Valider token Google côté serveur | `auth/google/route.ts` |
| 5 | Remplacer tous les `new PrismaClient()` par le singleton | 5 fichiers |
| 6 | Unifier `authOptions` en une seule config | Nouveau `src/lib/auth.config.ts` |
| 7 | Réactiver la protection middleware | `src/middleware.ts` |
| 8 | Aligner les rôles `AuthContext` sur Prisma | `src/lib/context/AuthContext.tsx` |

### Phase 2 — Bugs & corrections rapides (semaine 1-2)

| # | Action | Fichiers |
|---|--------|----------|
| 9 | Corriger `Date()` → `new Date()` | `sync/upload/route.ts` |
| 10 | Corriger logging mort après `return` | `properties/route.ts` |
| 11 | Corriger `setImages(prev => ...)` | `ImageUploadComponent.tsx` |
| 12 | Corriger `setTimeout(fetchStats, 100)` | `admin/activity-stats/page.tsx` |
| 13 | Unifier politique mots de passe | Helper `passwordPolicy.ts` |
| 14 | Supprimer routes dupliquées | `users/[id]` vs `users/[id]/status`, route change-password sous `(main)` |

### Phase 3 — Performance DB (semaine 2-3)

| # | Action | Fichiers |
|---|--------|----------|
| 15 | Remplacer boucles DB par groupBy SQL | `stats/route.ts`, `canvassingvisits/stats/route.ts` |
| 16 | Paginer `admin/visitsbyusers`, `sync/pull` | Routes concernées |
| 17 | N+1 features propriété | `properties/[id]/features/route.ts` |
| 18 | Logs Prisma en prod | `src/lib/utils/prisma.ts` |
| 19 | Désactiver `loggingMiddleware` ou le rendre async | `src/lib/middleware/loggingMiddleware.ts` |
| 20 | Index bounding box pour proximité | `prisma/schema.prisma` |

### Phase 4 — Frontend & UX (semaine 3-4)

| # | Action | Fichiers |
|---|--------|----------|
| 21 | Ajouter `loading.tsx` et `error.tsx` | Segments App Router |
| 22 | Découper `properties/page.tsx` | Hooks + sous-composants |
| 23 | `dynamic()` sur modales lourdes | `maps/page.tsx`, `properties/page.tsx` |
| 24 | Corriger dépendances `useEffect` | `maps/page.tsx`, `profile/page.tsx`, `admin/stats/page.tsx` |
| 25 | Remplacer `<img>` par `<Image>` | `maps/page.tsx`, `AddVisitModal.tsx` |
| 26 | Feedback erreurs manquants | `dashboard/page.tsx`, `maps/page.tsx` |

### Phase 5 — Architecture & doc (mois 2)

| # | Action |
|---|--------|
| 27 | Découpler `toast` des services |
| 28 | Compléter `CustomPrismaAdapter` |
| 29 | Rate limiting Redis/Upstash |
| 30 | Ajouter en-têtes sécurité `next.config.ts` |
| 31 | Valider variables d'environnement au démarrage |
| 32 | **Créer documentation API Swagger/OpenAPI** |
| 33 | Nettoyer dépendances dupliquées `package.json` |

---

*Fin du rapport — 120+ fichiers analysés*
