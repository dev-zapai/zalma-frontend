import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, Crosshair, Loader2, ExternalLink,
  Phone, Navigation, Dog, Scissors, Star, Filter, X, MapPinned, Eye
} from 'lucide-react';
import SalonProfileDialog from '@/components/SalonProfileDialog';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import AddressMapPicker from '@/components/maps/AddressMapPicker';
import { toast } from 'sonner';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createIcon(color, size = 32, isCurrentUser = false) {
  const border = isCurrentUser ? '4px solid #fff' : '3px solid #fff';
  const extraShadow = isCurrentUser ? ', 0 0 0 3px ' + color : '';
  return L.divIcon({
    className: '',
    html: `<div style="
      width: ${size}px; height: ${size}px;
      background: ${color};
      border: ${border};
      border-radius: 50%;
      box-shadow: 0 3px 12px rgba(0,0,0,0.3)${extraShadow};
      display: flex; align-items: center; justify-content: center;
    ">
      <svg width="${size * 0.45}" height="${size * 0.45}" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="0">
        <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14 5.172C14 3.782 15.577 2.679 17.5 3c2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.5M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17l-.75-.75zM4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309m-9.243-6.082A8.801 8.801 0 0 1 12 5c.78 0 1.5.108 2.161.306"/>
      </svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function FlyToLocation({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
}

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

export default function ExploreMapPage() {
  const [salons, setSalons] = useState([]);
  const [profileTenantId, setProfileTenantId] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userLoc, setUserLoc] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);
  const [selectedSalon, setSelectedSalon] = useState(null);
  const [filter, setFilter] = useState('pet_grooming'); // pet_grooming only by default
  const mapRef = useRef(null);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchContainerRef = useRef(null);
  const debouncedQuery = useDebounce(searchQuery, 400);

  // Location picker modal state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationData, setLocationData] = useState({
    address: '', city: '', state: '', country: '', postal_code: '',
    latitude: null, longitude: null,
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // Current tenant info
  const [currentTenant, setCurrentTenant] = useState(null);

  const fetchSalons = useCallback(async (lat, lng) => {
    try {
      const params = lat && lng ? `?lat=${lat}&lng=${lng}` : '';
      const res = await api.get(`/website/explore-salons${params}`);
      setSalons(res.data || []);
      // Extract current tenant info
      const current = (res.data || []).find(s => s.is_current);
      setCurrentTenant(current || null);
    } catch (e) {
      console.error('Failed to fetch salons', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Try to auto-detect location
    if (navigator.geolocation) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLoc(loc);
          setFlyTarget([loc.lat, loc.lng]);
          fetchSalons(loc.lat, loc.lng);
          setDetecting(false);
        },
        () => {
          // Fallback: fetch without location
          fetchSalons();
          setDetecting(false);
        },
        { timeout: 8000 }
      );
    } else {
      fetchSalons();
    }
  }, [fetchSalons]);

  // Fetch autocomplete suggestions when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    let cancelled = false;
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(debouncedQuery)}&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        if (!cancelled) {
          setSuggestions(data || []);
          setShowSuggestions((data || []).length > 0);
        }
      } catch {
        if (!cancelled) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
      if (!cancelled) setLoadingSuggestions(false);
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDetect = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLoc(loc);
        setFlyTarget([loc.lat, loc.lng]);
        fetchSalons(loc.lat, loc.lng);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSelectSuggestion = (suggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lng = parseFloat(suggestion.lon);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setFlyTarget([lat, lng]);
    fetchSalons(lat, lng);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setShowSuggestions(false);
    // If we already have suggestions, use the first one
    if (suggestions.length > 0) {
      handleSelectSuggestion(suggestions[0]);
      return;
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.[0]) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        setFlyTarget([lat, lng]);
        fetchSalons(lat, lng);
      }
    } catch (e) { /* ignore */ }
  };

  // Save business location
  const handleSaveLocation = async () => {
    if (!locationData.latitude || !locationData.longitude) {
      toast.error('Please select a location on the map first');
      return;
    }
    setSavingLocation(true);
    try {
      await api.put('/tenant/me', {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        address: locationData.address,
        city: locationData.city,
        state: locationData.state,
        country: locationData.country,
        postal_code: locationData.postal_code,
      });
      toast.success('Business location saved successfully!');
      setShowLocationPicker(false);
      // Refresh salons to show updated pin
      const lat = locationData.latitude;
      const lng = locationData.longitude;
      setFlyTarget([lat, lng]);
      fetchSalons(lat, lng);
    } catch (e) {
      console.error('Failed to save location', e);
      toast.error('Failed to save business location');
    }
    setSavingLocation(false);
  };

  const currentTenantHasLocation = currentTenant?.latitude && currentTenant?.longitude;

  const filteredSalons = filter === 'all'
    ? salons
    : salons.filter(s => s.type === filter);

  const currentSalon = salons.find(s => s.is_current);
  const defaultCenter = currentSalon
    ? [currentSalon.latitude, currentSalon.longitude]
    : userLoc ? [userLoc.lat, userLoc.lng]
    : [-33.87, 151.21];

  const zapIcon = createIcon('#7C3AED', 36);
  const zapCurrentIcon = createIcon('#7C3AED', 42, true);
  const otherGroomingIcon = createIcon('#F59E0B', 30);
  const otherClinicIcon = createIcon('#10B981', 30);
  const userIcon = L.divIcon({
    className: '',
    html: `<div style="width:16px;height:16px;background:#3B82F6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(59,130,246,0.3),0 2px 8px rgba(0,0,0,0.3);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  return (
    <div className="animate-fade-in h-[calc(100vh-4rem)]">
      {/* Banner: No location set */}
      {!loading && !currentTenantHasLocation && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex items-center gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
            <MapPinned className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Set your business location to appear on the map
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Let customers discover and find your business. Your pin will show up on the explore map for everyone.
            </p>
          </div>
          <Button
            onClick={() => {
              // Pre-fill location data from current tenant if available
              if (currentTenant) {
                setLocationData({
                  address: currentTenant.address || '',
                  city: currentTenant.city || '',
                  state: currentTenant.state || '',
                  country: currentTenant.country || '',
                  postal_code: currentTenant.postal_code || '',
                  latitude: currentTenant.latitude || null,
                  longitude: currentTenant.longitude || null,
                });
              }
              setShowLocationPicker(true);
            }}
            className="flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            Set Location
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
            Explore Pet Businesses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Discover pet salons and clinics near you. <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-violet-500 inline-block" /> Zap AI businesses</span>
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (currentTenant) {
              setLocationData({
                address: currentTenant.address || '',
                city: currentTenant.city || '',
                state: currentTenant.state || '',
                country: currentTenant.country || '',
                postal_code: currentTenant.postal_code || '',
                latitude: currentTenant.latitude || null,
                longitude: currentTenant.longitude || null,
              });
            }
            setShowLocationPicker(true);
          }}
          className="flex items-center gap-1.5"
        >
          <MapPinned className="h-4 w-4" />
          {currentTenantHasLocation ? 'Update My Location' : 'Set My Business Location'}
        </Button>
      </div>

      {/* Search + Filters Bar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1 max-w-md" ref={searchContainerRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim().length >= 2) {
                setShowSuggestions(true);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
              if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              if (suggestions.length > 0) setShowSuggestions(true);
            }}
            placeholder="Search a city or area..."
            className="pl-9"
          />

          {/* Autocomplete Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              {loadingSuggestions && suggestions.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching...
                </div>
              ) : suggestions.length > 0 ? (
                suggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-start gap-2.5 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-700 line-clamp-1 block">{suggestion.display_name}</span>
                      {suggestion.type && (
                        <span className="text-xs text-slate-400 capitalize">{suggestion.type.replace('_', ' ')}</span>
                      )}
                    </div>
                  </button>
                ))
              ) : null}
            </div>
          )}
        </div>
        <Button variant="outline" onClick={handleSearch}>
          Search
        </Button>
        <Button variant="outline" onClick={handleDetect} disabled={detecting}>
          {detecting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Crosshair className="h-4 w-4 mr-1" />}
          My Location
        </Button>
        <div className="flex items-center gap-1 ml-2 border rounded-lg p-0.5">
          {[
            { id: 'pet_grooming', label: 'Grooming', icon: Scissors },
            { id: 'all', label: 'All Pet Businesses' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                filter === f.id ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.icon && <f.icon className="h-3 w-3" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100%-8rem)]">
        {/* Salon List Sidebar */}
        <div className="lg:col-span-1 overflow-y-auto space-y-2 max-h-full">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : filteredSalons.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No pet businesses found in this area yet.</p>
              <p className="text-xs text-slate-400 mt-1">Try searching a different location</p>
            </div>
          ) : (
            filteredSalons.map((salon, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setSelectedSalon(salon);
                  setFlyTarget([salon.latitude, salon.longitude]);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selectedSalon?.slug === salon.slug
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    salon.is_current ? 'bg-violet-100' : 'bg-slate-100'
                  }`}>
                    {salon.logo_url ? (
                      <img src={salon.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                    ) : (
                      <Dog className={`h-5 w-5 ${salon.is_current ? 'text-violet-600' : 'text-slate-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-sm text-slate-900 truncate">{salon.name}</span>
                      {salon.is_zap_ai && (
                        <span className="bg-violet-100 text-violet-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          ZAP
                        </span>
                      )}
                      {salon.is_current && (
                        <span className="bg-primary/10 text-primary text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                          YOU
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                      {salon.type === 'pet_grooming' ? 'Pet Grooming' : salon.type === 'pet_clinic' ? 'Pet Clinic' : 'Clinic'}
                    </p>
                    {salon.city && <p className="text-xs text-slate-400 truncate">{[salon.address, salon.city].filter(Boolean).join(', ')}</p>}
                    {salon.distance_km != null && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        <Navigation className="h-3 w-3 inline mr-0.5" />{salon.distance_km} km away
                      </p>
                    )}
                    {salon.id && !salon.is_current && salon.is_zap_ai && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setProfileTenantId(salon.id); setProfileOpen(true); }}
                        className="text-[11px] text-primary font-medium hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        <Eye className="h-3 w-3" /> View Profile
                      </button>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Map */}
        <div className="lg:col-span-3 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
          <MapContainer
            center={defaultCenter}
            zoom={12}
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyToLocation center={flyTarget} />

            {/* User location */}
            {userLoc && (
              <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon}>
                <Popup><strong>Your Location</strong></Popup>
              </Marker>
            )}

            {/* Salon markers */}
            {filteredSalons.map((salon, idx) => {
              let icon;
              if (salon.is_current) icon = zapCurrentIcon;
              else if (salon.is_zap_ai && salon.is_published) icon = zapIcon;
              else if (salon.type === 'pet_grooming') icon = otherGroomingIcon;
              else icon = otherClinicIcon;

              return (
                <Marker
                  key={idx}
                  position={[salon.latitude, salon.longitude]}
                  icon={icon}
                  eventHandlers={{ click: () => setSelectedSalon(salon) }}
                >
                  <Popup>
                    <div className="min-w-[180px]">
                      <div className="flex items-center gap-2 mb-1">
                        <strong className="text-sm">{salon.name}</strong>
                        {salon.is_zap_ai && (
                          <span style={{ background: '#7C3AED', color: 'white', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '9999px' }}>
                            ZAP AI
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '11px', color: '#64748B', margin: '2px 0' }}>
                        {salon.type === 'pet_grooming' ? 'Pet Grooming Salon' : salon.type === 'pet_clinic' ? 'Pet Clinic' : 'Business'}
                      </p>
                      {salon.address && <p style={{ fontSize: '11px', color: '#94A3B8' }}>{salon.address}{salon.city ? `, ${salon.city}` : ''}</p>}
                      {salon.phone && <p style={{ fontSize: '11px', color: '#94A3B8' }}>{salon.phone}</p>}
                      {salon.distance_km != null && <p style={{ fontSize: '10px', color: '#94A3B8' }}>{salon.distance_km} km away</p>}
                      {salon.slug && salon.is_published && (
                        <a
                          href={`/s/${salon.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: '11px', fontWeight: 600, color: '#7C3AED', display: 'inline-block', marginTop: '4px' }}
                        >
                          Visit Website →
                        </a>
                      )}
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>

      {/* Set Business Location Modal */}
      <Dialog open={showLocationPicker} onOpenChange={setShowLocationPicker}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-primary" />
              Set Your Business Location
            </DialogTitle>
            <DialogDescription>
              Search for your address, detect your current location, or click on the map to place your pin.
              This helps customers find your business.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <AddressMapPicker
              value={locationData}
              onChange={(data) => setLocationData(data)}
            />

            {/* Show current selection summary */}
            {locationData.latitude && locationData.longitude && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1.5">Selected Location</p>
                <div className="space-y-1">
                  {locationData.address && (
                    <p className="text-sm text-slate-700">{locationData.address}</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {[locationData.city, locationData.state, locationData.country, locationData.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  <p className="text-xs text-slate-400 font-mono">
                    {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLocationPicker(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveLocation}
              disabled={savingLocation || !locationData.latitude || !locationData.longitude}
            >
              {savingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-1.5" />
                  Save Location
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SalonProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        tenantId={profileTenantId}
      />
    </div>
  );
}
