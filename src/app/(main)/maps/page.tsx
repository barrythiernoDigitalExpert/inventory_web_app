'use client';

import { useEffect, useState, useRef } from 'react';
import { Calendar, Filter, MapPin, Users, Clock, MessageSquare, Image, ChevronDown, ChevronUp, Plus, Minus, Home, Maximize2, Navigation, Search } from 'lucide-react';
import AddVisitModal from '@/components/maps/AddVisitModal';

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

export default function Maps() {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [visits, setVisits] = useState<CanvassingVisit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null);
  const [markerClusterer, setMarkerClusterer] = useState<any>(null);
  
  // Filters
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [responseFilter, setResponseFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showLegend, setShowLegend] = useState(true);
  const [selectedCreators, setSelectedCreators] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isAddVisitModalOpen, setIsAddVisitModalOpen] = useState(false);

  // Color palette for different creators - highly distinct colors
  const userColors = [
    '#FF0000', // Bright Red
    '#00FF00', // Bright Green
    '#0000FF', // Bright Blue
    '#FFFF00', // Bright Yellow
    '#FF00FF', // Magenta
    '#00FFFF', // Cyan
    '#FF8000', // Orange
    '#8000FF', // Purple
    '#FF0080', // Hot Pink
    '#80FF00', // Lime Green
    '#0080FF', // Light Blue
    '#FF8080', // Light Red
    '#80FF80', // Light Green
    '#8080FF', // Light Blue Purple
    '#FFFF80', // Light Yellow
    '#FF80FF', // Light Magenta
    '#80FFFF', // Light Cyan
    '#C0C0C0', // Silver
    '#800000', // Dark Red
    '#008000', // Dark Green
    '#000080', // Dark Blue
    '#808000', // Olive
    '#800080', // Dark Purple
    '#008080', // Teal
    '#FFA500', // Orange
    '#A52A2A', // Brown
    '#DC143C', // Crimson
    '#228B22', // Forest Green
    '#4169E1', // Royal Blue
    '#F0E68C'  // Khaki
  ];

  const getUserColor = (userId: number) => {
    return userColors[userId % userColors.length];
  };

  useEffect(() => {
    // Load Google Maps API with MarkerClusterer
    const loadGoogleMapsAPI = () => {
      if (window.google) {
        setIsLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Load MarkerClusterer library
        const clustererScript = document.createElement('script');
        clustererScript.src = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
        clustererScript.onload = () => setIsLoaded(true);
        document.head.appendChild(clustererScript);
      };
      document.head.appendChild(script);
    };

    loadGoogleMapsAPI();
  }, []);

  useEffect(() => {
    if (isLoaded && !map) {
      const mapElement = document.getElementById('map');
      if (mapElement) {
        const newMap = new google.maps.Map(mapElement, {
          center: { lat: 39.5, lng: -8.0 }, // Portugal center - optimized
          zoom: 7, // Optimal zoom for Portugal overview
          mapTypeId: google.maps.MapTypeId.SATELLITE, // Default to satellite view
          styles: [
            {
              "featureType": "all",
              "elementType": "geometry.fill",
              "stylers": [{"color": "#1e1e1e"}]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.fill",
              "stylers": [{"color": "#ffffff"}]
            },
            {
              "featureType": "all",
              "elementType": "labels.text.stroke",
              "stylers": [{"color": "#1e1e1e"}]
            },
            {
              "featureType": "administrative",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#D4A017"}]
            },
            {
              "featureType": "road",
              "elementType": "geometry",
              "stylers": [{"color": "#2d2d2d"}]
            },
            {
              "featureType": "road",
              "elementType": "geometry.stroke",
              "stylers": [{"color": "#1e1e1e"}]
            },
            {
              "featureType": "water",
              "elementType": "geometry",
              "stylers": [{"color": "#0f4c75"}]
            }
          ]
        });
        setMap(newMap);
        
        const newInfoWindow = new google.maps.InfoWindow();
        setInfoWindow(newInfoWindow);
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
          console.log('Users fetched:', data.users);
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
    if (map) {
      console.log('Filters changed, fetching visits:', { selectedUserId, timeFilter, startDate, endDate, responseFilter });
      fetchVisits();
    }
  }, [map, selectedUserId, timeFilter, startDate, endDate, responseFilter]);

  // Update markers when creator selection changes
  useEffect(() => {
    if (map && visits.length > 0) {
      updateMapMarkers(visits);
    }
  }, [selectedCreators]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (event.key) {
        case '+':
        case '=':
          event.preventDefault();
          handleZoomIn();
          break;
        case '-':
          event.preventDefault();
          handleZoomOut();
          break;
        case 'r':
        case 'R':
          event.preventDefault();
          handleResetToPortugal();
          break;
        case ' ':
          event.preventDefault();
          toggleMapType();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [map, markers]);

  // Center map on Portugal when no visits are displayed
  useEffect(() => {
    if (map && visits.length === 0) {
      console.log('No visits, centering on Portugal');
      map.setCenter({ lat: 39.5, lng: -8.0 });
      map.setZoom(7);
    }
  }, [map, visits]);

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('forMap', 'true');
      params.set('limit', '1000');

      if (selectedUserId) {
        console.log('Setting userId filter:', selectedUserId);
        params.set('userId', selectedUserId);
      }

      // Calculate date range based on time filter
      const now = new Date();
      let calculatedStartDate = '';
      let calculatedEndDate = '';

      switch (timeFilter) {
        case 'today':
          calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
          calculatedEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
          console.log('Today filter:', { calculatedStartDate, calculatedEndDate });
          break;
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          calculatedStartDate = weekAgo.toISOString();
          calculatedEndDate = now.toISOString();
          console.log('Week filter:', { calculatedStartDate, calculatedEndDate });
          break;
        case 'month':
          const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          calculatedStartDate = monthAgo.toISOString();
          calculatedEndDate = now.toISOString();
          console.log('Month filter:', { calculatedStartDate, calculatedEndDate });
          break;
        case 'custom':
          calculatedStartDate = startDate ? new Date(startDate).toISOString() : '';
          calculatedEndDate = endDate ? new Date(endDate).toISOString() : '';
          console.log('Custom filter:', { calculatedStartDate, calculatedEndDate });
          break;
        default:
          console.log('No time filter applied');
      }

      if (calculatedStartDate) params.set('startDate', calculatedStartDate);
      if (calculatedEndDate) params.set('endDate', calculatedEndDate);
      
      if (responseFilter) {
        console.log('Setting response filter:', responseFilter);
        params.set('responseReceived', responseFilter);
      }

      const url = `/api/canvassingvisits/web?${params}`;
      console.log('Fetching visits from:', url);
      console.log('Filters:', { selectedUserId, timeFilter, startDate, endDate });

      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        console.log('Visits found:', data.data?.visits?.length || 0);
        
        if (data.success && data.data && data.data.visits) {
          console.log('Sample visit structure:', data.data.visits[0]);
          setVisits(data.data.visits);
          updateMapMarkers(data.data.visits);
        } else {
          console.warn('No visits data in response:', data);
          setVisits([]);
          updateMapMarkers([]);
        }
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
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

    // Clear existing markers and clusterer
    markers.forEach(marker => marker.setMap(null));
    if (markerClusterer) {
      markerClusterer.clearMarkers();
    }
    setMarkers([]);

    if (!Array.isArray(visitsData)) {
      console.error('visitsData is not an array:', visitsData);
      return;
    }

    const newMarkers: google.maps.Marker[] = [];

    visitsData.forEach((visit) => {
      if (!visit || !visit.latitude || !visit.longitude) {
        console.warn('Invalid visit data:', visit);
        return;
      }

      if (!visit.visitUsers || !Array.isArray(visit.visitUsers)) {
        console.warn('Visit has no visitUsers array:', visit);
        return;
      }

      const creatorUser = visit.visitUsers.find(u => u && u.isCreator);
      
      // Filter by selected creators if any are selected
      if (selectedCreators.size > 0 && creatorUser && !selectedCreators.has(creatorUser.userId)) {
        return;
      }
      
      const color = creatorUser ? getUserColor(creatorUser.userId) : '#D4A017';

      // Create custom drop pin marker icon with user color
      const markerIcon = {
        path: 'M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13C19,5.13 15.87,2 12,2z',
        fillColor: color,
        fillOpacity: 0.9,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        scale: 1.5,
        anchor: new google.maps.Point(12, 24)
      };

      const marker = new google.maps.Marker({
        position: { lat: visit.latitude, lng: visit.longitude },
        map: null, // Don't add to map yet, clusterer will handle this
        title: visit.houseName,
        icon: markerIcon,
      });

      // Create info window content
      const infoContent = createInfoWindowContent(visit);

      marker.addListener('click', () => {
        if (infoWindow) {
          infoWindow.setContent(infoContent);
          infoWindow.open(map, marker);
        }
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Create or update marker clusterer - simplified approach
    if (newMarkers.length > 0) {
      // Add markers directly to map for now
      newMarkers.forEach(marker => marker.setMap(map));
    }

    // Always center on Portugal regardless of markers
    if (newMarkers.length > 0) {
      // Force Portugal center and reasonable zoom
      map.setCenter({ lat: 39.5, lng: -8.0 });
      map.setZoom(7);
    } else {
      // If no visits, set a default view (Portugal)
      map.setCenter({ lat: 39.5, lng: -8.0 });
      map.setZoom(7);
    }
  };

  // Response type colors for info window borders
  const getResponseColor = (responseReceived: string | null) => {
    switch (responseReceived) {
      case 'positive':
        return '#22C55E'; // Green
      case 'negative':
        return '#EF4444'; // Red
      case 'no_response':
        return '#6B7280'; // Gray
      case 'pending':
        return '#F59E0B'; // Orange/Yellow
      default:
        return '#D4A017'; // Default gold
    }
  };

  const createInfoWindowContent = (visit: CanvassingVisit) => {
    if (!visit || !visit.visitUsers || !Array.isArray(visit.visitUsers)) {
      console.error('Invalid visit data in createInfoWindowContent:', visit);
      return '<div>Error: Invalid visit data</div>';
    }
    
    const creatorUser = visit.visitUsers.find(u => u && u.isCreator);
    const creatorColor = creatorUser ? getUserColor(creatorUser.userId) : '#D4A017';
    const responseColor = getResponseColor(visit.responseReceived);
    const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMkQyRDJEIi8+CjxwYXRoIGQ9Ik01MCAyNUM0MS43IDE1IDI1IDMxLjcgMjUgNTBTNDEuNyA4NSA1MCA4NVM3NSA2OC4zIDc1IDUwUzU4LjMgMjUgNTAgMjVaTTUwIDYwQzQ0LjUgNjAgNDAgNTUuNSA0MCA1MFM0NC41IDQwIDUwIDQwUzYwIDQ0LjUgNjAgNTBTNTUuNSA2MCA1MCA2MFoiIGZpbGw9IiNENEEwMTciLz4KPC9zdmc+';
    
    return `
      <div style="max-width: 600px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="background: linear-gradient(135deg, #2D2D2D 0%, #1E1E1E 100%); color: white; padding: 20px; margin: -8px; border-radius: 12px; border: 4px solid ${responseColor}; box-shadow: 0 0 20px ${responseColor}60;">
          <!-- Header with title and response indicator -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
            <div style="display: flex; align-items: center;">
              <div style="width: 16px; height: 16px; background-color: ${creatorColor}; border-radius: 50%; margin-right: 10px;"></div>
              <h3 style="margin: 0; color: #D4A017; font-size: 22px; font-weight: 600;">${visit.houseName}</h3>
            </div>
            ${visit.responseReceived ? `
            <div style="background-color: ${responseColor}; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
              ${visit.responseReceived}
            </div>` : ''}
          </div>
          
          <!-- Main content with image on left and info on right -->
          <div style="display: flex; gap: 20px;">
            <!-- Image section (left) -->
            <div style="flex-shrink: 0;">
              <img 
                src="${visit.imagePath || defaultImage}" 
                alt="Visit photo" 
                style="width: 200px; height: 200px; object-fit: cover; border-radius: 12px; border: 3px solid ${responseColor}; box-shadow: 0 4px 12px rgba(0,0,0,0.3);"
              >
            </div>
            
            <!-- Information section (right) -->
            <div style="flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 12px;">
              <div style="background-color: rgba(212, 160, 23, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #D4A017;">
                <span style="color: #D4A017; font-weight: 600; font-size: 14px;">👤 CREATOR</span>
                <div style="color: white; font-size: 16px; margin-top: 4px; font-weight: 500;">${creatorUser?.userName || creatorUser?.user?.name || 'Unknown'}</div>
              </div>
              
              <div style="background-color: rgba(212, 160, 23, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #D4A017;">
                <span style="color: #D4A017; font-weight: 600; font-size: 14px;">📞 CONTACT METHOD</span>
                <div style="color: white; font-size: 16px; margin-top: 4px; font-weight: 500;">${visit.contactMethod}</div>
              </div>
              
              <div style="background-color: rgba(212, 160, 23, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #D4A017;">
                <span style="color: #D4A017; font-weight: 600; font-size: 14px;">📅 VISIT DATE</span>
                <div style="color: white; font-size: 16px; margin-top: 4px; font-weight: 500;">${new Date(visit.createdAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          </div>
          
          <!-- Full width sections below -->
          ${visit.streetAddress ? `
          <div style="margin-top: 16px;">
            <div style="background-color: rgba(212, 160, 23, 0.1); padding: 12px; border-radius: 8px; border-left: 4px solid #D4A017;">
              <span style="color: #D4A017; font-weight: 600; font-size: 14px;">📍 ADDRESS</span>
              <div style="color: white; font-size: 16px; margin-top: 4px; font-weight: 500;">${visit.streetAddress}</div>
            </div>
          </div>` : ''}
          
          ${visit.comments ? `
          <div style="margin-top: 16px;">
            <div style="background-color: rgba(212, 160, 23, 0.1); padding: 16px; border-radius: 8px; border-left: 4px solid #D4A017;">
              <span style="color: #D4A017; font-weight: 600; font-size: 14px;">💬 NOTES</span>
              <div style="color: white; font-size: 15px; margin-top: 8px; line-height: 1.5; background-color: rgba(0,0,0,0.2); padding: 12px; border-radius: 6px;">${visit.comments}</div>
            </div>
          </div>` : ''}
        </div>
      </div>
    `;
  };

  const resetFilters = () => {
    setSelectedUserId('');
    setTimeFilter('all');
    setStartDate('');
    setEndDate('');
    setResponseFilter('');
  };

  // Navigation functions
  const handleZoomIn = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined) {
        map.setZoom(currentZoom + 1);
      }
    }
  };

  const handleZoomOut = () => {
    if (map) {
      const currentZoom = map.getZoom();
      if (currentZoom !== undefined) {
        map.setZoom(currentZoom - 1);
      }
    }
  };

  const handleResetToPortugal = () => {
    if (map) {
      map.setCenter({ lat: 39.5, lng: -8.0 });
      map.setZoom(7);
    }
  };

  const handleFitToMarkers = () => {
    if (map && markers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      markers.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      map.fitBounds(bounds);
      
      // Ensure reasonable zoom level
      const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 12) {
          map.setZoom(12);
        } else if (currentZoom && currentZoom < 6) {
          map.setZoom(6);
        }
        google.maps.event.removeListener(listener);
      });
    }
  };

  const handleMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(pos);
          if (map) {
            map.setCenter(pos);
            map.setZoom(12);
          }
        },
        () => {
          console.error('Error: The Geolocation service failed.');
        }
      );
    }
  };

  const handleSearch = async () => {
    if (!searchQuery || !map) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      { 
        address: searchQuery,
        region: 'PT' // Bias results to Portugal
      },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          map.setCenter(location);
          map.setZoom(12);
        } else {
          console.error('Geocoding failed:', status);
        }
      }
    );
  };

  const toggleMapType = () => {
    if (map) {
      const currentType = map.getMapTypeId();
      const newType = currentType === google.maps.MapTypeId.SATELLITE
        ? google.maps.MapTypeId.ROADMAP
        : google.maps.MapTypeId.SATELLITE;
      map.setMapTypeId(newType);
    }
  };

  // Handle visit creation success
  const handleVisitCreated = () => {
    fetchVisits(); // Refresh visits list
  };

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Filters */}
      <div className="bg-gradient-to-r from-[#2D2D2D] to-[#1E1E1E] p-4 shadow-lg border-b border-[#D4A017]/20">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#FFFFFF]">Visits Map</h1>
            <p className="text-[#D4A017] text-sm">
              {visits.length} visit{visits.length !== 1 ? 's' : ''} displayed
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Search Bar */}
            <div className="flex items-center bg-[#1E1E1E] border border-[#D4A017]/30 rounded-lg overflow-hidden">
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-transparent text-white px-3 py-2 focus:outline-none placeholder-gray-400 w-48"
              />
              <button
                onClick={handleSearch}
                className="bg-[#D4A017] text-black px-3 py-2 hover:bg-[#E6B52C] transition-colors"
              >
                <Search size={16} />
              </button>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-[#D4A017] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#E6B52C] transition-colors"
            >
              <Filter size={20} />
              Filters
            </button>

            {/* Add Visit Button */}
            <button
              onClick={() => setIsAddVisitModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-[#D4A017] to-[#E6B52C] text-black px-4 py-2 rounded-lg font-semibold hover:from-[#E6B52C] hover:to-[#D4A017] transition-all duration-300 shadow-lg hover:shadow-[#D4A017]/50"
            >
              <Plus size={20} />
              Drop Brochure
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-[#1E1E1E] rounded-lg p-4 border border-[#D4A017]/20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* User Filter */}
              <div>
                <label className="block text-[#D4A017] text-sm font-medium mb-2">
                  <Users size={16} className="inline mr-1" />
                  User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full bg-[#2D2D2D] text-white border border-[#D4A017]/30 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A017]"
                >
                  <option value="">All users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Filter */}
              <div>
                <label className="block text-[#D4A017] text-sm font-medium mb-2">
                  <Clock size={16} className="inline mr-1" />
                  Time Period
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-full bg-[#2D2D2D] text-white border border-[#D4A017]/30 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A017]"
                >
                  <option value="all">All dates</option>
                  <option value="today">Today</option>
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="custom">Custom period</option>
                </select>
              </div>

              {/* Response Filter */}
              <div>
                <label className="block text-[#D4A017] text-sm font-medium mb-2">
                  <MessageSquare size={16} className="inline mr-1" />
                  Response
                </label>
                <select
                  value={responseFilter}
                  onChange={(e) => setResponseFilter(e.target.value)}
                  className="w-full bg-[#2D2D2D] text-white border border-[#D4A017]/30 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A017]"
                >
                  <option value="">All responses</option>
                  <option value="positive">Positive</option>
                  <option value="negative">Negative</option>
                  <option value="no_response">No response</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {timeFilter === 'custom' && (
                <>
                  <div>
                    <label className="block text-[#D4A017] text-sm font-medium mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[#2D2D2D] text-white border border-[#D4A017]/30 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A017]"
                    />
                  </div>
                  <div>
                    <label className="block text-[#D4A017] text-sm font-medium mb-2">
                      <Calendar size={16} className="inline mr-1" />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[#2D2D2D] text-white border border-[#D4A017]/30 rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4A017]"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-between items-center mt-4">
              <button
                onClick={resetFilters}
                className="text-[#D4A017] hover:text-[#E6B52C] text-sm"
              >
                Reset filters
              </button>
              {loading && (
                <div className="flex items-center gap-2 text-[#D4A017]">
                  <div className="animate-spin h-4 w-4 border-2 border-[#D4A017] border-t-transparent rounded-full"></div>
                  Loading...
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {!isLoaded ? (
          <div className="flex justify-center items-center h-full bg-[#1E1E1E]">
            <div className="text-[#D4A017] text-center">
              <div className="animate-spin h-12 w-12 border-4 border-[#D4A017] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-[#FFFFFF]">Loading map...</p>
            </div>
          </div>
        ) : (
          <div id="map" className="w-full h-full"></div>
        )}
        
        {/* Navigation Controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {/* Zoom Controls - Same Line */}
          <div className="bg-[#2D2D2D]/95 backdrop-blur-sm rounded-lg border border-[#D4A017]/20 flex">
            <button
              onClick={handleZoomIn}
              className="p-3 text-[#D4A017] hover:text-[#E6B52C] hover:bg-[#D4A017]/10 transition-colors rounded-l-lg"
              title="Zoom In (+)"
            >
              <Plus size={20} />
            </button>
            <div className="border-l border-[#D4A017]/20"></div>
            <button
              onClick={handleZoomOut}
              className="p-3 text-[#D4A017] hover:text-[#E6B52C] hover:bg-[#D4A017]/10 transition-colors rounded-r-lg"
              title="Zoom Out (-)"
            >
              <Minus size={20} />
            </button>
          </div>

          {/* Navigation Buttons */}
          <div className="bg-[#2D2D2D]/95 backdrop-blur-sm rounded-lg border border-[#D4A017]/20 flex flex-col gap-1 p-2">
            <button
              onClick={handleResetToPortugal}
              className="p-2 text-[#D4A017] hover:text-[#E6B52C] hover:bg-[#D4A017]/10 transition-colors rounded-lg"
              title="Reset to Portugal (R)"
            >
              <Home size={18} />
            </button>
            <button
              onClick={toggleMapType}
              className="p-2 text-[#D4A017] hover:text-[#E6B52C] hover:bg-[#D4A017]/10 transition-colors rounded-lg"
              title="Toggle Map Type (Space)"
            >
              <MapPin size={18} />
            </button>
          </div>
        </div>
        
        {/* Left Side Panel - Legend and Shortcuts */}
        {visits.length > 0 && (
          <div className="absolute top-20 left-4 flex flex-col gap-2">
            {/* Creator Legend */}
            <div className="bg-[#2D2D2D]/95 backdrop-blur-sm rounded-lg border border-[#D4A017]/20 max-w-xs">
              <div className="p-4">
                <div 
                  className="flex items-center justify-between cursor-pointer hover:bg-[#D4A017]/10 rounded-lg p-2 -m-2 transition-colors"
                  onClick={() => setShowLegend(!showLegend)}
                >
                  <h3 className="text-[#D4A017] font-medium flex items-center gap-2">
                    <MapPin size={16} />
                    Creators Legend
                  </h3>
                  <button className="text-[#D4A017] hover:text-[#E6B52C] transition-colors">
                    {showLegend ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
                
                {showLegend && (
                  <div className="mt-3">
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {visits.filter(v => v && v.visitUsers && Array.isArray(v.visitUsers))
                        .map(v => v.visitUsers.find(u => u && u.isCreator))
                        .filter(Boolean)
                        .filter((user, index, array) => array.findIndex(u => u?.userId === user?.userId) === index)
                        .map((user) => {
                          if (!user) return null;
                          const isSelected = selectedCreators.has(user.userId);
                          return (
                            <div 
                              key={user.userId} 
                              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#D4A017]/10 cursor-pointer transition-colors"
                              onClick={() => {
                                const newSelected = new Set(selectedCreators);
                                if (isSelected) {
                                  newSelected.delete(user.userId);
                                } else {
                                  newSelected.add(user.userId);
                                }
                                setSelectedCreators(newSelected);
                              }}
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}} // Handled by parent div onClick
                                  className="w-4 h-4 text-[#D4A017] bg-[#1E1E1E] border-[#D4A017]/30 rounded focus:ring-[#D4A017] focus:ring-2"
                                />
                                <div 
                                  className="w-3 h-3 rounded-full border-2 border-white"
                                  style={{ backgroundColor: getUserColor(user.userId) }}
                                ></div>
                                <span className="text-white text-sm">{user.userName || user.user?.name}</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                    
                    {/* Filter controls */}
                    <div className="mt-3 pt-3 border-t border-[#D4A017]/20 flex gap-2">
                      <button
                        onClick={() => {
                          const allCreators = new Set(
                            visits.filter(v => v && v.visitUsers && Array.isArray(v.visitUsers))
                              .map(v => v.visitUsers.find(u => u && u.isCreator))
                              .filter(Boolean)
                              .map(u => u!.userId)
                          );
                          setSelectedCreators(allCreators);
                        }}
                        className="flex-1 text-xs bg-[#D4A017] text-black px-2 py-1 rounded hover:bg-[#E6B52C] transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedCreators(new Set())}
                        className="flex-1 text-xs bg-[#2D2D2D] text-[#D4A017] border border-[#D4A017]/30 px-2 py-1 rounded hover:bg-[#D4A017]/10 transition-colors"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Keyboard Shortcuts Help */}
            <div 
              className={`bg-[#2D2D2D]/95 backdrop-blur-sm rounded-lg border border-[#D4A017]/20 p-3 text-xs text-[#D4A017] transition-all duration-300 ${
                showLegend ? 'transform translate-y-0' : 'transform -translate-y-2'
              }`}
            >
              <div className="font-semibold mb-2 text-[#D4A017]">Keyboard Shortcuts:</div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-300">+/-</span>
                  <span>Zoom</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">R</span>
                  <span>Reset</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Space</span>
                  <span>Toggle</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Visit FAB (Floating Action Button) */}
        <div className="absolute bottom-4 left-4">
          <button
            onClick={() => setIsAddVisitModalOpen(true)}
            className="bg-gradient-to-r from-[#D4A017] to-[#E6B52C] text-black p-4 rounded-full shadow-2xl hover:shadow-[#D4A017]/50 hover:scale-110 transition-all duration-300 flex items-center gap-2 group"
            title="Add Visit"
          >
            <Plus size={24} />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap font-semibold">
              Drop Brochure
            </span>
          </button>
        </div>
      </div>

      {/* Add Visit Modal */}
      <AddVisitModal
        isOpen={isAddVisitModalOpen}
        onClose={() => setIsAddVisitModalOpen(false)}
        onSuccess={handleVisitCreated}
        userLocation={userLocation}
        map={map}
      />
    </div>
  );
}