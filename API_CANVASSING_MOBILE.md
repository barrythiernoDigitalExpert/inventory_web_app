# API Documentation - Canvassing Mobile App

Cette documentation détaille les routes API pour l'application mobile de canvassing avec support des revisits, commentaires multiples et nouvelles méthodes de contact.

## 🔐 Authentification

Toutes les routes nécessitent un token JWT dans l'en-tête `Authorization: Bearer <token>`.

---

## 📍 Créer une Visite (Visit)

### `POST /api/canvassingvisits`

Crée une nouvelle visite de canvassing.

#### Données à envoyer :
```json
{
  "latitude": 45.7649,
  "longitude": 4.8357,
  "contactMethod": "DOOR",
  "contactMethod2": "PHONE", // Optionnel
  "contactMethod3": "EMAIL", // Optionnel  
  "contactMethod4": "SMS",   // Optionnel
  "houseName": "Maison Dupont",
  "vendorName": "M. Dupont",  // Optionnel
  "comments": "Propriétaire intéressé", // Optionnel
  "streetAddress": "15 Rue de la Paix", // Optionnel
  "neighborhood": "Centre-ville", // Optionnel
  "city": "Lyon", // Optionnel
  "postalCode": "69001", // Optionnel
  "imagePath": "https://cloudinary.com/...", // Optionnel
  "responseReceived": "positive", // Optionnel: "positive", "negative", "no_response", "pending"
  "responseDate": "2024-01-15T10:30:00Z" // Optionnel
}
```

#### Méthodes de contact disponibles :
- `DOOR` - Porte à porte
- `PHONE` - Appel téléphonique  
- `EMAIL` - Contact email
- `LETTER` - Courrier postal
- `SMS` - Message SMS
- `BROCHURE` - Distribution de brochure
- `VALUATION_CARD` - Carte d'évaluation
- `FLYER` - Distribution de flyer
- `SOCIAL_MEDIA` - Contact réseaux sociaux
- `REFERRAL` - Contact par recommandation

#### Réponse :
```json
{
  "success": true,
  "data": {
    "visits": [{
      "id": "clx123abc",
      "latitude": 45.7649,
      "longitude": 4.8357,
      "contactMethod": "DOOR",
      "contactMethod2": "PHONE",
      "contactMethod3": null,
      "contactMethod4": null,
      "contactMethods": ["DOOR", "PHONE"],
      "houseName": "Maison Dupont",
      "vendorName": "M. Dupont",
      "comments": "Propriétaire intéressé",
      "streetAddress": "15 Rue de la Paix",
      "city": "Lyon",
      "responseReceived": "positive",
      "responseDate": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "userNames": "John Doe",
      "users": [{
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "isCreator": true,
        "joinedAt": "2024-01-15T10:00:00Z"
      }],
      "canRevisit": false,
      "hoursSinceVisit": 2,
      "hoursUntilRevisit": 166,
      "revisitsCount": 0,
      "commentsCount": 1
    }],
    "pagination": {
      "total": 1,
      "limit": 1,
      "offset": 0,
      "hasMore": false
    },
    "visitConfig": {
      "revisitDelayHours": 168
    }
  },
  "message": "Visit created successfully",
  "processingTime": 145
}
```

---

## 🔄 Créer une Revisit

### `POST /api/canvassingvisits/{visitId}/revisit`

Crée une revisit pour une visite existante.

#### Données à envoyer :
```json
{
  "latitude": 45.7649,
  "longitude": 4.8357,
  "contactMethod1": "PHONE",
  "contactMethod2": "EMAIL", // Optionnel
  "contactMethod3": "SMS",   // Optionnel
  "contactMethod4": null,    // Optionnel
  "houseName": "Maison Dupont",
  "vendorName": "M. Dupont", // Optionnel
  "comments": "Deuxième tentative de contact", // Optionnel
  "streetAddress": "15 Rue de la Paix", // Optionnel
  "neighborhood": "Centre-ville", // Optionnel
  "city": "Lyon", // Optionnel
  "postalCode": "69001", // Optionnel
  "imagePath": "https://cloudinary.com/...", // Optionnel
  "responseReceived": "positive", // Optionnel
  "responseDate": "2024-01-22T14:30:00Z" // Optionnel
}
```

