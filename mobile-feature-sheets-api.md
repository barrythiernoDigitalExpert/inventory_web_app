# Mobile API — Feature Sheets

Integration guide for the **Flutter / mobile** team.

**Version:** July 2026  
**Base URL (prod):** `https://inventory-web-app-xi.vercel.app/api`  
**Auth:** `Authorization: Bearer <mobile_jwt>`

---

## Table of contents

1. [Overview](#1-overview)
2. [Breaking change](#2-breaking-change)
3. [Authentication](#3-authentication)
4. [Data model](#4-data-model)
5. [Routes summary](#5-routes-summary)
6. [List feature sheets](#6-list-feature-sheets)
7. [Create a feature sheet](#7-create-a-feature-sheet)
8. [Get one feature sheet](#8-get-one-feature-sheet)
9. [Partial update (PATCH)](#9-partial-update-patch)
10. [Full replace (PUT)](#10-full-replace-put)
11. [Delete a feature sheet](#11-delete-a-feature-sheet)
12. [Error responses](#12-error-responses)
13. [Suggested Dart models](#13-suggested-dart-models)
14. [Mobile integration checklist](#14-mobile-integration-checklist)
15. [cURL examples](#15-curl-examples)

---

## 1. Overview

A **Feature Sheet** is a named, standalone record that stores a flat map of feature keys → values.

It is **not** linked to a Property / Location / inventory.

| Concept | Description |
|---------|-------------|
| **Name** | Editable label, e.g. `"Villa T4 Faro"` |
| **Values** | Flat JSON `{ "bedrooms": 3, "pool": true }` |
| **Owner** | The authenticated mobile user (set automatically on create) |
| **Template** | Field definitions still come from the external Maildrop template API |

Typical mobile flows:

1. Create a sheet with a name + selected feature values
2. Rename the sheet
3. Add / update / remove feature values
4. List the user’s sheets
5. Delete a sheet

---

## 2. Breaking change

### Removed

```http
GET|PUT|PATCH|DELETE /api/mobile/locations/{locationId}/property-features
```

Those routes stored feature values **on a property**. They no longer exist.

### Replacement

```http
GET|POST /api/mobile/feature-sheets
GET|PATCH|PUT|DELETE /api/mobile/feature-sheets/{id}
```

### What to migrate in the app

| Old behavior | New behavior |
|--------------|--------------|
| Features tied to `locationId` / `Property.id` | Features stored in an independent `FeatureSheet` |
| Local SQLite keyed by `locationId` | Prefer local cache keyed by `featureSheet.id` (+ optional local UUID) |
| Sync via `/mobile/locations/.../property-features` | Sync via `/mobile/feature-sheets` |

> The feature **template** (labels, types, options) is unchanged and still comes from the external Webpack/Maildrop template endpoint. Only **value persistence** changed.

---

## 3. Authentication

```http
Authorization: Bearer <jwt>
Accept: application/json
Content-Type: application/json
```

Use the same mobile JWT as other `/api/mobile/...` routes.

### Auth errors

```json
{
  "success": false,
  "error": "Missing or invalid authorization token"
}
```

```json
{
  "success": false,
  "error": "Invalid token"
}
```

Inactive users are rejected by the JWT auth layer (same as other mobile endpoints).

---

## 4. Data model

### Feature sheet object

```json
{
  "id": 12,
  "name": "Villa T4 Faro",
  "values": {
    "bedrooms": 4,
    "bathrooms": 2,
    "pool": true,
    "energyEfficiency": "A_CLASS",
    "other": "Sea view"
  },
  "schemaVersion": 1,
  "userId": 7,
  "createdAt": "2026-07-10T10:00:00.000Z",
  "updatedAt": "2026-07-10T12:30:00.000Z"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | int | Server feature sheet ID |
| `name` | string | Display name (1–255 chars after trim) |
| `values` | object | Flat key → value map (**never** an array) |
| `schemaVersion` | int | Schema version (default `1`) |
| `userId` | int | Owner Maildrop user ID |
| `createdAt` | string ISO | Creation timestamp |
| `updatedAt` | string ISO | Last update timestamp |
| `owner` | object? | Only present for **ADMIN** list/detail responses |

### Access rules

| Role | List / read / write |
|------|---------------------|
| `USER` | Only their own sheets |
| `ADMIN` | All sheets (list includes `owner`) |

Non-owners get `403 Access denied` on update/delete, or `404` on get if not visible.

### `values` conventions

Keys should match the template keys (`topFields[].key` / `sections[].features[].key`), for example:

- `bedrooms`
- `mains-water`
- `energyEfficiency`
- `pool-shape`

Value types:

| Template type | JSON value |
|---------------|------------|
| `bool` | `true` / `false` |
| `number` / `integer` / `float` | `3`, `12.5` |
| `text` | `"..."` |
| `select` | Prefer stable enum key, e.g. `"A_CLASS"` |

The server does **not** validate keys against the template on write. The mobile app should only send keys known from the template.

---

## 5. Routes summary

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/mobile/feature-sheets` | List sheets for current user |
| `POST` | `/api/mobile/feature-sheets` | Create sheet |
| `GET` | `/api/mobile/feature-sheets/{id}` | Get one sheet |
| `PATCH` | `/api/mobile/feature-sheets/{id}` | Partial update (rename / merge / remove keys) |
| `PUT` | `/api/mobile/feature-sheets/{id}` | Full replace (`name` + `values`) |
| `DELETE` | `/api/mobile/feature-sheets/{id}` | Delete sheet |

---

## 6. List feature sheets

```http
GET /api/mobile/feature-sheets?limit=100&offset=0
Authorization: Bearer <jwt>
```

### Query parameters

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | `100` | Max `500` |
| `offset` | `0` | Pagination offset |

### Success — 200

```json
{
  "success": true,
  "data": {
    "sheets": [
      {
        "id": 12,
        "name": "Villa T4 Faro",
        "values": {
          "bedrooms": 4,
          "pool": true
        },
        "schemaVersion": 1,
        "userId": 7,
        "createdAt": "2026-07-10T10:00:00.000Z",
        "updatedAt": "2026-07-10T12:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 100,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

Sorted by `updatedAt` descending.

---

## 7. Create a feature sheet

```http
POST /api/mobile/feature-sheets
Authorization: Bearer <jwt>
Content-Type: application/json
```

### Body

```json
{
  "name": "Villa T4 Faro",
  "values": {
    "bedrooms": 4,
    "bathrooms": 2,
    "pool": true,
    "energyEfficiency": "A_CLASS"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | **yes** | Non-empty string, max 255 chars |
| `values` | no | Flat object; defaults to `{}` |

Owner is set automatically from the JWT user. Do **not** send `ownerEmail` / `userId`.

### Success — 201

```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "Villa T4 Faro",
    "values": {
      "bedrooms": 4,
      "bathrooms": 2,
      "pool": true,
      "energyEfficiency": "A_CLASS"
    },
    "schemaVersion": 1,
    "userId": 7,
    "createdAt": "2026-07-10T10:00:00.000Z",
    "updatedAt": "2026-07-10T10:00:00.000Z"
  }
}
```

### Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "name is required (non-empty string, max 255 chars)" }` |
| `400` | `{ "success": false, "error": "values must be a non-array object" }` |
| `400` | `{ "success": false, "error": "Invalid JSON body" }` |

---

## 8. Get one feature sheet

```http
GET /api/mobile/feature-sheets/12
Authorization: Bearer <jwt>
```

### Success — 200

```json
{
  "success": true,
  "data": {
    "id": 12,
    "name": "Villa T4 Faro",
    "values": {
      "bedrooms": 4,
      "pool": true
    },
    "schemaVersion": 1,
    "userId": 7,
    "createdAt": "2026-07-10T10:00:00.000Z",
    "updatedAt": "2026-07-10T12:30:00.000Z"
  }
}
```

### Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "Invalid id" }` |
| `404` | `{ "success": false, "error": "Feature sheet not found" }` |

---

## 9. Partial update (PATCH)

Use **PATCH** for rename, merge, and key removal.

```http
PATCH /api/mobile/feature-sheets/12
Authorization: Bearer <jwt>
Content-Type: application/json
```

### Body fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | no | Rename the sheet |
| `values` | no | Object of keys to set |
| `mergeValues` | no | If `true`, merge into existing `values`. If omitted/false and `values` is sent, **replace** the whole `values` object |
| `removeKeys` | no | Array of string keys to delete |

At least one of `name`, `values`, or `removeKeys` is required.

### Example A — rename only

```json
{
  "name": "Promo Summer 2026"
}
```

### Example B — merge values (recommended for form edits)

```json
{
  "values": {
    "bedrooms": 5,
    "garage": true
  },
  "mergeValues": true
}
```

### Example C — remove feature keys

```json
{
  "removeKeys": ["pool", "garage"]
}
```

### Example D — rename + merge + remove

```json
{
  "name": "Villa T5 Faro",
  "values": {
    "bedrooms": 5
  },
  "mergeValues": true,
  "removeKeys": ["pool"]
}
```

### Success — 200

Returns the updated sheet.

### Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "Provide name, values, and/or removeKeys" }` |
| `400` | `{ "success": false, "error": "Invalid name" }` |
| `400` | `{ "success": false, "error": "values must be a non-array object" }` |
| `403` | `{ "success": false, "error": "Access denied" }` |
| `404` | `{ "success": false, "error": "Feature sheet not found" }` |

### Recommended mobile usage

| UI action | API call |
|-----------|----------|
| Rename sheet | `PATCH` `{ "name": "..." }` |
| Save form fields | `PATCH` `{ "values": {...}, "mergeValues": true }` |
| Unselect / remove a feature | `PATCH` `{ "removeKeys": ["key"] }` |
| Replace entire values map | `PUT` or `PATCH` without `mergeValues` |

---

## 10. Full replace (PUT)

Replaces **both** `name` and `values`.

```http
PUT /api/mobile/feature-sheets/12
Authorization: Bearer <jwt>
Content-Type: application/json
```

### Body

```json
{
  "name": "Villa T4 Faro",
  "values": {
    "bedrooms": 4,
    "bathrooms": 2
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `name` | **yes** | New name |
| `values` | no | Defaults to `{}`; must be a non-array object |

Any previous keys not present in the new `values` object are removed.

### Success — 200

Returns the updated sheet.

### Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "name is required" }` |
| `403` | `{ "success": false, "error": "Access denied" }` |
| `404` | `{ "success": false, "error": "Feature sheet not found" }` |

---

## 11. Delete a feature sheet

```http
DELETE /api/mobile/feature-sheets/12
Authorization: Bearer <jwt>
```

### Success — 200

```json
{
  "success": true,
  "message": "Feature sheet deleted"
}
```

### Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "Invalid id" }` |
| `403` | `{ "success": false, "error": "Access denied" }` |
| `404` | `{ "success": false, "error": "Feature sheet not found" }` |

---

## 12. Error responses

| HTTP | When |
|------|------|
| `400` | Invalid JSON / id / name / values / empty PATCH |
| `401` | Missing or invalid JWT |
| `403` | Sheet belongs to another user (non-admin) |
| `404` | Sheet not found / not visible |
| `500` | Server error |

Common shape:

```json
{
  "success": false,
  "error": "..."
}
```

---

## 13. Suggested Dart models

```dart
class FeatureSheetResponse {
  final bool success;
  final FeatureSheet? data;
  final String? error;
}

class FeatureSheetListResponse {
  final bool success;
  final FeatureSheetListData? data;
  final String? error;
}

class FeatureSheetListData {
  final List<FeatureSheet> sheets;
  final FeatureSheetPagination pagination;
}

class FeatureSheetPagination {
  final int total;
  final int limit;
  final int offset;
  final bool hasMore;
}

class FeatureSheet {
  final int id;
  final String name;
  final Map<String, dynamic> values;
  final int schemaVersion;
  final int userId;
  final DateTime createdAt;
  final DateTime updatedAt;
}
```

### Local SQLite suggestion

| Column | Type | Notes |
|--------|------|-------|
| `localId` | TEXT PK | Local UUID for offline-first |
| `remoteId` | INT NULL | Server `FeatureSheet.id` after sync |
| `name` | TEXT | |
| `valuesJson` | TEXT | Stringified `Map` |
| `updatedAt` | TEXT | ISO local timestamp |
| `syncStatus` | TEXT | `pending` / `synced` / `conflict` |

---

## 14. Mobile integration checklist

### API

- [ ] Remove all calls to `/api/mobile/locations/{id}/property-features`
- [ ] Create sheets via `POST /api/mobile/feature-sheets`
- [ ] List via `GET /api/mobile/feature-sheets`
- [ ] Edit via `PATCH` with `mergeValues: true`
- [ ] Remove keys via `PATCH` `{ "removeKeys": [...] }`
- [ ] Delete via `DELETE /api/mobile/feature-sheets/{id}`

### UX / data

- [ ] Feature sheets are **independent** from locations/properties
- [ ] Keep using external template API for field definitions/labels
- [ ] Persist server `id` after create for later sync
- [ ] Treat `values` as `Map<String, dynamic>` (never a List)
- [ ] Show `name` as the primary label in lists

### Offline

- [ ] Create locally first, then POST when online
- [ ] On sync success, store `remoteId = data.id`
- [ ] Prefer PATCH merge for incremental field saves to reduce overwrite risk

---

## 15. cURL examples

```bash
BASE="https://inventory-web-app-xi.vercel.app/api"
TOKEN="your_mobile_jwt"

# List
curl -s "$BASE/mobile/feature-sheets" \
  -H "Authorization: Bearer $TOKEN" | jq

# Create
curl -s -X POST "$BASE/mobile/feature-sheets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Villa T4 Faro",
    "values": { "bedrooms": 4, "pool": true }
  }' | jq

# Get one
curl -s "$BASE/mobile/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" | jq

# Rename + merge values
curl -s -X PATCH "$BASE/mobile/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Villa T5 Faro",
    "values": { "bedrooms": 5 },
    "mergeValues": true
  }' | jq

# Remove keys
curl -s -X PATCH "$BASE/mobile/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "removeKeys": ["pool"] }' | jq

# Full replace
curl -s -X PUT "$BASE/mobile/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Villa T4 Faro",
    "values": { "bedrooms": 4, "bathrooms": 2 }
  }' | jq

# Delete
curl -s -X DELETE "$BASE/mobile/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Server reference

| File | Role |
|------|------|
| `src/app/api/mobile/feature-sheets/route.ts` | List + create |
| `src/app/api/mobile/feature-sheets/[id]/route.ts` | Get / patch / put / delete |
| `src/lib/services/featureSheetService.ts` | Business logic |
| `src/lib/utils/auth-jwt.ts` | Mobile JWT verification |

Related admin doc (CRM): [`maildrop-admin-feature-sheets-api.md`](./maildrop-admin-feature-sheets-api.md)

---

*Document for Flutter / mobile integration — Maildrop Feature Sheets API.*
