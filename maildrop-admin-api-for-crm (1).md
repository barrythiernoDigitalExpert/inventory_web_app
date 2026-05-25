# API Admin EAV / Maildrop — intégration CRM Filament

Document à destination de l’équipe backend de l’application **EAV App / Maildrop** (Next.js).

Le **CRM Laravel** (Filament) consomme ces routes pour la page **Maildrop Map** dans le menu **EAV App**. Les utilisateurs CRM et Maildrop **n’ont pas les mêmes `user_id`** : la liaison se fait par **`email`** (prioritaire) et **`name`** (affichage / secours).

---

## Contexte

| Système | Rôle |
|---------|------|
| **CRM Laravel** | Admin Filament, rôles `super_admin`, `admin`, `office_manager`, `sales_consultant` |
| **EAV App / Maildrop** | App mobile / web canvassing, base utilisateurs et visites séparée |

Le CRM appelle l’API Maildrop avec un token admin. Il envoie un **scope** + la liste des **agents autorisés** (email, nom, id CRM informatif) pour que Maildrop filtre visites et statistiques **côté serveur**.

> **Inventory** (inventaire des features propriétés) est géré **uniquement dans le CRM** — aucune route Maildrop requise pour cette page.

---

## Authentification

Toutes les routes admin décrites ci-dessous :

```http
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
Accept: application/json
```

| Variable CRM (`.env`) | Description |
|----------------------|-------------|
| `MAILDROP_APP_URL` | Base URL de l’app (ex. `https://inventory-web-app-xi.vercel.app`) |
| `MAILDROP_ADMIN_TOKEN` | JWT / token Bearer pour les routes `/api/admin/...` ou routes existantes protégées |

Réponses d’erreur attendues : JSON avec `message` (ou format d’erreur standard du projet), codes HTTP `401`, `403`, `422`, `500`.

---

## Modèle utilisateur côté Maildrop (prérequis)

Chaque utilisateur / agent dans la base Maildrop devrait exposer au minimum :

| Champ Maildrop | Type | Description |
|----------------|------|-------------|
| `crmEmail` | `string` | Email **identique** au CRM (`users.email`), normalisé en minuscules |
| `crmUserId` | `int` | Optionnel — id utilisateur CRM (informatif, pas clé de jointure) |
| `crmAgencyId` | `int` | Optionnel — id agence CRM (`agencies.id`) |
| `name` | `string` | Nom affiché |

**Règle de matching :** une visite appartient à un agent si `visitUsers[].crmEmail` (ou email de l’utilisateur lié) correspond à un email autorisé dans la requête.

Ne pas se baser sur `userId` numérique envoyé par le CRM — il ne correspond pas à l’id Maildrop.

---

## Paramètres de scope (communs)

Le CRM envoie ces query params sur les routes visites / stats.

### `scope` (obligatoire)

| Valeur | Rôle CRM | Comportement attendu |
|--------|----------|----------------------|
| `all` | `super_admin`, `admin` | Toutes les visites (sous réserve de `userEmail` optionnel) |
| `agency` | `office_manager` | Visites des agents listés dans `agentsJson` / `userEmails`, ou rattachés à `agencyCrmId` |
| `self` | `sales_consultant` | Uniquement les visites de `viewerEmail` |

### Paramètres d’identité

| Paramètre | Type | Présent quand | Description |
|-----------|------|---------------|-------------|
| `viewerEmail` | string | Toujours (si connecté) | Email de l’utilisateur CRM qui consulte la carte |
| `viewerName` | string | Toujours (si connecté) | Nom affiché |
| `agencyCrmId` | int | `scope=agency` | Id agence CRM (`offices.agency_id` du manager) |
| `userEmail` | string | Filtre agent OU `scope=self` | Email d’un agent précis |
| `userEmails` | string | `scope=agency` ou `self` | Emails autorisés, séparés par **virgule** (sans espaces ou trim côté API) |
| `agentsJson` | string (JSON URL-encoded) | `scope=agency` ou `self` | Tableau JSON des agents (voir structure ci-dessous) |

### Structure de `agentsJson`

Tableau JSON encodé en une seule chaîne query param :

```json
[
  {
    "crmUserId": 12,
    "email": "jean.dupont@example.com",
    "name": "Jean Dupont"
  },
  {
    "crmUserId": 34,
    "email": "marie.martin@example.com",
    "name": "Marie Martin"
  }
]
```

- `email` : **obligatoire**, minuscules recommandé  
- `name` : obligatoire pour affichage / matching souple  
- `crmUserId` : optionnel (référence CRM uniquement)