#### Réponse :
```json
{
  "success": true,
  "data": {
    "revisit": {
      "id": "clx456def",
      "originalVisitId": "clx123abc",
      "latitude": 45.7649,
      "longitude": 4.8357,
      "contactMethod1": "PHONE",
      "contactMethod2": "EMAIL",
      "contactMethod3": "SMS",
      "contactMethod4": null,
      "contactMethods": ["PHONE", "EMAIL", "SMS"],
      "houseName": "Maison Dupont",
      "comments": "Deuxième tentative de contact",
      "responseReceived": "positive",
      "userId": 1,
      "userName": "John Doe",
      "createdAt": "2024-01-22T14:00:00Z",
      "hoursSinceOriginal": 170,
      "originalVisit": {
        "id": "clx123abc",
        "houseName": "Maison Dupont",
        "contactMethod": "DOOR",
        "responseReceived": "pending",
        "createdAt": "2024-01-15T10:00:00Z"
      },
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "USER"
      }
    }
  },
  "message": "Revisit created successfully",
  "processingTime": 89
}
```

---

## 💬 Ajouter un Commentaire

### `POST /api/canvassingvisits/{visitId}/comments`

Ajoute un commentaire à une visite.

#### Données à envoyer :
```json
{
  "comment": "Le propriétaire souhaite être recontacté la semaine prochaine",
  "isInitial": false  // true pour un commentaire initial, false pour secondaire
}
```

#### Réponse :
```json
{
  "success": true,
  "data": {
    "comment": {
      "id": "clx789ghi",
      "visitId": "clx123abc",
      "userId": 1,
      "comment": "Le propriétaire souhaite être recontacté la semaine prochaine",
      "isInitial": false,
      "createdAt": "2024-01-16T09:15:00Z",
      "updatedAt": "2024-01-16T09:15:00Z",
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com"
      }
    }
  },
  "message": "Comment added successfully",
  "processingTime": 67
}
```

---

## 📷 Changer/Supprimer une Photo

### `PUT /api/canvassingvisits/{visitId}/image`

Met à jour l'image d'une visite.

#### Données à envoyer :
```json
{
  "imagePath": "https://cloudinary.com/new-image-url"  // null pour supprimer
}
```

### `DELETE /api/canvassingvisits/{visitId}/image`

Supprime l'image d'une visite.

#### Réponse :
```json
{
  "success": true,
  "data": {
    "visit": {
      "id": "clx123abc",
      "imagePath": null,  // ou nouvelle URL
      "updatedAt": "2024-01-16T11:30:00Z",
      "userNames": "John Doe",
      "users": [...]
    }
  },
  "message": "Image updated successfully",
  "processingTime": 45
}
```

---

## 🔄 Changer une Réponse

### `PUT /api/canvassingvisits/{visitId}/response`

Met à jour la réponse d'une visite.

#### Données à envoyer :
```json
{
  "responseReceived": "positive",  // "positive", "negative", "no_response", "pending"
  "comments": "Commentaire mis à jour" // Optionnel
}
```

#### Réponse :
```json
{
  "success": true,
  "data": {
    "visit": {
      "id": "clx123abc",
      "responseReceived": "positive",
      "responseDate": "2024-01-16T12:00:00Z",
      "comments": "Commentaire mis à jour",
      "updatedAt": "2024-01-16T12:00:00Z",
      // ... autres champs
    }
  },
  "message": "Response updated successfully",
  "processingTime": 34
}
```

---

## 📋 Lister les Visites

### `GET /api/canvassingvisits`

Récupère toutes les visites (pour admins) ou les visites de l'utilisateur connecté.

#### Paramètres de requête :
- `userId` - ID de l'utilisateur (admin uniquement)
- `contactMethod` - Filtrer par méthode de contact
- `responseReceived` - Filtrer par type de réponse
- `startDate` - Date de début (ISO string)
- `endDate` - Date de fin (ISO string)
- `limit` - Nombre de résultats (défaut: 50)
- `offset` - Décalage pour pagination (défaut: 0)
- `forMap` - true pour données carte (coordonnées seulement)

