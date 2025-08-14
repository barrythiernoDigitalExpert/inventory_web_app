# API Mobile - Gestion des Utilisateurs

Ce document décrit les endpoints API pour la gestion des utilisateurs destinés à l'application mobile.

## Base URL
```
/api/mobile/users
```

## Authentication
Toutes les routes nécessitent une authentification JWT avec des privilèges ADMIN. L'authentification se fait via un token JWT Bearer dans l'en-tête Authorization.

---

## 1. Lister tous les utilisateurs

### Endpoint
```http
GET /api/mobile/users
```

### Headers requis
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Réponse de succès (200)
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "1",
        "name": "John Doe",
        "email": "john@example.com",
        "role": "USER",
        "isActive": true,
        "authType": "LOCAL",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      },
      {
        "id": "2",
        "name": "Admin User",
        "email": "admin@example.com",
        "role": "ADMIN",
        "isActive": true,
        "authType": "GOOGLE",
        "createdAt": "2024-01-10T08:15:00.000Z",
        "updatedAt": "2024-01-10T08:15:00.000Z"
      }
    ],
    "total": 2
  }
}
```

### Réponses d'erreur
```json
// 401 - Token manquant ou invalide
{
  "success": false,
  "error": "Missing or invalid authorization token"
}

// 401 - Token invalide
{
  "success": false,
  "error": "Invalid token"
}

// 403 - Privilèges insuffisants
{
  "success": false,
  "error": "Unauthorized access. Admin privileges required."
}

// 404 - Utilisateur du token non trouvé
{
  "success": false,
  "error": "User not found"
}

// 403 - Compte inactif
{
  "success": false,
  "error": "Account inactive"
}

// 500 - Erreur serveur
{
  "success": false,
  "error": "Internal server error while fetching users"
}
```

---

## 2. Créer un nouvel utilisateur

### Endpoint
```http
POST /api/mobile/users
```

### Headers requis
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Body de la requête
```json
{
  "name": "Nouveau Utilisateur",
  "email": "nouveau@example.com",
  "password": "motdepasse123",
  "role": "USER"
}
```

### Paramètres requis
- `name` (string) : Nom complet de l'utilisateur
- `email` (string) : Adresse email valide (unique)
- `password` (string) : Mot de passe (minimum 6 caractères)

### Paramètres optionnels
- `role` (string) : Rôle de l'utilisateur ("USER" ou "ADMIN", par défaut "USER")

### Validation
- **Email** : Format valide requis (regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- **Mot de passe** : Minimum 6 caractères
- **Rôle** : Doit être "USER" ou "ADMIN"
- **Unicité** : L'email doit être unique dans le système

### Réponse de succès (201)
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "3",
      "name": "Nouveau Utilisateur",
      "email": "nouveau@example.com",
      "role": "USER",
      "isActive": true,
      "authType": "LOCAL",
      "createdAt": "2024-01-16T14:22:00.000Z",
      "updatedAt": "2024-01-16T14:22:00.000Z"
    }
  }
}
```

### Réponses d'erreur
```json
// 400 - Champs manquants
{
  "success": false,
  "error": "Missing required fields. Name, email, and password are required."
}

// 400 - Email invalide
{
  "success": false,
  "error": "Invalid email format."
}

// 400 - Mot de passe trop court
{
  "success": false,
  "error": "Password must be at least 6 characters long."
}

// 400 - Rôle invalide
{
  "success": false,
  "error": "Invalid role. Must be either ADMIN or USER."
}

// 409 - Email déjà utilisé
{
  "success": false,
  "error": "A user with this email already exists."
}

// 401 - Token manquant ou invalide
{
  "success": false,
  "error": "Missing or invalid authorization token"
}

// 401 - Token invalide
{
  "success": false,
  "error": "Invalid token"
}

// 403 - Privilèges insuffisants
{
  "success": false,
  "error": "Unauthorized access. Admin privileges required."
}

// 404 - Utilisateur du token non trouvé
{
  "success": false,
  "error": "User not found"
}

// 403 - Compte inactif
{
  "success": false,
  "error": "Account inactive"
}

// 500 - Erreur serveur
{
  "success": false,
  "error": "Internal server error while creating user"
}
```

---

## 3. Réinitialiser le mot de passe d'un utilisateur

### Endpoint
```http
POST /api/mobile/users/{id}/reset-password
```

### Headers requis
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### Paramètres URL
- `id` (integer) : ID de l'utilisateur

### Body de la requête
```json
{
  "password": "nouveaumotdepasse123"
}
```