### Filtres temporels (inchangés)

| Paramètre | Type | Description |
|-----------|------|-------------|
| `period` | string | `all`, `today`, `week`, `month`, `custom` |
| `startDate` | date `YYYY-MM-DD` | Si `period=custom` |
| `endDate` | date `YYYY-MM-DD` | Si `period=custom` |

---

## Exemples de requêtes par rôle CRM

### Super admin / admin — toutes les visites

```http
GET /api/canvassingvisits/web?scope=all&forMap=true&limit=500&period=week
Authorization: Bearer ***
```

Avec filtre agent optionnel :

```http
GET /api/canvassingvisits/web?scope=all&userEmail=jean.dupont@example.com&forMap=true&limit=500&period=week
```

`agentsJson` et `userEmails` **non envoyés**.

---

### Office manager — agence

Le CRM envoie tous les agents actifs des bureaux de **son agence** :

```http
GET /api/canvassingvisits/web?scope=agency&agencyCrmId=3&viewerEmail=manager@example.com&viewerName=Paul%20Manager&userEmails=jean.dupont@example.com,marie.martin@example.com&agentsJson=%5B%7B%22crmUserId%22%3A12%2C%22email%22%3A%22jean.dupont%40example.com%22%2C%22name%22%3A%22Jean%20Dupont%22%7D%5D&forMap=true&limit=500&period=month
```

**Logique attendue :** retourner les visites où au moins un `visitUsers[].crmEmail` est dans `userEmails` (ou dans `agentsJson`), et/ou agents liés à `agencyCrmId` si vous stockez `crmAgencyId` côté Maildrop.

---

### Sales consultant — lui seul

```http
GET /api/canvassingvisits/web?scope=self&viewerEmail=jean.dupont@example.com&viewerName=Jean%20Dupont&userEmail=jean.dupont@example.com&userEmails=jean.dupont@example.com&agentsJson=%5B%7B%22crmUserId%22%3A12%2C%22email%22%3A%22jean.dupont%40example.com%22%2C%22name%22%3A%22Jean%20Dupont%22%7D%5D&forMap=true&limit=500&period=week
```

**Logique attendue :** uniquement les visites de `userEmail` / `viewerEmail`.

---

## Routes à mettre à disposition

### 1. Liste des visites (carte + tableau)

**Route actuelle consommée par le CRM :**

```http
GET /api/canvassingvisits/web
```

**Query params :**

| Param | Obligatoire | Description |
|-------|-------------|-------------|
| `scope` | oui | `all` \| `agency` \| `self` |
| `forMap` | oui | `true` |
| `limit` | recommandé | `500` (max pins carte) |
| `period`, `startDate`, `endDate` | selon filtre | Voir ci-dessus |
| `agencyCrmId`, `viewerEmail`, `viewerName`, `userEmail`, `userEmails`, `agentsJson` | selon scope | Voir ci-dessus |

**Réponse 200 — structure attendue :**

```json
{
  "data": {
    "visits": [
      {
        "latitude": 38.7223,
        "longitude": -9.1393,
        "houseName": "Villa Example",
        "streetAddress": "Rua Example 1",
        "neighborhood": "Chiado",
        "city": "Lisbon",
        "contactMethod": "door",
        "responseReceived": "positive",
        "comments": "Interested",
        "createdAt": "2026-05-15T10:30:00.000Z",
        "visitUsers": [
          {
            "crmEmail": "jean.dupont@example.com",
            "userName": "Jean Dupont",
            "maildropUserId": "uuid-or-internal-id"
          }
        ]
      }
    ]
  }
}
```

**Champs critiques pour le CRM :**

| Champ | Usage |
|-------|--------|
| `latitude`, `longitude` | Pins carte Leaflet |
| `responseReceived` | `positive`, `negative`, `pending`, `no_response` (couleur pin) |
| `visitUsers[].crmEmail` | **Obligatoire** pour filtrage / affichage |
| `visitUsers[].userName` | Libellé popup / tableau |
| `createdAt` | Colonne date |

> **Important :** ne pas utiliser uniquement `visitUsers[].userId` numérique CRM. Si présent, le traiter comme id Maildrop interne, pas comme id CRM.

---

### 2. Statistiques période

**Route actuelle consommée par le CRM :**

```http
GET /api/canvassingvisits/stats
```

**Query params :** mêmes paramètres de **scope** et filtres temporels que `/web` (sans `forMap` / `limit`).

**Réponse 200 — structure attendue :**

```json
{
  "periodStats": {
    "totalVisits": 120,
    "positiveResponses": 45,
    "negativeResponses": 30,
    "pendingResponses": 25,
    "responseRate": 37.5
  }
}
```

