'use client';

import { useState, useEffect, useRef } from 'react';
import NextImage from 'next/image';
import { X, MapPin, Home, User, MessageSquare, Image as ImageIcon, Navigation, Link as LinkIcon, MapPinned, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userLocation: { lat: number; lng: number } | null;
  map: google.maps.Map | null;
  isPanel?: boolean;
}

type LocationMethod = 'current' | 'map' | 'link' | 'manual' | 'search';
type ContactMethod = 'BROCHURE' | 'LETTER' | 'VALUATION_CARD' | 'DOOR' | 'PHONE' | 'EMAIL';

const CONTACT_METHODS: { value: ContactMethod; label: string; icon: string }[] = [
  { value: 'BROCHURE', label: 'Brochure', icon: '📄' },
  { value: 'LETTER', label: 'Letter', icon: '✉️' },
  { value: 'VALUATION_CARD', label: 'Valuation Card', icon: '💳' },
  { value: 'DOOR', label: 'Door Knocking', icon: '🚪' },
  { value: 'PHONE', label: 'Phone Call', icon: '📞' },
  { value: 'EMAIL', label: 'Email', icon: '📧' },
];

const RESPONSE_OPTIONS = [
  { value: '', label: 'Select Response' },
  { value: 'pending', label: 'Pending' },
  { value: 'positive', label: 'Positive' },
  { value: 'negative', label: 'Negative' },
  { value: 'no_response', label: 'No Response' },
];

