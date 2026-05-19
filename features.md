# Property Features — Spécification API pour synchronisation (mobile ↔ serveur)

Document à transmettre à l’équipe **API / backend** pour intégrer la persistance et la synchronisation des **Property Features** (caractéristiques du bien) alignées sur le schéma du template maildrop.

**Contexte mobile actuel**

- Le **template** (liste des champs, sections, types, options) est déjà fourni par une API externe :  
  `GET https://api.webpacksolutions.com/v1/maildrop/features/template`  
  avec l’en-tête `X-Maildrop-Token: <secret>` (géré côté mobile ; **ne pas exposer le secret dans les logs**).
- Les **valeurs saisies** par l’utilisateur sont stockées **localement** dans SQLite, table `property_features`, une ligne par **location** (référence inventaire).

Objectif de ce document : définir les **routes sur votre API inventaire** (ex. `https://inventory-web-app-xi.vercel.app/api` ou équivalent) pour **envoyer** et **récupérer** ces valeurs, et les lier à une **location** côté serveur.

---

## 1. Modèle de données côté mobile (SQLite)

Table : `property_features`

| Colonne        | Type   | Description |
|----------------|--------|-------------|
| `locationId`   | TEXT PK | Identifiant local de la location dans l’app (`locations.id`, UUID côté mobile). |
| `featuresJson` | TEXT   | JSON stringifié : objet plat **clé → valeur** (voir §2). |
| `updatedAt`    | TEXT   | ISO 8601, dernière modification locale des valeurs. |

**Lien avec la location inventaire**

- Sur le mobile, une location a un `id` local et optionnellement un `remoteId` une fois synchronisée avec le serveur.
- Pour la sync API, il est **recommandé** d’utiliser l’**identifiant serveur de la location** (`remoteId` ou équivalent) comme clé métier ; le mobile peut envoyer **les deux** (`locationLocalId` + `locationId` serveur) pendant une phase de transition.

---

## 2. Format du payload `features` (objet plat)

Les clés sont les **`key`** du template (`topFields[].key` et `sections[].features[].key`), par ex. `bedrooms`, `mains-water`, `energyEfficiency`, etc.

Valeurs possibles selon le type du champ dans le template :

| Type template | JSON côté `features` |
|----------------|----------------------|
| `bool`         | `true` / `false` (clé absente = non renseigné / faux selon convention serveur — à trancher et documenter). |
| `number`, `integer`, `float` | nombre JSON (`42`, `12.5`). |
| `text`         | chaîne. |
| `select`       | soit la **valeur affichée** (chaîne), soit la **clé enum** si le select est un map `code → label` (ex. `energyEfficiency` : préférer stocker la **clé** `A_CLASS` côté serveur pour stabilité). |

**Exemple minimal**

```json
{
  "bedrooms": 3,
  "bathrooms": 2,
  "energyEfficiency": "A_CLASS",
  "mains-water": true,
  "pool-shape": "Rectangular",
  "other": "Texte libre pour champ Other"
}
```

**Convention recommandée**

- Stocker un **objet unique** `features` par location, sans duplication des métadonnées du template (labels, types) côté serveur : le template reste la source de vérité pour la structure ; le serveur ne stocke que les **réponses**.

---

## 3. Routes API proposées (inventaire / mobile JWT)

Alignement suggéré avec les routes **mobile** existantes (`Authorization: Bearer <jwt>`), même style de réponse que le reste de l’API (`success`, `data`, `message`, etc.).

### 3.1 Récupérer les features d’une location

`GET /api/mobile/locations/{locationId}/property-features`

- `locationId` : **ID serveur** de la location (recommandé).
- **Réponse 200** — exemple :

```json
{
  "success": true,
  "data": {
    "locationId": "srv-loc-uuid-123",
    "features": {
      "bedrooms": 3,
      "mains-water": true
    },
    "updatedAt": "2026-05-13T14:30:00.000Z",
    "schemaVersion": 1
  }
}
```

- **404** si la location n’existe pas ou n’appartient pas à l’utilisateur / organisation.
- Si aucune donnée : `features: {}` et `updatedAt` null ou date de création vide selon convention.

### 3.2 Créer ou remplacer les features (upsert)

`PUT /api/mobile/locations/{locationId}/property-features`

**Headers** : `Content-Type: application/json`, `Authorization: Bearer <jwt>`

**Body** :

```json
{
  "features": {
    "bedrooms": 4,
    "bathrooms": 2,
    "mains-water": true
  },
  "clientUpdatedAt": "2026-05-13T15:00:00.000Z"
}
```