Les stats doivent être calculées **après** application du même filtre scope / emails que pour les visites.

---

### 3. (Recommandé) Liste des agents Maildrop

Route optionnelle si vous préférez que le CRM ne construise pas la liste depuis sa propre base :

```http
GET /api/admin/agents
```

| Query param | Description |
|-------------|-------------|
| `agencyCrmId` | Filtrer par agence CRM |
| `userEmails` | Intersection avec emails connus |

**Réponse 200 :**

```json
{
  "agents": [
    {
      "crmEmail": "jean.dupont@example.com",
      "name": "Jean Dupont",
      "crmUserId": 12,
      "crmAgencyId": 3,
      "maildropUserId": "internal-uuid"
    }
  ]
}
```

Le CRM peut migrer vers cette route plus tard ; aujourd’hui la liste agents vient du CRM.

---

### 4. (Optionnel) Résolution emails CRM ↔ Maildrop

Utile pour debug / onboarding :

```http
POST /api/admin/users/resolve
Content-Type: application/json

{
  "emails": ["jean.dupont@example.com", "unknown@example.com"]
}
```

**Réponse 200 :**

```json
{
  "results": [
    { "email": "jean.dupont@example.com", "found": true, "maildropUserId": "uuid" },
    { "email": "unknown@example.com", "found": false, "maildropUserId": null }
  ]
}
```

---

### 5. (Optionnel) Sync batch utilisateurs CRM → Maildrop

Pour alimenter `crmEmail` / `crmAgencyId` côté Maildrop (cron ou webhook) :

```http
POST /api/admin/users/sync
Content-Type: application/json

{
  "users": [
    {
      "crmUserId": 12,
      "email": "jean.dupont@example.com",
      "name": "Jean Dupont",
      "crmAgencyId": 3,
      "isActive": true
    }
  ]
}
```

**Réponse 200 :**

```json
{
  "synced": 1,
  "errors": []
}
```

---

## Algorithme de filtrage recommandé (pseudo-code)

```
function filterVisits(visits, params):
    if params.scope == 'all':
        allowedEmails = null  // tous
    else if params.scope == 'self':
        allowedEmails = [normalize(params.viewerEmail)]
    else if params.scope == 'agency':
        allowedEmails = parseEmails(params.userEmails)
        // ou parse params.agentsJson[].email

    if params.userEmail:
        allowedEmails = intersect(allowedEmails, [params.userEmail])

    return visits.filter(visit =>
        visit.visitUsers.some(vu =>
            allowedEmails == null || allowedEmails.includes(normalize(vu.crmEmail))
        )
    )
```

`normalize(email)` = `trim().toLowerCase()`.

---

## Rétrocompatibilité

| Ancien param | Statut |
|--------------|--------|
| `userId` (id numérique CRM) | **Ne plus utiliser** pour le filtrage — non fiable |
| Routes `/api/canvassingvisits/web` et `/stats` | Conserver les URLs ; **étendre** avec `scope`, `agentsJson`, etc. |

Tant que le filtrage serveur n’est pas déployé, le CRM applique un **filtre de secours** par `crmEmail` sur la réponse. Une fois le filtrage Maildrop en place, les deux systèmes seront alignés.

---

## Checklist livraison backend

- [ ] Stocker `crmEmail` (unique, indexé) sur les utilisateurs Maildrop  
- [ ] Exposer `visitUsers[].crmEmail` dans les réponses visites  
- [ ] Implémenter `scope` (`all` / `agency` / `self`) sur `GET .../web` et `GET .../stats`  
- [ ] Parser `agentsJson` et/ou `userEmails` pour `scope=agency`  
- [ ] Forcer filtre `viewerEmail` / `userEmail` pour `scope=self`  
- [ ] Stats `periodStats` cohérentes avec le même filtre que les visites  
- [ ] Documenter `MAILDROP_ADMIN_TOKEN` pour l’équipe CRM  
- [ ] (Optionnel) `GET /api/admin/agents`, `POST .../resolve`, `POST .../sync`

---

## Contact / référence CRM

- Page Filament : **EAV App → Maildrop Map**  
- Fichiers CRM : `app/Filament/Pages/MaildropMapPage.php`, `app/Support/Maildrop/MaildropApiScope.php`, `app/Support/EavApp/EavAppUserScope.php`  
- Variables env : `MAILDROP_APP_URL`, `MAILDROP_ADMIN_TOKEN`

---

*Document généré pour l’intégration WPS-386 / EAV App — mai 2026.*
