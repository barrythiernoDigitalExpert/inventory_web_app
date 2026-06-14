/**
 * Résolution approximative ville/pays pour visites canvassing sans reverse geocoding persisté.
 * Utilisé par /api/stats (cityStats) quand city est null en base.
 */

export interface ResolvedVisitLocation {
  city: string;
  country: string;
  source: 'city' | 'street_address' | 'neighborhood' | 'coordinates' | 'country_only';
}

/** Zones Algarve / opérations EAV fréquentes (bounding boxes approximatives) */
const CITY_REGIONS: Array<{
  city: string;
  country: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}> = [
  { city: 'Lagos', country: 'Portugal', minLat: 37.05, maxLat: 37.2, minLng: -8.75, maxLng: -8.5 },
  { city: 'Portimão', country: 'Portugal', minLat: 37.08, maxLat: 37.22, minLng: -8.68, maxLng: -8.48 },
  { city: 'Lagoa', country: 'Portugal', minLat: 37.1, maxLat: 37.2, minLng: -8.55, maxLng: -8.4 },
  { city: 'Albufeira', country: 'Portugal', minLat: 37.05, maxLat: 37.18, minLng: -8.35, maxLng: -8.2 },
  { city: 'Faro', country: 'Portugal', minLat: 37.0, maxLat: 37.1, minLng: -8.0, maxLng: -7.85 },
  { city: 'Tavira', country: 'Portugal', minLat: 37.1, maxLat: 37.2, minLng: -7.75, maxLng: -7.55 },
  { city: 'Olhão', country: 'Portugal', minLat: 37.0, maxLat: 37.08, minLng: -7.9, maxLng: -7.75 },
  { city: 'Loulé', country: 'Portugal', minLat: 37.1, maxLat: 37.2, minLng: -8.05, maxLng: -7.95 },
  { city: 'Silves', country: 'Portugal', minLat: 37.15, maxLat: 37.25, minLng: -8.5, maxLng: -8.35 },
  { city: 'Lisbon', country: 'Portugal', minLat: 38.65, maxLat: 38.85, minLng: -9.25, maxLng: -9.05 },
];

const COUNTRY_BOUNDS: Array<{
  country: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}> = [
  { country: 'Portugal', minLat: 36.8, maxLat: 42.2, minLng: -9.6, maxLng: -6.0 },
  { country: 'Togo', minLat: 6.0, maxLat: 11.2, minLng: -0.2, maxLng: 1.9 },
  { country: 'Benin', minLat: 6.0, maxLat: 12.5, minLng: 0.7, maxLng: 3.9 },
];

function inBounds(
  lat: number,
  lng: number,
  box: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  return lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;
}

/**
 * Extrait la ville depuis streetAddress : dernière partie après la virgule.
 * Ex. "E1, Gomes Aires" → "Gomes Aires"
 *     "9 Praceta Santa Bárbara 9, Cascais" → "Cascais"
 */
export function extractCityFromStreetAddress(
  streetAddress?: string | null
): string | null {
  if (!streetAddress?.trim()) return null;

  const parts = streetAddress
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) return null;

  const city = parts[parts.length - 1];
  return city.length > 0 ? city : null;
}

export function resolveVisitLocation(input: {
  latitude: number;
  longitude: number;
  city?: string | null;
  streetAddress?: string | null;
  neighborhood?: string | null;
}): ResolvedVisitLocation | null {
  const storedCity = input.city?.trim();
  if (storedCity) {
    return {
      city: storedCity,
      country: inferCountryFromCoordinates(input.latitude, input.longitude),
      source: 'city',
    };
  }

  const cityFromAddress = extractCityFromStreetAddress(input.streetAddress);
  if (cityFromAddress) {
    return {
      city: cityFromAddress,
      country: inferCountryFromCoordinates(input.latitude, input.longitude),
      source: 'street_address',
    };
  }

  const neighborhood = input.neighborhood?.trim();
  if (neighborhood) {
    return {
      city: neighborhood,
      country: inferCountryFromCoordinates(input.latitude, input.longitude),
      source: 'neighborhood',
    };
  }

  for (const region of CITY_REGIONS) {
    if (inBounds(input.latitude, input.longitude, region)) {
      return {
        city: region.city,
        country: region.country,
        source: 'coordinates',
      };
    }
  }

  const country = inferCountryFromCoordinates(input.latitude, input.longitude);
  if (country) {
    return {
      city: `Other (${country})`,
      country,
      source: 'country_only',
    };
  }

  return null;
}

function inferCountryFromCoordinates(lat: number, lng: number): string {
  for (const bound of COUNTRY_BOUNDS) {
    if (inBounds(lat, lng, bound)) {
      return bound.country;
    }
  }
  return '';
}

export function locationKey(location: ResolvedVisitLocation): string {
  return location.city.trim().toLowerCase();
}