#### Réponse :
```json
{
  "success": true,
  "data": {
    "visits": [{
      "id": "clx123abc",
      "latitude": 45.7649,
      "longitude": 4.8357,
      "contactMethod": "DOOR",
      "contactMethods": ["DOOR", "PHONE"],
      "houseName": "Maison Dupont",
      "responseReceived": "positive",
      "createdAt": "2024-01-15T10:00:00Z",
      "userNames": "John Doe",
      "canRevisit": false,
      "hoursSinceVisit": 48,
      "revisitsCount": 1,
      "revisits": [{
        "id": "clx456def",
        "contactMethods": ["PHONE", "EMAIL"],
        "responseReceived": "positive",
        "createdAt": "2024-01-22T14:00:00Z",
        "hoursSinceOriginal": 170,
        "user": {
          "id": 1,
          "name": "John Doe"
        }
      }],
      "commentsCount": 3,
      "initialComment": "Propriétaire intéressé",
      "additionalComments": [...]
    }],
    "pagination": {
      "total": 25,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "visitConfig": {
      "revisitDelayHours": 168
    }
  },
  "processingTime": 156
}
```

---

## 👤 Lister les Visites d'un Utilisateur

### `GET /api/users/{userId}/canvassingvisits`

Récupère les visites d'un utilisateur spécifique avec ses revisits.

#### Paramètres de requête :
- `includeRevisits` - Inclure les revisits (défaut: true)
- `includeStats` - Inclure les statistiques (défaut: false)
- `contactMethod` - Filtrer par méthode de contact
- `responseReceived` - Filtrer par type de réponse
- `startDate` - Date de début
- `endDate` - Date de fin
- `limit` - Nombre de résultats (défaut: 50)
- `offset` - Décalage pour pagination (défaut: 0)