export default function AddVisitModal({ isOpen, onClose, onSuccess, userLocation, map, isPanel = false }: AddVisitModalProps) {
  const [locationMethod, setLocationMethod] = useState<LocationMethod>('current');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [houseName, setHouseName] = useState<string>('');
  const [vendorName, setVendorName] = useState<string>('');
  const [selectedContactMethods, setSelectedContactMethods] = useState<Set<ContactMethod>>(new Set());
  const [responseStatus, setResponseStatus] = useState<string>('');
  const [comments, setComments] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectingOnMap, setIsSelectingOnMap] = useState(false);
  const mapMarkerRef = useRef<google.maps.Marker | null>(null);
  const [addressSearchQuery, setAddressSearchQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<Array<{ id: string; description: string; source: 'places' | 'geocoder'; placeId?: string; lat?: number; lng?: number }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update coordinates when user location changes or location method changes
  useEffect(() => {
    if (locationMethod === 'current' && userLocation) {
      setLatitude(userLocation.lat.toString());
      setLongitude(userLocation.lng.toString());
      geocodeLocation(userLocation.lat, userLocation.lng);
    }
  }, [locationMethod, userLocation]);

  // Geocode location to get address
  const geocodeLocation = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        setAddress(response.results[0].formatted_address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // Pan the live map to a location
  const panMapTo = (lat: number, lng: number, zoom = 17) => {
    if (!map) return;
    map.panTo({ lat, lng });
    map.setZoom(zoom);
  };

  // Place/update a draggable gold marker on the live map
  const placeMarkerOnMap = (lat: number, lng: number) => {
    if (!map || !window.google) return;
    if (mapMarkerRef.current) {
      mapMarkerRef.current.setMap(null);
      mapMarkerRef.current = null;
    }
    const marker = new google.maps.Marker({
      position: { lat, lng },
      map,
      draggable: true,
      animation: google.maps.Animation.DROP,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 11,
        fillColor: '#D4A017',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2.5,
      },
      zIndex: 9999,
    });
    marker.addListener('dragend', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newLat = e.latLng.lat();
        const newLng = e.latLng.lng();
        setLatitude(newLat.toString());
        setLongitude(newLng.toString());
        geocodeLocation(newLat, newLng);
      }
    });
    mapMarkerRef.current = marker;
  };

  // Handle map selection
  const handleSelectOnMap = () => {
    if (!map) {
      toast.error('Map not loaded');
      return;
    }

    setIsSelectingOnMap(true);
    toast('Click on the map to select location', { icon: '📍' });

    // Clear existing marker
    if (mapMarkerRef.current) {
      mapMarkerRef.current.setMap(null);
      mapMarkerRef.current = null;
    }

    // Add click listener to map
    const listener = map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        setLatitude(lat.toString());
        setLongitude(lng.toString());
        geocodeLocation(lat, lng);

        // Add marker at clicked location
        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#D4A017',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });
        mapMarkerRef.current = marker;

        setIsSelectingOnMap(false);
        toast.success('Location selected');

        // Remove listener after first click
        google.maps.event.removeListener(listener);
      }
    });
  };

  // Handle Google Maps link parsing (supports full URLs and short links like maps.app.goo.gl)
  const handleGoogleMapsLink = async (link: string) => {
    if (!link.trim()) return;

    const PATTERNS = [
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,  // Place pin — exact pin position (highest priority)
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,        // Camera center (fallback)
      /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/, // ll= param
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/,       // query coords
    ];

    const tryExtract = (url: string) => {
      for (const pattern of PATTERNS) {
        const match = url.match(pattern);
        if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
      }
      return null;
    };

    const applyCoords = (lat: number, lng: number) => {
      setLatitude(lat.toString());
      setLongitude(lng.toString());
      geocodeLocation(lat, lng);
      panMapTo(lat, lng);
      placeMarkerOnMap(lat, lng);
      toast.success('Location set from link');
    };

    // Try direct pattern match first (full Google Maps URLs)
    const direct = tryExtract(link);
    if (direct) { applyCoords(direct.lat, direct.lng); return; }

    // Short URL (maps.app.goo.gl etc.) — resolve via server-side proxy
    if (link.startsWith('http') && link.length > 15) {
      const toastId = toast.loading('Resolving link...');
      try {
        const res = await fetch(`/api/maps/resolve-link?url=${encodeURIComponent(link)}`);
        toast.dismiss(toastId);
        if (res.ok) {
          const data = await res.json();
          if (data.resolvedUrl) {
            const resolved = tryExtract(data.resolvedUrl);
            if (resolved) { applyCoords(resolved.lat, resolved.lng); return; }
          }
        }
        toast.error('Could not extract coordinates from link');
      } catch {
        toast.dismiss(toastId);
        toast.error('Failed to resolve link');
      }
    }
  };

  // Handle address search - combines Places Autocomplete (5) + Geocoder (5)
  const handleAddressSearch = (query: string) => {
    setAddressSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (!window.google) return;

      if (!autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      }

      setIsSearching(true);

      // Launch both requests in parallel
      const placesPromise = new Promise<typeof addressSuggestions>((resolve) => {
        autocompleteServiceRef.current!.getPlacePredictions(
          { input: query, types: ['address'], componentRestrictions: { country: 'pt' } },
          (predictions: any, status: any) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
              resolve(predictions.map((p: any) => ({
                id: p.place_id,
                description: p.description,
                source: 'places' as const,
                placeId: p.place_id,
              })));
            } else {
              resolve([]);
            }
          }
        );
      });

      const geocoderPromise = new Promise<typeof addressSuggestions>((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode(
          { address: query, region: 'PT', componentRestrictions: { country: 'PT' } },
          (results: any, status: any) => {
            if (status === 'OK' && results) {
              resolve(results.slice(0, 5).map((r: any, i: number) => ({
                id: `geo-${i}-${r.place_id || r.formatted_address}`,
                description: r.formatted_address,
                source: 'geocoder' as const,
                lat: r.geometry.location.lat(),
                lng: r.geometry.location.lng(),
              })));
            } else {
              resolve([]);
            }
          }
        );
      });

      Promise.all([placesPromise, geocoderPromise]).then(([placesResults, geocoderResults]) => {
        // Deduplicate by description
        const seen = new Set<string>();
        const combined = [...placesResults, ...geocoderResults].filter(r => {
          if (seen.has(r.description)) return false;
          seen.add(r.description);
          return true;
        });
        setAddressSuggestions(combined);
        setIsSearching(false);
      });
    }, 300);
  };

  const handleSelectAddress = (suggestion: typeof addressSuggestions[0]) => {
    if (!window.google) return;

    // Geocoder results already have coordinates
    if (suggestion.source === 'geocoder' && suggestion.lat !== undefined && suggestion.lng !== undefined) {
      setLatitude(suggestion.lat.toString());
      setLongitude(suggestion.lng.toString());
      setAddress(suggestion.description);
      setAddressSearchQuery(suggestion.description);
      setAddressSuggestions([]);
      panMapTo(suggestion.lat, suggestion.lng);
      placeMarkerOnMap(suggestion.lat, suggestion.lng);
      toast.success('Address selected');
      return;
    }

    // Places results need geocoding by placeId
    if (suggestion.placeId) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId: suggestion.placeId }, (results: any, status: any) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          setAddress(results[0].formatted_address);
          setAddressSearchQuery(suggestion.description);
          setAddressSuggestions([]);
          panMapTo(lat, lng);
          placeMarkerOnMap(lat, lng);
          toast.success('Address selected');
        } else {
          toast.error('Could not find coordinates for this address');
        }
      });
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle contact method
  const toggleContactMethod = (method: ContactMethod) => {
    const newMethods = new Set(selectedContactMethods);
    if (newMethods.has(method)) {
      newMethods.delete(method);
    } else {
      newMethods.add(method);
    }
    setSelectedContactMethods(newMethods);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!latitude || !longitude) {
      toast.error('Please select a location');
      return;
    }
    if (!houseName.trim()) {
      toast.error('Please enter a property name');
      return;
    }
    if (selectedContactMethods.size === 0) {
      toast.error('Please select at least one contact method');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('houseName', houseName);

      // Add contact methods (up to 4)
      const methodsArray = Array.from(selectedContactMethods);
      formData.append('contactMethod', methodsArray[0] || '');
      if (methodsArray[1]) formData.append('contactMethod2', methodsArray[1]);
      if (methodsArray[2]) formData.append('contactMethod3', methodsArray[2]);
      if (methodsArray[3]) formData.append('contactMethod4', methodsArray[3]);

      if (vendorName.trim()) formData.append('vendorName', vendorName);
      if (comments.trim()) formData.append('comments', comments);
      if (address.trim()) formData.append('streetAddress', address);
      if (responseStatus) formData.append('responseReceived', responseStatus);
      if (imageFile) formData.append('image', imageFile);

      const response = await fetch('/api/canvassingvisits', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create visit');
      }

      toast.success('Visit created successfully!');
      resetForm();
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating visit:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create visit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setLocationMethod('current');
    setLatitude('');
    setLongitude('');
    setAddress('');
    setHouseName('');
    setVendorName('');
    setSelectedContactMethods(new Set());
    setResponseStatus('');
    setComments('');
    setImageFile(null);
    setImagePreview('');
    setAddressSearchQuery('');
    setAddressSuggestions([]);
    if (mapMarkerRef.current) {
      mapMarkerRef.current.setMap(null);
      mapMarkerRef.current = null;
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  // Mini-map preview for panel mode
  const miniMapUrl = latitude && longitude
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=17&size=400x160&maptype=satellite&markers=color:0xD4A017%7C${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    : null;

  // In panel mode, 'map' method doesn't apply — fall back to 'search'
  const effectiveMethod = (isPanel && locationMethod === 'map') ? 'search' : locationMethod;

  // Panel mode: render inline (no overlay)
  if (isPanel) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D4A017] to-[#E6B52C] px-4 py-3 flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-black flex items-center gap-2">
            <MapPin size={18} />
            Drop Brochure
          </h2>
          <button onClick={handleClose} className="text-black hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Mini-map preview */}
        {miniMapUrl ? (
          <div className="relative flex-shrink-0 h-[160px]">
            <NextImage src={miniMapUrl} alt="Selected location" fill className="object-cover" sizes="400px" />
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-[11px] font-medium bg-black/60 backdrop-blur-sm rounded-lg px-2.5 py-1 truncate">
                📍 {address || `${parseFloat(latitude).toFixed(5)}, ${parseFloat(longitude).toFixed(5)}`}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[90px] bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 border-b border-[#2A2A2A]">
            <div className="text-center">
              <MapPin size={20} className="text-[#D4A017]/25 mx-auto mb-1" />
              <p className="text-gray-600 text-[11px]">Choose a location to see preview</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">

          {/* === LOCATION === */}
          <div className="space-y-2">

            {/* GPS pill — always visible, one-tap to use current location */}
            <button
              type="button"
              onClick={() => {
                setLocationMethod('current');
                if (userLocation) {
                  panMapTo(userLocation.lat, userLocation.lng);
                  placeMarkerOnMap(userLocation.lat, userLocation.lng);
                }
              }}
              className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs transition-all ${
                effectiveMethod === 'current'
                  ? 'bg-[#D4A017] text-black font-semibold shadow-md'
                  : 'bg-[#1A2A1A] text-green-400 border border-green-800/60 hover:border-green-500/60'
              }`}
            >
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${userLocation ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
              <Navigation size={11} className="flex-shrink-0" />
              <span>{userLocation ? 'Use my GPS location' : 'GPS unavailable'}</span>
              {userLocation && effectiveMethod !== 'current' && (
                <span className="ml-auto text-[10px] opacity-50 tabular-nums">
                  {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                </span>
              )}
              {effectiveMethod === 'current' && address && (
                <span className="ml-auto text-[10px] opacity-70 font-normal truncate max-w-[110px]">
                  {address.split(',')[0]}
                </span>
              )}
            </button>

            {/* Segmented tab: Search | Maps Link | Coords */}
            <div className="grid grid-cols-3 gap-0.5 bg-[#0D0D0D] p-0.5 rounded-xl">
              {([
                { value: 'search' as LocationMethod, icon: <Search size={11} />, label: 'Search' },
                { value: 'link'   as LocationMethod, icon: <LinkIcon size={11} />, label: 'Maps Link' },
                { value: 'manual' as LocationMethod, icon: <MapPin size={11} />, label: 'Coords' },
              ]).map(tab => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setLocationMethod(tab.value)}
                  className={`flex items-center justify-center gap-1 py-2 px-1 rounded-[10px] text-[11px] font-medium transition-all ${
                    effectiveMethod === tab.value
                      ? 'bg-[#D4A017] text-black shadow'
                      : 'text-gray-500 hover:text-gray-200'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Address Search */}
            {effectiveMethod === 'search' && (
              <div className="relative">
                <div className="relative flex items-center">
                  <Search size={13} className="absolute left-3 text-[#D4A017]/50 flex-shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search address in Portugal..."
                    value={addressSearchQuery}
                    onChange={(e) => handleAddressSearch(e.target.value)}
                    autoFocus
                    className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl pl-8 pr-8 py-2.5 focus:outline-none focus:border-[#D4A017] placeholder-gray-600"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-[#D4A017] border-t-transparent rounded-full" />
                    </div>
                  )}
                  {!isSearching && addressSearchQuery && (
                    <button
                      type="button"
                      onClick={() => { setAddressSearchQuery(''); setAddressSuggestions([]); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-300 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                {addressSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-[#252525] border border-[#383838] rounded-xl overflow-hidden shadow-2xl max-h-60 overflow-y-auto">
                    {addressSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectAddress(s)}
                        className="w-full text-left px-3 py-2.5 text-xs text-gray-200 hover:bg-[#D4A017]/15 transition-colors flex items-start gap-2 border-b border-[#333] last:border-0"
                      >
                        <MapPin size={11} className="text-[#D4A017] flex-shrink-0 mt-0.5" />
                        <span className="flex-1 leading-relaxed">{s.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Google Maps Link */}
            {effectiveMethod === 'link' && (
              <div className="space-y-1.5">
                <div className="relative flex items-center">
                  <LinkIcon size={13} className="absolute left-3 text-[#D4A017]/50 flex-shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Paste Google Maps link..."
                    autoFocus
                    onChange={(e) => handleGoogleMapsLink(e.target.value)}
                    className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:border-[#D4A017] placeholder-gray-600"
                  />
                </div>
                <p className="text-gray-600 text-[10px] px-1">
                  Google Maps → Share → Copy link → paste here
                </p>
              </div>
            )}

            {/* Manual Coordinates */}
            {effectiveMethod === 'manual' && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#D4A017]/60 font-bold pointer-events-none">LAT</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="39.9999"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl pl-9 pr-2 py-2.5 focus:outline-none focus:border-[#D4A017] placeholder-gray-700"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-[#D4A017]/60 font-bold pointer-events-none">LNG</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="-8.9999"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl pl-9 pr-2 py-2.5 focus:outline-none focus:border-[#D4A017] placeholder-gray-700"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-gray-600 text-[10px] px-1">Lat 36.96–42.15 · Lng -9.50–-6.19</p>
                  <button
                    type="button"
                    onClick={() => {
                      const lat = parseFloat(latitude);
                      const lng = parseFloat(longitude);
                      if (!isNaN(lat) && !isNaN(lng)) {
                        panMapTo(lat, lng);
                        geocodeLocation(lat, lng);
                        placeMarkerOnMap(lat, lng);
                      }
                    }}
                    disabled={!latitude || !longitude}
                    className="flex items-center gap-1 text-[11px] text-[#D4A017] bg-[#D4A017]/10 border border-[#D4A017]/30 px-2.5 py-1 rounded-lg hover:bg-[#D4A017]/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <MapPin size={10} />
                    Go
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Property name */}
          <input
            type="text"
            placeholder="Property Name *"
            value={houseName}
            onChange={(e) => setHouseName(e.target.value)}
            required
            className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#D4A017] placeholder-gray-600"
          />

          {/* Vendor */}
          <input
            type="text"
            placeholder="Vendor/Contact Name"
            value={vendorName}
            onChange={(e) => setVendorName(e.target.value)}
            className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#D4A017] placeholder-gray-600"
          />

          {/* Contact Methods */}
          <div>
            <p className="text-[#D4A017] text-[10px] font-bold uppercase tracking-wider mb-2">Contact Method(s) *</p>
            <div className="grid grid-cols-3 gap-1.5">
              {CONTACT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => toggleContactMethod(method.value)}
                  className={`py-2 px-1 rounded-xl text-xs transition-all text-center ${
                    selectedContactMethods.has(method.value)
                      ? 'bg-[#D4A017] text-black font-semibold'
                      : 'bg-[#222] border border-[#333] text-gray-300 hover:border-[#D4A017]/40'
                  }`}
                >
                  <div className="text-sm mb-0.5">{method.icon}</div>
                  <div className="leading-tight text-[10px]">{method.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Response */}
          <select
            value={responseStatus}
            onChange={(e) => setResponseStatus(e.target.value)}
            className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#D4A017]"
          >
            {RESPONSE_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>

          {/* Photo */}
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full h-28 object-cover rounded-xl border border-[#333]" />
              <button type="button" onClick={() => { setImageFile(null); setImagePreview(''); }}
                className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-full h-14 border border-dashed border-[#383838] rounded-xl cursor-pointer hover:border-[#D4A017]/60 transition-colors bg-[#1A1A1A]">
              <ImageIcon size={15} className="text-[#D4A017]/50 mr-2" />
              <span className="text-gray-600 text-xs">Upload photo (optional)</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}

          {/* Notes */}
          <textarea
            placeholder="Notes..."
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
            className="w-full bg-[#222] text-white text-sm border border-[#333] rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#D4A017] resize-none placeholder-gray-600"
          />

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#D4A017] to-[#E6B52C] text-black py-3 rounded-xl font-bold text-sm hover:from-[#E6B52C] hover:to-[#D4A017] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {isSubmitting
              ? (<><div className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />Creating...</>)
              : (<><MapPin size={16} />Drop Brochure</>)
            }
          </button>
        </form>
      </div>
    );
  }

  // Modal mode (original)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-[#2D2D2D] to-[#1E1E1E] rounded-2xl shadow-2xl border border-[#D4A017]/30 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-[#D4A017] to-[#E6B52C] p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold text-black flex items-center gap-2">
            <MapPin size={24} />
            Drop Brochure
          </h2>
          <button
            onClick={handleClose}
            className="text-black hover:text-white transition-colors p-1"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Location Section */}
          <div>
            <h3 className="text-[#D4A017] font-semibold mb-3 text-lg">Location</h3>
            <div className="space-y-3">
              {/* Location Method Radio Buttons */}
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 bg-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#2D2D2D] transition-colors">
                  <input
                    type="radio"
                    name="locationMethod"
                    value="current"
                    checked={locationMethod === 'current'}
                    onChange={(e) => setLocationMethod(e.target.value as LocationMethod)}
                    className="w-4 h-4 text-[#D4A017]"
                  />
                  <Navigation size={18} className="text-[#D4A017]" />
                  <span className="text-white">Use Current Location</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#2D2D2D] transition-colors">
                  <input
                    type="radio"
                    name="locationMethod"
                    value="map"
                    checked={locationMethod === 'map'}
                    onChange={(e) => {
                      setLocationMethod(e.target.value as LocationMethod);
                      handleSelectOnMap();
                    }}
                    className="w-4 h-4 text-[#D4A017]"
                  />
                  <MapPinned size={18} className="text-[#D4A017]" />
                  <span className="text-white">Select on Map</span>
                  {isSelectingOnMap && <span className="text-[#D4A017] text-sm animate-pulse">Click on map...</span>}
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#2D2D2D] transition-colors">
                  <input
                    type="radio"
                    name="locationMethod"
                    value="link"
                    checked={locationMethod === 'link'}
                    onChange={(e) => setLocationMethod(e.target.value as LocationMethod)}
                    className="w-4 h-4 text-[#D4A017]"
                  />
                  <LinkIcon size={18} className="text-[#D4A017]" />
                  <span className="text-white">Google Maps Link</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#2D2D2D] transition-colors">
                  <input
                    type="radio"
                    name="locationMethod"
                    value="manual"
                    checked={locationMethod === 'manual'}
                    onChange={(e) => setLocationMethod(e.target.value as LocationMethod)}
                    className="w-4 h-4 text-[#D4A017]"
                  />
                  <MapPin size={18} className="text-[#D4A017]" />
                  <span className="text-white">Manual Coordinates</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-[#1E1E1E] rounded-lg cursor-pointer hover:bg-[#2D2D2D] transition-colors">
                  <input
                    type="radio"
                    name="locationMethod"
                    value="search"
                    checked={locationMethod === 'search'}
                    onChange={(e) => setLocationMethod(e.target.value as LocationMethod)}
                    className="w-4 h-4 text-[#D4A017]"
                  />
                  <Search size={18} className="text-[#D4A017]" />
                  <span className="text-white">Search by Address</span>
                </label>
              </div>

              {/* Google Maps Link Input */}
              {locationMethod === 'link' && (
                <input
                  type="text"
                  placeholder="Paste Google Maps link here..."
                  onChange={(e) => handleGoogleMapsLink(e.target.value)}
                  className="w-full bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A017]"
                />
              )}

              {/* Manual Coordinates Input */}
              {locationMethod === 'manual' && (
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    step="any"
                    placeholder="Latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A017]"
                  />
                  <input
                    type="number"
                    step="any"
                    placeholder="Longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A017]"
                  />
                </div>
              )}

              {/* Address Search Input */}
              {locationMethod === 'search' && (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type an address..."
                      value={addressSearchQuery}
                      onChange={(e) => handleAddressSearch(e.target.value)}
                      className="w-full bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 pr-10 focus:outline-none focus:border-[#D4A017]"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin h-4 w-4 border-2 border-[#D4A017] border-t-transparent rounded-full" />
                      </div>
                    )}
                  </div>
                  {addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-[#2D2D2D] border border-[#D4A017]/30 rounded-lg overflow-hidden shadow-xl max-h-80 overflow-y-auto">
                      {addressSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => handleSelectAddress(suggestion)}
                          className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#D4A017]/20 transition-colors flex items-center gap-2 border-b border-[#D4A017]/10 last:border-b-0"
                        >
                          <MapPin size={14} className="text-[#D4A017] flex-shrink-0" />
                          <span className="flex-1">{suggestion.description}</span>
                          <span className="text-[10px] text-[#D4A017]/50 uppercase flex-shrink-0">{suggestion.source === 'places' ? 'Places' : 'Geo'}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Current Location Display */}
              {latitude && longitude && (
                <div className="bg-[#D4A017]/10 border border-[#D4A017]/30 rounded-lg p-3">
                  <p className="text-[#D4A017] text-sm font-medium mb-1">Current Location</p>
                  <p className="text-white text-sm">{address || `${latitude}, ${longitude}`}</p>
                </div>
              )}
            </div>
          </div>

          {/* Property Information */}
          <div>
            <h3 className="text-[#D4A017] font-semibold mb-3 text-lg flex items-center gap-2">
              <Home size={18} />
              Property Information
            </h3>
            <input
              type="text"
              placeholder="Property Name *"
              value={houseName}
              onChange={(e) => setHouseName(e.target.value)}
              required
              className="w-full bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A017]"
            />
          </div>

          {/* Visit Details */}
          <div>
            <h3 className="text-[#D4A017] font-semibold mb-3 text-lg flex items-center gap-2">
              <User size={18} />
              Visit Details
            </h3>
            <input
              type="text"
              placeholder="Vendor/Contact Name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              className="w-full bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A017]"
            />
          </div>

          {/* Contact Methods */}
          <div>
            <h3 className="text-[#D4A017] font-semibold mb-3 text-lg">Contact Method(s) *</h3>
            <div className="grid grid-cols-2 gap-3">
              {CONTACT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => toggleContactMethod(method.value)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedContactMethods.has(method.value)
                      ? 'bg-[#D4A017] border-[#D4A017] text-black font-semibold'
                      : 'bg-[#1E1E1E] border-[#D4A017]/30 text-white hover:border-[#D4A017]'
                  }`}
                >
                  <span className="mr-2">{method.icon}</span>
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Response Status */}
          <div>
            <h3 className="text-[#D4A017] font-semibold mb-3 text-lg flex items-center gap-2">
              <MessageSquare size={18} />
              Response Status
            </h3>
            <select
              value={responseStatus}
              onChange={(e) => setResponseStatus(e.target.value)}
              className="w-full bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A017]"
            >
              {RESPONSE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload */}
          <div>
            <h3 className="text-[#D4A017] font-semibold mb-3 text-lg flex items-center gap-2">
              <ImageIcon size={18} />
              Photo
            </h3>
            <div className="space-y-3">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border-2 border-[#D4A017]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-[#D4A017]/30 rounded-lg cursor-pointer hover:border-[#D4A017] transition-colors bg-[#1E1E1E]">
                  <ImageIcon size={32} className="text-[#D4A017] mb-2" />
                  <span className="text-white text-sm">Click to upload photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h3 className="text-[#D4A017] font-semibold mb-3 text-lg flex items-center gap-2">
              <MessageSquare size={18} />
              Comments
            </h3>
            <textarea
              placeholder="Add any notes or comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
              className="w-full bg-[#1E1E1E] text-white border border-[#D4A017]/30 rounded-lg px-4 py-3 focus:outline-none focus:border-[#D4A017] resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 bg-[#2D2D2D] text-white border border-[#D4A017]/30 py-3 rounded-lg font-semibold hover:bg-[#1E1E1E] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-[#D4A017] to-[#E6B52C] text-black py-3 rounded-lg font-semibold hover:from-[#E6B52C] hover:to-[#D4A017] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full"></div>
                  Creating...
                </>
              ) : (
                <>
                  <MapPin size={20} />
                  Drop Brochure
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
