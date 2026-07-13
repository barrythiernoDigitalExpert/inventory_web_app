# Maildrop Admin API — Feature Sheets

Integration guide for the **CRM / Filament backend** team.

**Version:** July 2026  
**Base URL (prod):** `https://inventory-web-app-xi.vercel.app/api`  
**Auth:** `Authorization: Bearer {MAILDROP_ADMIN_TOKEN}`

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
13. [Integration checklist](#13-integration-checklist)
14. [cURL examples](#14-curl-examples)

---

## 1. Overview

A **Feature Sheet** is a named, standalone record that stores a flat map of feature keys → values.

| Concept | Description |
|---------|-------------|
| **Name** | Human-readable label (editable), e.g. `"Villa T4 Faro"` |
| **Values** | Flat JSON object `{ "bedrooms": 3, "pool": true, ... }` |
| **Owner** | A Maildrop user (linked by email when creating from CRM) |
| **Independence** | **Not** linked to a Property / inventory |

Typical CRM flows:

1. Create a sheet with a name + initial values
2. Rename the sheet
3. Add / update / remove feature values
4. List sheets (all agents or filtered by agent emails)
5. Delete a sheet

---

## 2. Breaking change

Feature values are **no longer stored on properties**.

| Removed | Replacement |
|---------|-------------|
| Property-linked feature values (`property_features_data`, EAV junction) | `FeatureSheet` (`/api/admin/feature-sheets`) |
| Features fields on `GET /api/admin/inventories` (`features`, `structuredFeatures`, `featureSummary`) | Use feature-sheets endpoints instead |

`GET /api/admin/inventories` now returns inventory data **without** feature payloads.

---

## 3. Authentication

```http
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
Accept: application/json
Content-Type: application/json
```

| CRM env var | Description |
|-------------|-------------|
| `MAILDROP_APP_URL` | Base URL, e.g. `https://inventory-web-app-xi.vercel.app` |
| `MAILDROP_ADMIN_TOKEN` | Shared admin Bearer token |

### Auth errors

**401 — invalid / missing token**

```json
{ "message": "Unauthorized" }
```

**500 — token not configured on Maildrop server**

```json
{ "message": "MAILDROP_ADMIN_TOKEN non configuré côté serveur" }
```

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
  "updatedAt": "2026-07-10T12:30:00.000Z",
  "owner": {
    "id": 7,
    "name": "Jean Dupont",
    "email": "jean.dupont@example.com"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | Feature sheet ID (Maildrop) |
| `name` | string | Display name (1–255 chars after trim) |
| `values` | object | Flat key → value map (never an array) |
| `schemaVersion` | number | Schema version (default `1`) |
| `userId` | number | Owner Maildrop user ID |
| `createdAt` | string ISO | Creation timestamp |
| `updatedAt` | string ISO | Last update timestamp |
| `owner` | object | Present on admin responses — `{ id, name, email }` |

### `values` conventions

Keys are free-form strings (usually catalogue / template keys), for example:

- `bedrooms`, `bathrooms`
- `pool`, `mains-water`
- `energyEfficiency`

Supported value types (JSON):

| Type | Example |
|------|---------|
| boolean | `true` / `false` |
| number | `3`, `12.5` |
| string | `"A_CLASS"`, `"Rectangular"` |
| null | allowed if you need to clear a key via replace/merge |

> Maildrop does **not** validate keys against a catalogue on write. The CRM (or mobile) is responsible for using valid keys from the feature template / catalogue.

### Important ID note

- Sheet `id` = Maildrop feature sheet ID
- Owner is resolved by **email** (`ownerEmail`), not CRM user ID
- CRM user IDs and Maildrop user IDs are **not** interchangeable

---

## 5. Routes summary

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/admin/feature-sheets` | List sheets |
| `POST` | `/api/admin/feature-sheets` | Create sheet |
| `GET` | `/api/admin/feature-sheets/{id}` | Get one sheet |
| `PATCH` | `/api/admin/feature-sheets/{id}` | Partial update (rename / merge / remove keys) |
| `PUT` | `/api/admin/feature-sheets/{id}` | Full replace (`name` + `values`) |
| `DELETE` | `/api/admin/feature-sheets/{id}` | Delete sheet |

---

## 6. List feature sheets

```http
GET /api/admin/feature-sheets?scope=all
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
```

### Query parameters

| Param | Required | Default | Description |
|-------|----------|---------|-------------|
| `scope` | one of `scope` **or** `agentsJson` | — | Use `all` for every sheet |
| `agentsJson` | one of `scope` **or** `agentsJson` | — | URL-encoded JSON array of agents; filters by owner email |
| `limit` | no | `500` | Max `500` |
| `offset` | no | `0` | Pagination offset |

#### `agentsJson` format

Same pattern as other Maildrop admin routes. Each agent must include an `email`:

```json
[
  { "email": "jean.dupont@example.com", "name": "Jean Dupont", "crmUserId": 12 }
]
```

Pass it URL-encoded in the query string.

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
        "updatedAt": "2026-07-10T12:30:00.000Z",
        "owner": {
          "id": 7,
          "name": "Jean Dupont",
          "email": "jean.dupont@example.com"
        }
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 500,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### Validation — 422

Returned when neither `scope=all` nor a valid `agentsJson` is provided:

```json
{
  "message": "Paramètre requis : scope=all ou agentsJson"
}
```

---

## 7. Create a feature sheet

```http
POST /api/admin/feature-sheets
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
Content-Type: application/json
```

### Body

```json
{
  "name": "Villa T4 Faro",
  "ownerEmail": "jean.dupont@example.com",
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
| `ownerEmail` | **yes** | Must match an existing Maildrop user email |
| `values` | no | Flat object; defaults to `{}` |

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
    "updatedAt": "2026-07-10T10:00:00.000Z",
    "owner": {
      "id": 7,
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com"
    }
  }
}
```

### Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "name is required" }` |
| `400` | `{ "success": false, "error": "ownerEmail is required" }` |
| `400` | `{ "success": false, "error": "values must be a non-array object" }` |
| `404` | `{ "success": false, "error": "Owner user not found for ownerEmail" }` |

---

## 8. Get one feature sheet

```http
GET /api/admin/feature-sheets/12
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
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
    "updatedAt": "2026-07-10T12:30:00.000Z",
    "owner": {
      "id": 7,
      "name": "Jean Dupont",
      "email": "jean.dupont@example.com"
    }
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

Use **PATCH** to rename, merge values, and/or remove keys without replacing the whole object.

```http
PATCH /api/admin/feature-sheets/12
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
Content-Type: application/json
```

### Body fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | no | Rename the sheet |
| `values` | no | Object of keys to set |
| `mergeValues` | no | If `true`, merge `values` into existing map. If omitted/false and `values` is sent, **replace** the whole `values` object |
| `removeKeys` | no | Array of string keys to delete from `values` |

### Example A — rename only

```json
{
  "name": "Promo Summer 2026"
}
```

### Example B — merge new / updated values (keep other keys)

```json
{
  "values": {
    "bedrooms": 5,
    "garage": true
  },
  "mergeValues": true
}
```

### Example C — remove keys from the list

```json
{
  "removeKeys": ["pool", "garage"]
}
```

### Example D — rename + merge + remove in one call

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

Returns the updated sheet (same shape as GET).

### Recommended CRM usage

| Intent | How |
|--------|-----|
| Rename | `PATCH` with `{ "name": "..." }` |
| Add / edit some values | `PATCH` with `{ "values": {...}, "mergeValues": true }` |
| Remove some features | `PATCH` with `{ "removeKeys": ["key1"] }` |
| Replace entire values map | `PATCH` with `{ "values": {...} }` **without** `mergeValues`, or use `PUT` |

---

## 10. Full replace (PUT)

Replaces **both** `name` and `values` in one shot.

```http
PUT /api/admin/feature-sheets/12
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
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
| `values` | no | Defaults to `{}` if omitted; must be a non-array object |

> Any previous keys **not** present in the new `values` object are removed.

### Success — 200

Returns the updated sheet.

### Errors

| Status | Body |
|--------|------|
| `400` | `{ "success": false, "error": "name is required" }` |
| `400` | `{ "success": false, "error": "values must be a non-array object" }` |
| `404` | `{ "success": false, "error": "Feature sheet not found" }` |

---

## 11. Delete a feature sheet

```http
DELETE /api/admin/feature-sheets/12
Authorization: Bearer {MAILDROP_ADMIN_TOKEN}
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
| `404` | `{ "success": false, "error": "Feature sheet not found" }` |

---

## 12. Error responses

| HTTP | When |
|------|------|
| `400` | Invalid JSON, invalid id, missing/invalid `name` or `values` |
| `401` | Missing / invalid admin token |
| `404` | Sheet not found, or `ownerEmail` does not match a Maildrop user |
| `422` | List without `scope=all` or valid `agentsJson` |
| `500` | Server error / token not configured |

Common shapes:

```json
{ "success": false, "error": "..." }
```

```json
{ "message": "Unauthorized" }
```

---

## 13. Integration checklist

### Must do

- [ ] Call all routes with `Authorization: Bearer {MAILDROP_ADMIN_TOKEN}`
- [ ] Resolve sheet ownership via **email** (`ownerEmail`), not CRM numeric IDs
- [ ] Store Maildrop `featureSheet.id` in CRM if you need deep links / edits
- [ ] Treat `values` as a flat object (never an array)
- [ ] Prefer `PATCH` + `mergeValues: true` for incremental edits
- [ ] Prefer `PATCH` + `removeKeys` to drop features from a sheet
- [ ] Stop reading feature fields from `/api/admin/inventories`

### Suggested CRM UI mapping

| CRM action | API call |
|------------|----------|
| Feature sheets index | `GET /api/admin/feature-sheets?scope=all` |
| Filter by agents | `GET ...?agentsJson=...` |
| Create sheet | `POST /api/admin/feature-sheets` |
| Open sheet detail | `GET /api/admin/feature-sheets/{id}` |
| Rename | `PATCH` `{ "name": "..." }` |
| Edit values | `PATCH` `{ "values": {...}, "mergeValues": true }` |
| Remove feature keys | `PATCH` `{ "removeKeys": [...] }` |
| Replace everything | `PUT` `{ "name": "...", "values": {...} }` |
| Delete | `DELETE /api/admin/feature-sheets/{id}` |

---

## 14. cURL examples

```bash
BASE="https://inventory-web-app-xi.vercel.app/api"
TOKEN="your_MAILDROP_ADMIN_TOKEN"

# List all
curl -s "$BASE/admin/feature-sheets?scope=all" \
  -H "Authorization: Bearer $TOKEN" | jq

# Create
curl -s -X POST "$BASE/admin/feature-sheets" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Villa T4 Faro",
    "ownerEmail": "jean.dupont@example.com",
    "values": { "bedrooms": 4, "pool": true }
  }' | jq

# Get one
curl -s "$BASE/admin/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" | jq

# Rename + merge values
curl -s -X PATCH "$BASE/admin/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Villa T5 Faro",
    "values": { "bedrooms": 5 },
    "mergeValues": true
  }' | jq

# Remove keys
curl -s -X PATCH "$BASE/admin/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "removeKeys": ["pool"] }' | jq

# Full replace
curl -s -X PUT "$BASE/admin/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Villa T4 Faro",
    "values": { "bedrooms": 4, "bathrooms": 2 }
  }' | jq

# Delete
curl -s -X DELETE "$BASE/admin/feature-sheets/12" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## Server reference

| File | Role |
|------|------|
| `src/app/api/admin/feature-sheets/route.ts` | List + create |
| `src/app/api/admin/feature-sheets/[id]/route.ts` | Get / patch / put / delete |
| `src/lib/services/featureSheetService.ts` | Business logic |
| `src/lib/utils/auth-maildrop-admin.ts` | Admin token verification |

---

*Document for CRM Filament / Laravel backend integration — Maildrop Admin Feature Sheets API.*