#### Réponse :
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER",
      "isActive": true
    },
    "visits": [...], // Même format que ci-dessus
    "userRevisits": [{
      "id": "clx456def",
      "originalVisitId": "clx123abc",
      "contactMethods": ["PHONE", "EMAIL", "SMS"],
      "responseReceived": "positive",
      "createdAt": "2024-01-22T14:00:00Z",
      "hoursSinceOriginal": 170,
      "originalVisit": {
        "id": "clx123abc",
        "houseName": "Maison Dupont",
        "contactMethod": "DOOR",
        "createdAt": "2024-01-15T10:00:00Z"
      }
    }],
    "pagination": {
      "total": 15,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "visitConfig": {
      "revisitDelayHours": 168
    },
    "userStats": {
      "totalVisits": 15,
      "totalRevisitsPerformed": 3,
      "visitsWithRevisits": 5,
      "responseBreakdown": {
        "positive": 8,
        "negative": 2,
        "no_response": 3,
        "pending": 2
      }
    },
    "activitySummary": {
      "totalVisits": 15,
      "visitsLast30Days": 12,
      "visitsLast7Days": 4,
      "visitsTodayCount": 1,
      "totalRevisits": 3,
      "revisitsLast30Days": 2,
      "averageVisitsPerDay": 1.2,
      "recent30DayAverage": 0.4,
      "recent7DayAverage": 0.57,
      "activityTrend": "increasing",
      "firstVisit": {
        "date": "2024-01-01T09:00:00Z",
        "houseName": "Première Maison",
        "contactMethods": ["DOOR"],
        "daysSince": 15
      },
      "lastVisit": {
        "date": "2024-01-15T16:30:00Z",
        "houseName": "Maison Dupont",
        "contactMethods": ["DOOR", "PHONE"],
        "daysSince": 1
      },
      "geographicCoverage": {
        "totalCities": 3,
        "totalNeighborhoods": 7,
        "cities": ["Lyon", "Villeurbanne", "Caluire"],
        "neighborhoods": ["Centre-ville", "Part-Dieu", "Bellecour"]
      },
      "contactMethodStats": {
        "DOOR": 10,
        "PHONE": 5,
        "EMAIL": 3,
        "SMS": 2
      },
      "responseStats": {
        "positive": 8,
        "negative": 2,
        "no_response": 3,
        "pending": 2
      }
    }
  },
  "processingTime": 234
}
```

---

## 📊 Récupérer les Visites avec Revisits

### `GET /api/canvassingvisits/with-revisits`

Récupère toutes les visites avec leurs revisits associées.

#### Paramètres de requête :
- `userSpecific` - true pour les visites de l'utilisateur uniquement (défaut: false)
- Mêmes paramètres de filtre que la route principale

#### Réponse :
```json
{
  "success": true,
  "data": {
    "visits": [...], // Format complet avec revisits
    "pagination": {...},
    "visitConfig": {...},
    "summary": {
      "totalVisits": 150,
      "totalRevisits": 45,
      "visitsWithRevisits": 32
    }
  },
  "processingTime": 189
}
```

---

## 🔍 Récupérer les Commentaires d'une Visite

### `GET /api/canvassingvisits/{visitId}/comments`

Récupère tous les commentaires d'une visite.

#### Réponse :
```json
{
  "success": true,
  "data": {
    "visit": {
      "id": "clx123abc",
      "houseName": "Maison Dupont",
      "comments": "Commentaire initial de la visite"
    },
    "initialComment": {
      "id": "clx789ghi",
      "comment": "Commentaire initial important",
      "isInitial": true,
      "createdAt": "2024-01-15T10:05:00Z",
      "user": {
        "name": "John Doe"
      }
    },
    "secondaryComments": [{
      "id": "clx890jkl",
      "comment": "Commentaire de suivi",
      "isInitial": false,
      "createdAt": "2024-01-16T09:15:00Z",
      "user": {
        "name": "Jane Smith"
      }
    }],
    "totalComments": 3
  },
  "processingTime": 45
}
```

---

## 🔍 Récupérer les Revisits d'une Visite

### `GET /api/canvassingvisits/{visitId}/revisit`

Récupère toutes les revisits d'une visite.

#### Réponse :
```json
{
  "success": true,
  "data": {
    "revisits": [{
      "id": "clx456def",
      "originalVisitId": "clx123abc",
      "contactMethods": ["PHONE", "EMAIL", "SMS"],
      "houseName": "Maison Dupont",
      "responseReceived": "positive",
      "userId": 1,
      "userName": "John Doe",
      "createdAt": "2024-01-22T14:00:00Z",
      "hoursSinceOriginal": 170,
      "user": {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "USER"
      }
    }],
    "originalVisit": {
      "id": "clx123abc",
      "houseName": "Maison Dupont",
      "createdAt": "2024-01-15T10:00:00Z"
    },
    "visitConfig": {
      "revisitDelayHours": 168
    },
    "totalCount": 1
  },
  "processingTime": 67
}
```

---

## 📱 Synchronisation Bulk (pour mode hors-ligne)

### `POST /api/canvassingvisits` (avec array)

Synchronise plusieurs visites en une seule requête.

#### Données à envoyer :
```json
[
  {
    "latitude": 45.7649,
    "longitude": 4.8357,
    "contactMethod": "DOOR",
    "houseName": "Maison 1",
    "mobileId": "mobile_uuid_1",
    "createdAt": "2024-01-15T10:00:00Z"
  },
  {
    "latitude": 45.7650,
    "longitude": 4.8358,
    "contactMethod": "PHONE",
    "houseName": "Maison 2",
    "mobileId": "mobile_uuid_2",
    "createdAt": "2024-01-15T11:00:00Z"
  }
]
```

#### Réponse :
```json
{
  "success": true,
  "data": {
    "visits": [...], // Visites créées avec succès
    "stats": {
      "total": 2,
      "successful": 2,
      "errors": 0,
      "errorMessages": []
    },
    "visitConfig": {
      "revisitDelayHours": 168
    }
  },
  "message": "Bulk sync completed: 2 visits created",
  "processingTime": 267
}
```

---

## 🚨 Codes d'Erreur

- **400** - Données manquantes ou invalides
- **401** - Non authentifié  
- **403** - Non autorisé
- **404** - Ressource non trouvée
- **409** - Conflit (ex: visite avec même mobileId)
- **500** - Erreur serveur

---

## 📝 Notes Importantes

1. **Délai de Revisit** : Par défaut 168 heures (7 jours), configurable via `VisitConfiguration`
2. **Méthodes de Contact** : Maximum 4 par visite (1 principale + 3 secondaires) pour CanvassingVisit, 4 pour Revisit
3. **Commentaires** : Un commentaire initial par visite + commentaires secondaires illimités
4. **GPS** : Latitude et longitude requises pour toutes les visites et revisits
5. **Permissions** : Les utilisateurs ne peuvent voir/modifier que leurs propres visites, sauf les admins
6. **Pagination** : Utilisez `limit` et `offset` pour la pagination des listes
7. **Temps de Traitement** : Inclus dans toutes les réponses pour monitoring des performances
