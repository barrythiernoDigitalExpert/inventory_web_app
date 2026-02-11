'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Home, User, MessageSquare, Image as ImageIcon, Navigation, Link as LinkIcon, MapPinned } from 'lucide-react';
import toast from 'react-hot-toast';

interface AddVisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userLocation: { lat: number; lng: number } | null;
  map: google.maps.Map | null;
}

type LocationMethod = 'current' | 'map' | 'link' | 'manual';
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

export default function AddVisitModal({ isOpen, onClose, onSuccess, userLocation, map }: AddVisitModalProps) {
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
  const [mapMarker, setMapMarker] = useState<google.maps.Marker | null>(null);

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

  // Handle map selection
  const handleSelectOnMap = () => {
    if (!map) {
      toast.error('Map not loaded');
      return;
    }

    setIsSelectingOnMap(true);
    toast('Click on the map to select location', { icon: '📍' });

    // Clear existing marker
    if (mapMarker) {
      mapMarker.setMap(null);
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
        setMapMarker(marker);

        setIsSelectingOnMap(false);
        toast.success('Location selected');

        // Remove listener after first click
        google.maps.event.removeListener(listener);
      }
    });
  };

  // Handle Google Maps link parsing
  const handleGoogleMapsLink = (link: string) => {
    try {
      // Parse Google Maps links (various formats)
      const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,  // @lat,lng
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dlat!4dlng
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/, // q=lat,lng
      ];

      for (const pattern of patterns) {
        const match = link.match(pattern);
        if (match) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          setLatitude(lat.toString());
          setLongitude(lng.toString());
          geocodeLocation(lat, lng);
          toast.success('Coordinates extracted from link');
          return;
        }
      }

      toast.error('Could not extract coordinates from link');
    } catch (error) {
      toast.error('Invalid Google Maps link');
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
    if (mapMarker) {
      mapMarker.setMap(null);
      setMapMarker(null);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

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
