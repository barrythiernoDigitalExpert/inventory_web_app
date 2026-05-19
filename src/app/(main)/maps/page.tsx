'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import NextImage from 'next/image';
import { Calendar, Filter, MapPin, Users, Clock, MessageSquare, Plus, Minus, Home, Search, X, Eye, Layers } from 'lucide-react';
import toast from 'react-hot-toast';

// Chargement différé — réduit le bundle initial de la page carte
const AddVisitPanel = dynamic(() => import('@/components/maps/AddVisitModal'), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#1E1E1E] rounded-xl p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[#D4A017] mx-auto" />
      </div>
    </div>
  ),
});

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CanvassingVisit {
  id: string;
  latitude: number;
  longitude: number;
  houseName: string;
  contactMethod: string;
  responseReceived: string | null;
  createdAt: string;
  comments?: string;
  imagePath?: string;
  streetAddress?: string;
  neighborhood?: string;
  city?: string;
  visitUsers: Array<{
    id: number;
    visitId: string;
    userId: number;
    userName: string;
    isCreator: boolean;
    user?: {
      id: number;
      name: string;
      email: string;
    };
  }>;
  userNames?: string;
}

// 12 maximally distinct colors for cartographic use
const USER_COLORS = [
  '#EE3333', // 0  Rouge
  '#2255FF', // 1  Bleu roi
  '#22BB44', // 2  Vert
  '#FF8800', // 3  Orange
  '#9922CC', // 4  Violet
  '#00BBDD', // 5  Cyan
  '#FF1188', // 6  Rose vif
  '#FFCC00', // 7  Jaune
  '#AAEE00', // 8  Lime
  '#333333', // 9  Gris foncé (noir)
  '#009988', // 10 Teal
  '#996633', // 11 Brun
];

// Color map built dynamically from creator order in the loaded visits (no modulo collisions)
const buildCreatorColorMap = (visitsData: CanvassingVisit[]): Map<number, string> => {
  const map = new Map<number, string>();
  let index = 0;
  visitsData.forEach(v => {
    const creator = v.visitUsers?.find(u => u?.isCreator);
    if (creator && !map.has(creator.userId)) {
      map.set(creator.userId, USER_COLORS[index % USER_COLORS.length]);
      index++;
    }
  });
  return map;
};

const getResponseColor = (responseReceived: string | null) => {
  switch (responseReceived) {
    case 'positive': return '#22C55E';
    case 'negative': return '#EF4444';
    case 'no_response': return '#6B7280';
    case 'pending': return '#F59E0B';
    default: return '#D4A017';
  }
};

type PanelMode = 'none' | 'detail' | 'add' | 'legend';