- `clientUpdatedAt` : horodatage **mobile** au moment de la sauvegarde (pour résolution de conflit, voir §4).
- **Réponse 200** : renvoyer l’enregistrement persisté (même forme que le GET).

**Validation**

- Rejeter les clés inconnues **optionnellement** (mode strict) ou les ignorer (mode permissif) — à décider ; le mobile n’envoie que des clés issues du template.
- Valider les types par rapport au template si le serveur duplique le schéma ; sinon accepter un JSON libre typé.

### 3.3 Mise à jour partielle (optionnelle)

`PATCH /api/mobile/locations/{locationId}/property-features`

**Body** : même principe que PUT mais seules les clés présentes sont fusionnées dans l’objet `features` existant.

Utile pour réduire la taille des requêtes ; le mobile peut commencer par **PUT** uniquement.

### 3.4 Suppression (optionnelle)

`DELETE /api/mobile/locations/{locationId}/property-features`

Remet les features à vide `{}` ou supprime la ligne métier associée.

---

## 4. Stratégie de conflits et sync

Recommandation :

- Stocker côté serveur `updatedAt` (serveur) à chaque écriture.
- Accepter `clientUpdatedAt` du mobile ; en cas de **PUT** alors que `server.updatedAt > clientUpdatedAt` :
  - soit **409 Conflict** avec le corps serveur actuel pour que le mobile fusionne ou affiche un choix ;
  - soit **last-write-wins** (simple mais risque d’écrasement) — à documenter clairement.

Le mobile pourra ensuite :

1. Après succès API, mettre à jour la ligne SQLite `property_features` + aligner `updatedAt` avec la réponse serveur.
2. Marquer la location ou un flag `propertyFeaturesSynced` si vous ajoutez une colonne dédiée (optionnel).

---

## 5. Synchroniser avec « mise à jour d’une location »

Deux approches possibles (à trancher avec l’équipe produit) :

**A. Features isolées (recommandé)**  
Les routes ci-dessus restent indépendantes. La fiche location (`GET/PATCH location`) ne contient **pas** nécessairement tout l’objet `features` (évite les payloads énormes).

**B. Embarquer dans la location**  
Champs optionnels sur la ressource location :

- `propertyFeatures?: { features: Record<string, unknown>, updatedAt: string }`

Le mobile pourrait alors rafraîchir location + features en un seul appel ; coût : taille des réponses.

**Minimum viable pour le mobile**

- Implémenter **GET + PUT** (§3.1 et §3.2) sur l’ID serveur de la location.
- Le mobile enverra les données après lecture de `locations.remoteId` ; si `remoteId` est null, la location doit d’abord être synchronisée (flux inventaire existant).

---

## 6. Schéma base de données serveur (suggestion)

Table `location_property_features` (exemple) :

| Colonne        | Type        | Description |
|----------------|-------------|-------------|
| `id`           | UUID / BIGSERIAL | PK |
| `location_id`  | FK → locations | Unique (une ligne par location). |
| `features`     | JSONB       | Objet plat clé → valeur. |
| `updated_at`   | timestamptz | Mis à jour serveur à chaque écriture. |
| `updated_by_user_id` | FK (optionnel) | Audit. |

Index unique sur `location_id`.

---

## 7. Sécurité

- Même règles que pour les autres ressources **mobile** : JWT valide ; l’utilisateur ne peut lire/écrire que les locations auxquelles il a droit.
- Ne pas journaliser le corps complet `features` en production si volumineux (RGPD / bruit logs).

---

## 8. Checklist pour les dev API

- [ ] `GET /api/mobile/locations/:id/property-features`
- [ ] `PUT /api/mobile/locations/:id/property-features` (+ validation / merge)
- [ ] (Optionnel) `PATCH` partiel, `DELETE`
- [ ] Règle de conflit documentée (`clientUpdatedAt` vs `updatedAt`)
- [ ] Cohérence avec `remoteId` des locations côté mobile
- [ ] (Optionnel) Webhook ou événement si une autre app modifie les features

---

## 9. Référence template (schéma des clés)

La liste exhaustive des clés possibles est définie par la réponse :

`GET …/v1/maildrop/features/template` → `data.topFields` + `data.sections[].features[]`.

Toute évolution du template côté **webpacksolutions** doit idéalement être versionnée (`schemaVersion` dans le template ou endpoint séparé) pour que le serveur inventaire puisse valider ou migrer les données stockées.

---

*Document généré pour le projet **EAV Inventory Tool** (Flutter) — à joindre au ticket d’intégration API Property Features.*
