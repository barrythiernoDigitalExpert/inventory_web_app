# API Revisit - Documentation

## Structure de la table Revisit

La table `Revisit` contient les informations suivantes :

```prisma
model Revisit {
  id                  String          @id @default(cuid())
  originalVisitId     String          @map("original_visit_id")
  
  // GPS coordinates
  latitude            Float
  longitude           Float
  
  // Contact information - can use up to 4 contact methods
  contactMethod1      ContactMethod?  @map("contact_method_1")
  contactMethod2      ContactMethod?  @map("contact_method_2")
  contactMethod3      ContactMethod?  @map("contact_method_3")
  contactMethod4      ContactMethod?  @map("contact_method_4")
  
  houseName           String          @map("house_name")
  vendorName          String?         @map("vendor_name")
  comments            String?         @db.Text
  
  // Address components (optional, from geocoding)
  streetAddress       String?         @map("street_address")
  neighborhood        String?
  city                String?
  postalCode          String?         @map("postal_code")
  
  // Optional image
  imagePath           String?         @map("image_path")
  
  // Response tracking
  responseReceived    ResponseType?   @map("response_received")
  responseDate        DateTime?       @map("response_date")
  
  // User who performed the revisit
  userId              Int             @map("user_id")
  userName            String          @map("user_name")
  
  // Timestamps
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")
  
  // Relations
  originalVisit       CanvassingVisit @relation("OriginalVisit", fields: [originalVisitId], references: [id], onDelete: Cascade)
  user                User            @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## GET /api/canvassingvisits - Réponse avec Revisits

### Structure de la réponse

```json
{
  "success": true,
  "data": {
    "visits": [
      {
        "id": "visit_id",
        "latitude": 6.172088991191162,
        "longitude": 1.144413091242313,
        "contactMethod": "DOOR",
        "contactMethod2": "PHONE",
        "contactMethod3": null,
        "contactMethod4": null,
        "houseName": "Property at 6.1721, 1.1444",
        "vendorName": null,
        "comments": "Initial visit comments",
        "streetAddress": "54CW+Q3, Lomé",
        "neighborhood": null,
        "city": null,
        "postalCode": null,
        "imagePath": null,
        "responseReceived": "no_response",
        "responseDate": "2025-08-11T01:46:15.262Z",
        "createdAt": "2025-08-10T15:30:00.000Z",
        "updatedAt": "2025-08-11T01:46:15.262Z",
        
        // Informations utilisateurs
        "userNames": "John Doe",
        "users": [
          {
            "id": 1,
            "name": "John Doe",
            "email": "john@example.com",
            "isCreator": true,
            "joinedAt": "2025-08-10T15:30:00.000Z"
          }
        ],
        
        // Méthodes de contact formatées
        "contactMethods": ["DOOR", "PHONE"],
        
        // Informations de revisit
        "canRevisit": true,
        "hoursSinceVisit": 25,
        "hoursUntilRevisit": 0,
        
        // Liste des revisits
        "revisits": [
          {
            "id": "revisit_id_1",
            "latitude": 6.172088991191162,
            "longitude": 1.144413091242313,
            "contactMethods": ["PHONE", "EMAIL"],
            "houseName": "Property at 6.1721, 1.1444",
            "vendorName": "ABC Company",
            "comments": "Second attempt - owner available",
            "streetAddress": "54CW+Q3, Lomé",
            "neighborhood": null,
            "city": null,
            "postalCode": null,
            "imagePath": "/uploads/revisit_image.jpg",
            "responseReceived": "positive",
            "responseDate": "2025-08-11T10:00:00.000Z",
            "createdAt": "2025-08-11T09:45:00.000Z",
            "user": {
              "id": 2,
              "name": "Jane Smith",
              "email": "jane@example.com"
            },
            "hoursSinceOriginal": 18
          }
        ],
        
        // Métadonnées revisit
        "hasRevisits": true,
        "revisitCount": 1
      }
    ],
    "pagination": {
      "total": 1,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "visitConfig": {
      "revisitDelayHours": 168
    }
  },
  "processingTime": 45
}
```

### Champs spécifiques aux revisits

#### Dans chaque visite :
- `revisits`: Array des revisits pour cette visite (peut être undefined si aucune)
- `hasRevisits`: Boolean indiquant s'il y a des revisits
- `revisitCount`: Nombre total de revisits pour cette visite

#### Dans chaque revisit :
- `id`: ID unique de la revisit
- `latitude`, `longitude`: Coordonnées GPS de la revisit
- `contactMethods`: Array des méthodes de contact utilisées (filtré pour enlever les null)
- `houseName`: Nom de la propriété
- `vendorName`: Nom du vendeur (optionnel)
- `comments`: Commentaires de la revisit
- `streetAddress`, `neighborhood`, `city`, `postalCode`: Composants d'adresse
- `imagePath`: Chemin vers l'image (optionnel)
- `responseReceived`: Type de réponse reçue
- `responseDate`: Date de la réponse
- `createdAt`: Date de création de la revisit
- `user`: Informations sur l'utilisateur qui a effectué la revisit
- `hoursSinceOriginal`: Nombre d'heures depuis la visite originale

## Logique de récupération

1. **Inclusion dans Prisma** : Les revisits sont chargées via la relation `revisits` définie dans le schéma
2. **Tri** : Les revisits sont triées par date de création (plus récentes en premier)
3. **Formatage** : Les données sont formatées pour une utilisation front-end optimale
4. **Calculs** : Les heures depuis la visite originale sont calculées automatiquement

## Utilisation côté client

```javascript
// Vérifier si une visite a des revisits
if (visit.hasRevisits) {
  console.log(`Cette visite a ${visit.revisitCount} revisit(s)`);
  
  // Parcourir les revisits
  visit.revisits.forEach(revisit => {
    console.log(`Revisit du ${revisit.createdAt} par ${revisit.user.name}`);
    console.log(`Réponse: ${revisit.responseReceived}`);
    console.log(`${revisit.hoursSinceOriginal}h après la visite originale`);
  });
}
```