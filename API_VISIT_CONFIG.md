# API Configuration des Visites - Guide Mobile

## Vue d'ensemble

L'API de configuration des visites permet de gérer les paramètres de revisite pour le système de démarchage. Elle contrôle le délai minimum entre les visites d'une même propriété.

## Endpoints Disponibles

### 1. Récupérer la Configuration Actuelle

**GET** `/api/visit-config`

Récupère la configuration active des visites avec conversion automatique en jours.

#### Headers Requis
```
Authorization: Bearer <jwt_token>
```

#### Réponse Succès (200)
```json
{
  "success": true,
  "data": {
    "configuration": {
      "id": 1,
      "revisitDelayHours": 168,
      "revisitDelayDays": 7,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    "isDefault": false
  },
  "processingTime": 45
}
```

#### Configuration par Défaut
Si aucune configuration n'existe, retourne des valeurs par défaut :
```json
{
  "success": true,
  "data": {
    "configuration": {
      "id": null,
      "revisitDelayHours": 168,
      "revisitDelayDays": 7,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    },
    "isDefault": true
  },
  "processingTime": 15
}
```

### 2. Mettre à Jour la Configuration

**POST** `/api/visit-config`

Met à jour la configuration existante ou en crée une nouvelle. **Requiert un rôle ADMIN**.

#### Headers Requis
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

#### Corps de la Requête
```json
{
  "revisitDelayHours": 72
}
```

#### Validation
- `revisitDelayHours` : Obligatoire, entre 1 et 8760 heures (1 an maximum)

#### Réponse Succès (200/201)
```json
{
  "success": true,
  "data": {
    "configuration": {
      "id": 1,
      "revisitDelayHours": 72,
      "revisitDelayDays": 3,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T14:30:00Z"
    }
  },
  "message": "Visit configuration updated successfully. Revisit delay set to 72 hours (3 days).",
  "processingTime": 89
}
```

## Intégration avec l'API des Visites

### Impact sur `/api/canvassingvisits`

La configuration est automatiquement utilisée par l'API des visites pour :

1. **Calcul de `canRevisit`** : Détermine si une propriété peut être revisitée
2. **Calcul de `hoursUntilRevisit`** : Heures restantes avant une nouvelle visite possible
3. **Retour de `visitConfig`** : Inclut la configuration dans les réponses

#### Exemple dans la réponse des visites
```json
{
  "success": true,
  "data": {
    "visits": [...],
    "visitConfig": {
      "revisitDelayHours": 168,
      "revisitDelayDays": 7
    }
  }
}
```

## Utilisation Mobile

### 1. Récupération au Démarrage
```javascript
// Récupérer la configuration au lancement de l'app
const getVisitConfig = async () => {
  try {
    const response = await fetch('/api/visit-config', {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });
    const data = await response.json();
    
    if (data.success) {
      const config = data.data.configuration;
      console.log(`Délai de revisite: ${config.revisitDelayDays} jours`);
      return config;
    }
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration:', error);
  }
};
```

### 2. Validation Locale des Revisites
```javascript
// Vérifier si une propriété peut être revisitée
const canRevisitProperty = (lastVisitDate, configHours) => {
  const hoursSinceVisit = (Date.now() - new Date(lastVisitDate).getTime()) / (1000 * 60 * 60);
  return hoursSinceVisit >= configHours;
};

// Utilisation
const config = await getVisitConfig();
const canRevisit = canRevisitProperty('2024-01-10T10:00:00Z', config.revisitDelayHours);
```

### 3. Interface Utilisateur
```javascript
// Afficher le délai en format lisible
const formatDelayForUser = (hours) => {
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  
  if (days > 0 && remainingHours > 0) {
    return `${days} jour${days > 1 ? 's' : ''} et ${remainingHours} heure${remainingHours > 1 ? 's' : ''}`;
  } else if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`;
  } else {
    return `${hours} heure${hours > 1 ? 's' : ''}`;
  }
};
```

## Gestion des Erreurs

### Codes d'Erreur Communs

- **401** : Token d'authentification manquant ou invalide
- **403** : Accès refusé (POST requiert un rôle ADMIN)
- **400** : Données invalides (délai hors limites)
- **500** : Erreur serveur

### Exemple de Gestion
```javascript
const updateVisitConfig = async (newDelayHours) => {
  try {
    const response = await fetch('/api/visit-config', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ revisitDelayHours: newDelayHours })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      switch (response.status) {
        case 403:
          alert('Seuls les administrateurs peuvent modifier cette configuration');
          break;
        case 400:
          alert('Délai invalide. Doit être entre 1 heure et 1 an');
          break;
        default:
          alert(`Erreur: ${data.error}`);
      }
      return null;
    }
    
    return data.data.configuration;
  } catch (error) {
    console.error('Erreur réseau:', error);
    alert('Problème de connexion. Veuillez réessayer.');
    return null;
  }
};
```

## Synchronisation Mobile

### Cache Local
Il est recommandé de mettre en cache la configuration localement pour les cas hors ligne :

```javascript
// Sauvegarde locale
const cacheVisitConfig = (config) => {
  localStorage.setItem('visitConfig', JSON.stringify(config));
};

// Récupération depuis le cache
const getCachedVisitConfig = () => {
  const cached = localStorage.getItem('visitConfig');
  return cached ? JSON.parse(cached) : null;
};

// Stratégie cache-first avec fallback réseau
const getVisitConfigWithCache = async () => {
  // Essayer le cache d'abord
  let config = getCachedVisitConfig();
  
  try {
    // Mettre à jour depuis le serveur
    const freshConfig = await getVisitConfig();
    if (freshConfig) {
      cacheVisitConfig(freshConfig);
      return freshConfig;
    }
  } catch (error) {
    console.log('Utilisation du cache en cas d\'erreur réseau');
  }
  
  // Retourner le cache ou une config par défaut
  return config || { revisitDelayHours: 168, revisitDelayDays: 7 };
};
```

## Recommandations d'Implémentation

1. **Récupération périodique** : Vérifier la configuration toutes les heures ou à chaque synchronisation
2. **Cache intelligent** : Garder une copie locale avec timestamp de dernière mise à jour
3. **Interface admin** : Permettre aux administrateurs de modifier la configuration depuis l'app
4. **Validation temps réel** : Utiliser la configuration pour valider les revisites avant envoi au serveur
5. **Feedback utilisateur** : Afficher clairement quand une propriété pourra être revisitée

## Valeurs Recommandées

- **Démarchage résidentiel** : 168 heures (7 jours)
- **Suivi commercial** : 72 heures (3 jours)  
- **Campagne intensive** : 24 heures (1 jour)
- **Suivi à long terme** : 720 heures (30 jours)