export default function Maps() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [visits, setVisits] = useState<CanvassingVisit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [markerClusterer, setMarkerClusterer] = useState<any>(null);
  const [creatorColorMap, setCreatorColorMap] = useState<Map<number, string>>(new Map());

  // Filters
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [responseFilter, setResponseFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCreators, setSelectedCreators] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

  // Panel state - unified
  const [panelMode, setPanelMode] = useState<PanelMode>('legend');
  const [selectedVisit, setSelectedVisit] = useState<CanvassingVisit | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [updatingResponse, setUpdatingResponse] = useState(false);

  const isPanelOpen = panelMode !== 'none';

  // Load Google Maps API
  useEffect(() => {
    const loadGoogleMapsAPI = () => {
      if (window.google) {
        setIsLoaded(true);
        return;
      }
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => setIsLoaded(true));
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const existingClustererScript = document.querySelector('script[src*="markerclusterer"]');
        if (!existingClustererScript) {
          const clustererScript = document.createElement('script');
          clustererScript.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
          clustererScript.onload = () => setIsLoaded(true);
          document.head.appendChild(clustererScript);
        } else {
          setIsLoaded(true);
        }
      };
      document.head.appendChild(script);
    };
    loadGoogleMapsAPI();
  }, []);

  // Initialize map
  useEffect(() => {
    if (isLoaded && !map) {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const newMap = new google.maps.Map(mapElement, {
          center: { lat: 39.5, lng: -8.0 },
          zoom: 7,
          mapTypeId: google.maps.MapTypeId.SATELLITE,
          disableDefaultUI: true,
          zoomControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          streetViewControl: false,
          styles: [
            { "featureType": "all", "elementType": "geometry.fill", "stylers": [{"color": "#1e1e1e"}] },
            { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{"color": "#ffffff"}] },
            { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{"color": "#1e1e1e"}] },
            { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{"color": "#D4A017"}] },
            { "featureType": "road", "elementType": "geometry", "stylers": [{"color": "#2d2d2d"}] },
            { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{"color": "#1e1e1e"}] },
            { "featureType": "water", "elementType": "geometry", "stylers": [{"color": "#0f4c75"}] }
          ]
        });
        setMap(newMap);
      }
    }
  }, [isLoaded]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data.users);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  // Fetch visits when filters change
  useEffect(() => {
    if (map) fetchVisits();
  }, [map, selectedUserId, timeFilter, startDate, endDate, responseFilter]);

  // Update markers when creator selection changes
  useEffect(() => {
    if (map && visits.length > 0) updateMapMarkers(visits);
  }, [selectedCreators]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      switch (event.key) {
        case '+': case '=': event.preventDefault(); handleZoomIn(); break;
        case '-': event.preventDefault(); handleZoomOut(); break;
        case 'r': case 'R': event.preventDefault(); handleResetToPortugal(); break;
        case 'Escape': setPanelMode('legend'); setSelectedVisit(null); break;
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [map, markers]);

  // Center on Portugal when no visits
  useEffect(() => {
    if (map && visits.length === 0) {
      map.setCenter({ lat: 39.5, lng: -8.0 });
      map.setZoom(7);
    }
  }, [map, visits]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => console.error('Error getting user location:', error)
      );
    }
  }, []);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('forMap', 'true');
      params.set('limit', '1000');
      if (selectedUserId) params.set('userId', selectedUserId);

      const now = new Date();
      let calculatedStartDate = '';
      let calculatedEndDate = '';
      switch (timeFilter) {
        case 'today':
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
          break;
        case 'week':
          calculatedStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          calculatedEndDate = now.toISOString();
          break;
        case 'month':
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString();
          calculatedEndDate = now.toISOString();
          break;
        case 'custom':
          calculatedStartDate = startDate ? new Date(startDate).toISOString() : '';
          calculatedEndDate = endDate ? new Date(endDate).toISOString() : '';
          break;
      }
      if (calculatedStartDate) params.set('startDate', calculatedStartDate);
      if (calculatedEndDate) params.set('endDate', calculatedEndDate);
      if (responseFilter) params.set('responseReceived', responseFilter);

      const response = await fetch(`/api/canvassingvisits/web?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.visits) {
          setVisits(data.data.visits);
          updateMapMarkers(data.data.visits);
        } else {
          setVisits([]);
          updateMapMarkers([]);
        }
      } else {
        setVisits([]);
        updateMapMarkers([]);
      }
    } catch (error) {
      console.error('Error fetching visits:', error);
      setVisits([]);
      updateMapMarkers([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (visitsData: CanvassingVisit[]) => {
    if (!map) return;
    markers.forEach(marker => marker.setMap(null));
    if (markerClusterer) markerClusterer.clearMarkers();
    setMarkers([]);
    if (!Array.isArray(visitsData)) return;

    const colorMap = buildCreatorColorMap(visitsData);
    setCreatorColorMap(colorMap);

    const newMarkers: google.maps.Marker[] = [];
    visitsData.forEach((visit) => {
      if (!visit?.latitude || !visit?.longitude || !Array.isArray(visit.visitUsers)) return;
      const creatorUser = visit.visitUsers.find(u => u?.isCreator);
      if (selectedCreators.size > 0 && creatorUser && !selectedCreators.has(creatorUser.userId)) return;
      const color = creatorUser ? (colorMap.get(creatorUser.userId) ?? '#D4A017') : '#D4A017';

      const marker = new google.maps.Marker({
        position: { lat: visit.latitude, lng: visit.longitude },
        map: null,
        title: visit.houseName,
        icon: {
          path: 'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2z',
          fillColor: color,
          fillOpacity: 0.9,
          strokeWeight: 2,
          strokeColor: '#FFFFFF',
          scale: 1.5,
          anchor: new google.maps.Point(12, 24)
        },
      });

      marker.addListener('click', () => {
        setSelectedVisit(visit);
        setPanelMode('detail');
        setShowLightbox(false);
        // Center map on the marker with slight offset for panel
        if (map) {
          map.panTo({ lat: visit.latitude, lng: visit.longitude });
          const currentZoom = map.getZoom();
          if (currentZoom && currentZoom < 14) map.setZoom(14);
        }
        // Bounce animation
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1400);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);
    newMarkers.forEach(marker => marker.setMap(map));

    if (newMarkers.length > 0 && selectedCreators.size > 0) {
      // Fit map to show only the filtered markers
      const bounds = new google.maps.LatLngBounds();
      newMarkers.forEach(marker => {
        const pos = marker.getPosition();
        if (pos) bounds.extend(pos);
      });
      map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
      // Cap zoom at a reasonable level
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const z = map.getZoom();
        if (z && z > 16) map.setZoom(16);
      });
    } else if (newMarkers.length > 0) {
      // Default: Portugal overview
      map.setCenter({ lat: 39.5, lng: -8.0 });
      map.setZoom(7);
    }
  };

  const handleUpdateResponse = async (visitId: string, newResponse: string) => {
    setUpdatingResponse(true);
    try {
      const response = await fetch(`/api/canvassingvisits/${visitId}/response/web`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseReceived: newResponse || null }),
      });
      if (response.ok) {
        toast.success('Response updated');
        if (selectedVisit) setSelectedVisit({ ...selectedVisit, responseReceived: newResponse || null });
        setVisits(prev => prev.map(v => v.id === visitId ? { ...v, responseReceived: newResponse || null } : v));
        fetchVisits();
      } else {
        toast.error('Failed to update response');
      }
    } catch {
      toast.error('Failed to update response');
    } finally {
      setUpdatingResponse(false);
    }
  };

  const resetFilters = () => {
    setSelectedUserId('');
    setTimeFilter('all');
    setStartDate('');
    setEndDate('');
    setResponseFilter('');
  };

  const handleZoomIn = () => { if (map) { const z = map.getZoom(); if (z !== undefined) map.setZoom(z + 1); } };
  const handleZoomOut = () => { if (map) { const z = map.getZoom(); if (z !== undefined) map.setZoom(z - 1); } };
  const handleResetToPortugal = () => { if (map) { map.setCenter({ lat: 39.5, lng: -8.0 }); map.setZoom(7); } };
  const toggleMapType = () => {
    if (map) {
      const current = map.getMapTypeId();
      map.setMapTypeId(current === google.maps.MapTypeId.SATELLITE ? google.maps.MapTypeId.ROADMAP : google.maps.MapTypeId.SATELLITE);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery || !map) return;
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery, region: 'PT' }, (results: any, status: any) => {
      if (status === 'OK' && results?.[0]) {
        map.setCenter(results[0].geometry.location);
        map.setZoom(14);
      }
    });
  };

  const handleVisitCreated = () => {
    fetchVisits();
    setPanelMode('legend');
  };

  const handleOpenAddPanel = () => {
    setSelectedVisit(null);
    setPanelMode('add');
  };

  const handleClosePanel = () => {
    setPanelMode('legend');
    setSelectedVisit(null);
  };

  // Unique creators for legend
  const uniqueCreators = visits
    .filter(v => v?.visitUsers && Array.isArray(v.visitUsers))
    .map(v => v.visitUsers.find(u => u?.isCreator))
    .filter(Boolean)
    .filter((user, index, array) => array.findIndex(u => u?.userId === user?.userId) === index);

  return (
    <div className="h-full flex flex-col bg-[#121212]">
      {/* Header */}
      <div className="bg-[#1A1A1A] px-4 py-3 shadow-lg border-b border-[#D4A017]/20 z-30">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-white">Visits Map</h1>
              <p className="text-[#D4A017] text-xs">
                {visits.length} visit{visits.length !== 1 ? 's' : ''}
                {loading && <span className="ml-2 animate-pulse">Loading...</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center bg-[#2D2D2D] border border-[#333] rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-transparent text-white px-3 py-2 focus:outline-none placeholder-gray-500 w-44 text-sm"
              />
              <button onClick={handleSearch} className="bg-[#D4A017] text-black px-3 py-2 hover:bg-[#E6B52C] transition-colors">
                <Search size={14} />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${showFilters ? 'bg-[#D4A017] text-black' : 'bg-[#2D2D2D] text-[#D4A017] border border-[#333]'}`}
            >
              <Filter size={14} />
              Filters
            </button>

            <button
              onClick={handleOpenAddPanel}
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#D4A017] to-[#E6B52C] text-black px-4 py-2 rounded-lg text-sm font-semibold hover:from-[#E6B52C] hover:to-[#D4A017] transition-all shadow-lg"
            >
              <Plus size={16} />
              Drop Brochure
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 bg-[#222] rounded-lg p-3 border border-[#333]">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className="block text-[#D4A017] text-xs font-medium mb-1"><Users size={12} className="inline mr-1" />User</label>
                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="w-full bg-[#2D2D2D] text-white text-sm border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-[#D4A017]">
                  <option value="">All users</option>
                  {users.map((user) => (<option key={user.id} value={user.id}>{user.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-[#D4A017] text-xs font-medium mb-1"><Clock size={12} className="inline mr-1" />Period</label>
                <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} className="w-full bg-[#2D2D2D] text-white text-sm border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-[#D4A017]">
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div>
                <label className="block text-[#D4A017] text-xs font-medium mb-1"><MessageSquare size={12} className="inline mr-1" />Response</label>
                <select value={responseFilter} onChange={(e) => setResponseFilter(e.target.value)} className="w-full bg-[#2D2D2D] text-white text-sm border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-[#D4A017]">
                  <option value="">All</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="no_response">No response</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              {timeFilter === 'custom' && (
                <>
                  <div>
                    <label className="block text-[#D4A017] text-xs font-medium mb-1"><Calendar size={12} className="inline mr-1" />Start</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-[#2D2D2D] text-white text-sm border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-[#D4A017]" />
                  </div>
                  <div>
                    <label className="block text-[#D4A017] text-xs font-medium mb-1"><Calendar size={12} className="inline mr-1" />End</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-[#2D2D2D] text-white text-sm border border-[#444] rounded px-2 py-1.5 focus:outline-none focus:border-[#D4A017]" />
                  </div>
                </>
              )}
            </div>
            <button onClick={resetFilters} className="text-[#D4A017] hover:text-[#E6B52C] text-xs mt-2">Reset filters</button>
          </div>
        )}
      </div>

      {/* Main content: Panel + Map side by side */}
      <div className="flex-1 flex relative overflow-hidden">

        {/* Left Panel */}
        <div className={`bg-[#1A1A1A] border-r border-[#333] overflow-y-auto transition-all duration-300 ease-in-out flex-shrink-0 ${isPanelOpen ? 'w-[400px]' : 'w-0'}`}>
          <div className={`w-[400px] h-full ${isPanelOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>

            {/* DETAIL MODE */}
            {panelMode === 'detail' && selectedVisit && (() => {
              const creatorUser = selectedVisit.visitUsers?.find(u => u?.isCreator);
              const creatorColor = creatorUser ? (creatorColorMap.get(creatorUser.userId) ?? '#D4A017') : '#D4A017';
              const responseColor = getResponseColor(selectedVisit.responseReceived);
              const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${selectedVisit.latitude},${selectedVisit.longitude}&zoom=18&size=400x180&maptype=satellite&markers=color:0xD4A017%7C${selectedVisit.latitude},${selectedVisit.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;

              return (
                <div className="flex flex-col">
                  {/* Close */}
                  <button onClick={handleClosePanel} className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 rounded-full text-white hover:text-[#D4A017] transition-colors">
                    <X size={16} />
                  </button>

                  {/* Mini-map satellite */}
                  <div className="relative h-[180px]">
                    <NextImage src={staticMapUrl} alt="Location satellite view" fill className="object-cover" sizes="400px" />
                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#1A1A1A] to-transparent" />
                  </div>

                  {/* Visit photo */}
                  {selectedVisit.imagePath && (
                    <div className="px-4 -mt-4 relative z-10">
                      <div className="relative h-48 rounded-xl overflow-hidden cursor-pointer group shadow-xl border-2 border-[#333]" onClick={() => setShowLightbox(true)}>
                        <NextImage src={selectedVisit.imagePath} alt="Visit photo" fill className="object-cover" sizes="400px" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                          <Eye size={28} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 ring-2 ring-white/80" style={{ backgroundColor: creatorColor }} />
                        <h2 className="text-lg font-bold text-white truncate">{selectedVisit.houseName}</h2>
                      </div>
                      {selectedVisit.responseReceived && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase text-white flex-shrink-0 tracking-wide" style={{ backgroundColor: responseColor }}>
                          {selectedVisit.responseReceived.replace('_', ' ')}
                        </span>
                      )}
                    </div>

                    {/* Info grid */}
                    <div className="space-y-2">
                      <InfoCard label="Creator" value={creatorUser?.userName || creatorUser?.user?.name || 'Unknown'} />
                      <InfoCard label="Contact" value={selectedVisit.contactMethod} />
                      <InfoCard label="Date" value={new Date(selectedVisit.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} />
                      {selectedVisit.streetAddress && <InfoCard label="Address" value={selectedVisit.streetAddress} />}
                    </div>

                    {/* Notes */}
                    {selectedVisit.comments && (
                      <div>
                        <span className="text-[#D4A017] text-[10px] font-bold uppercase tracking-wider">Notes</span>
                        <p className="text-gray-300 mt-1.5 text-sm bg-[#222] p-3 rounded-lg leading-relaxed border border-[#333]">{selectedVisit.comments}</p>
                      </div>
                    )}

                    {/* Response update */}
                    <div className="border-t border-[#333] pt-3">
                      <label className="text-[#D4A017] text-[10px] font-bold uppercase tracking-wider block mb-1.5">Update Response</label>
                      <select
                        value={selectedVisit.responseReceived || ''}
                        onChange={(e) => handleUpdateResponse(selectedVisit.id, e.target.value)}
                        disabled={updatingResponse}
                        className="w-full bg-[#222] text-white text-sm border border-[#444] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A017] disabled:opacity-50"
                      >
                        <option value="">No Response</option>
                        <option value="pending">Pending</option>
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="no_response">No Response</option>
                      </select>
                      {updatingResponse && (
                        <div className="flex items-center gap-2 mt-1.5 text-[#D4A017] text-xs">
                          <div className="animate-spin h-3 w-3 border-2 border-[#D4A017] border-t-transparent rounded-full" />
                          Updating...
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-gray-600 pt-1">
                      {selectedVisit.latitude.toFixed(6)}, {selectedVisit.longitude.toFixed(6)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* ADD MODE */}
            {panelMode === 'add' && (
              <AddVisitPanel
                isOpen={true}
                onClose={handleClosePanel}
                onSuccess={handleVisitCreated}
                userLocation={userLocation}
                map={map}
                isPanel={true}
              />
            )}

            {/* LEGEND MODE */}
            {panelMode === 'legend' && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#D4A017] font-semibold text-sm flex items-center gap-2">
                    <MapPin size={14} />
                    Creators ({uniqueCreators.length})
                  </h3>
                </div>

                <div className="space-y-1">
                  {uniqueCreators.map((user) => {
                    if (!user) return null;
                    const isSelected = selectedCreators.has(user.userId);
                    return (
                      <div
                        key={user.userId}
                        className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-[#D4A017]/15 border border-[#D4A017]/30' : 'hover:bg-[#222] border border-transparent'}`}
                        onClick={() => {
                          const newSelected = new Set(selectedCreators);
                          if (isSelected) newSelected.delete(user.userId); else newSelected.add(user.userId);
                          setSelectedCreators(newSelected);
                        }}
                      >
                        <input type="checkbox" checked={isSelected} onChange={() => {}} className="w-3.5 h-3.5 rounded accent-[#D4A017]" />
                        <div className="w-4 h-4 rounded-full ring-2 ring-white/70" style={{ backgroundColor: creatorColorMap.get(user.userId) ?? '#D4A017' }} />
                        <span className="text-white text-sm flex-1">{user.userName || user.user?.name}</span>
                        <span className="text-gray-500 text-xs">
                          {visits.filter(v => v.visitUsers?.some(u => u.userId === user.userId && u.isCreator)).length}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {uniqueCreators.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#333] flex gap-2">
                    <button
                      onClick={() => {
                        const allCreators = new Set(uniqueCreators.filter(Boolean).map(u => u!.userId));
                        setSelectedCreators(allCreators);
                      }}
                      className="flex-1 text-xs bg-[#D4A017] text-black px-2 py-1.5 rounded font-medium hover:bg-[#E6B52C] transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedCreators(new Set())}
                      className="flex-1 text-xs bg-[#222] text-[#D4A017] border border-[#444] px-2 py-1.5 rounded hover:bg-[#333] transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          {!isLoaded ? (
            <div className="flex justify-center items-center h-full bg-[#121212]">
              <div className="text-center">
                <div className="animate-spin h-10 w-10 border-3 border-[#D4A017] border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-400 text-sm">Loading map...</p>
              </div>
            </div>
          ) : (
            <div id="map" className="w-full h-full"></div>
          )}

          {/* Map Controls - bottom right */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
            <div className="bg-[#1A1A1A]/90 backdrop-blur rounded-lg border border-[#333] flex">
              <button onClick={handleZoomIn} className="p-2.5 text-white hover:text-[#D4A017] transition-colors" title="Zoom In"><Plus size={16} /></button>
              <div className="border-l border-[#333]" />
              <button onClick={handleZoomOut} className="p-2.5 text-white hover:text-[#D4A017] transition-colors" title="Zoom Out"><Minus size={16} /></button>
            </div>
            <div className="bg-[#1A1A1A]/90 backdrop-blur rounded-lg border border-[#333] flex flex-col">
              <button onClick={handleResetToPortugal} className="p-2.5 text-white hover:text-[#D4A017] transition-colors" title="Reset view"><Home size={14} /></button>
              <div className="border-t border-[#333]" />
              <button onClick={toggleMapType} className="p-2.5 text-white hover:text-[#D4A017] transition-colors" title="Toggle map type"><Layers size={14} /></button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && selectedVisit?.imagePath && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center cursor-pointer" onClick={() => setShowLightbox(false)}>
          <button onClick={() => setShowLightbox(false)} className="absolute top-6 right-6 text-white hover:text-[#D4A017] transition-colors"><X size={28} /></button>
          <div className="relative max-w-[90vw] max-h-[90vh] w-[900px] h-[675px]" onClick={(e) => e.stopPropagation()}>
            <NextImage src={selectedVisit.imagePath} alt="Visit photo" fill className="object-contain rounded-lg" sizes="90vw" />
          </div>
        </div>
      )}
    </div>
  );
}

// Small reusable info card component
function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-[#222] last:border-0">
      <span className="text-[#D4A017] text-[10px] font-bold uppercase tracking-wider w-16 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-white text-sm">{value}</span>
    </div>
  );
}