### Paramètres requis
- `password` (string) : Nouveau mot de passe (minimum 6 caractères)

### Restrictions
- Seuls les utilisateurs avec `authType: "LOCAL"` peuvent avoir leur mot de passe réinitialisé
- Les utilisateurs avec authentification Google ne peuvent pas avoir leur mot de passe réinitialisé

### Réponse de succès (200)
```json
{
  "success": true,
  "message": "Password reset successfully",
  "data": {
    "user": {
      "id": "1",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "USER"
    }
  }
}
```

### Réponses d'erreur
```json
// 400 - ID utilisateur invalide
{
  "success": false,
  "error": "Invalid user ID format."
}

// 400 - Mot de passe manquant
{
  "success": false,
  "error": "Password is required."
}

// 400 - Mot de passe trop court
{
  "success": false,
  "error": "Password must be at least 6 characters long."
}

// 400 - Utilisateur avec auth externe
{
  "success": false,
  "error": "Cannot reset password for users with external authentication (Google)."
}

// 404 - Utilisateur non trouvé
{
  "success": false,
  "error": "User not found."
}

// 401 - Token manquant ou invalide
{
  "success": false,
  "error": "Missing or invalid authorization token"
}

// 401 - Token invalide
{
  "success": false,
  "error": "Invalid token"
}

// 403 - Privilèges insuffisants
{
  "success": false,
  "error": "Unauthorized access. Admin privileges required."
}

// 404 - Utilisateur du token non trouvé
{
  "success": false,
  "error": "User not found"
}

// 403 - Compte inactif
{
  "success": false,
  "error": "Account inactive"
}

// 500 - Erreur serveur
{
  "success": false,
  "error": "Internal server error while resetting password"
}
```

---

## Types de données

### User Object
```typescript
interface User {
  id: string;           // ID unique de l'utilisateur
  name: string;         // Nom complet
  email: string;        // Adresse email
  role: "USER" | "ADMIN"; // Rôle de l'utilisateur
  isActive: boolean;    // Statut actif/inactif
  authType: "LOCAL" | "GOOGLE"; // Type d'authentification
  createdAt: string;    // Date de création (ISO 8601)
  updatedAt: string;    // Date de dernière modification (ISO 8601)
}
```

### Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;     // Indicateur de succès
  message?: string;     // Message de confirmation (optionnel)
  data?: T;            // Données de réponse (optionnel)
  error?: string;      // Message d'erreur (optionnel)
}
```

---

## Codes de statut HTTP

- **200** : Succès
- **201** : Créé avec succès
- **400** : Requête invalide
- **401** : Token manquant ou invalide
- **403** : Accès refusé (privilèges insuffisants ou compte inactif)
- **404** : Ressource non trouvée
- **409** : Conflit (email déjà existant)
- **500** : Erreur serveur interne

---

## Sécurité

### Hachage des mots de passe
- Algorithme : bcrypt avec cost factor 12
- Les mots de passe sont automatiquement hachés avant stockage
- Aucun mot de passe en clair n'est stocké ou retourné

### Validation des entrées
- Validation stricte de tous les paramètres
- Sanitisation des emails (conversion en minuscules)
- Trim des espaces pour les noms

### Authentification JWT
- Authentification par token JWT Bearer dans l'en-tête Authorization
- Seuls les utilisateurs avec le rôle ADMIN peuvent utiliser ces endpoints
- Vérification automatique du statut actif de l'utilisateur
- Token vérifié avec la clé secrète NEXTAUTH_SECRET

---

## Exemples d'utilisation

### Créer un utilisateur standard
```javascript
const response = await fetch('/api/mobile/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <jwt_token>'
  },
  body: JSON.stringify({
    name: 'Marie Dupont',
    email: 'marie.dupont@example.com',
    password: 'securepassword123',
    role: 'USER'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Utilisateur créé:', result.data.user);
} else {
  console.error('Erreur:', result.error);
}
```

### Réinitialiser un mot de passe
```javascript
const response = await fetch('/api/mobile/users/1/reset-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <jwt_token>'
  },
  body: JSON.stringify({
    password: 'newpassword456'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Mot de passe réinitialisé pour:', result.data.user.name);
} else {
  console.error('Erreur:', result.error);
}
```

### Lister tous les utilisateurs
```javascript
const response = await fetch('/api/mobile/users', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer <jwt_token>'
  }
});

const result = await response.json();
if (result.success) {
  const users = result.data.users;
  console.log(`Trouvé ${result.data.total} utilisateurs`);
} else {
  console.error('Erreur:', result.error);
}
```