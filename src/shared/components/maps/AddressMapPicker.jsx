import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Search, Crosshair, Loader2 } from 'lucide-react';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function DraggableMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng);
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        onPositionChange(marker.getLatLng());
      }
    },
  };

  if (!position) return null;

  return (
    <Marker
      draggable
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

export default function AddressMapPicker({ value, onChange, themeColor = '#7C3AED' }) {
  // value: { address, city, state, country, postal_code, latitude, longitude }
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [mapCenter, setMapCenter] = useState(
    value?.latitude && value?.longitude
      ? [value.latitude, value.longitude]
      : [-33.8688, 151.2093] // default Sydney
  );
  const [markerPos, setMarkerPos] = useState(
    value?.latitude && value?.longitude
      ? { lat: value.latitude, lng: value.longitude }
      : null
  );
  const mapRef = useRef(null);

  const reverseGeocode = useCallback(async (lat, lng) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      if (data?.address) {
        const addr = data.address;
        onChange({
          address: [addr.road, addr.house_number].filter(Boolean).join(' ') || data.display_name?.split(',')[0] || '',
          city: addr.city || addr.town || addr.suburb || '',
          state: addr.state || '',
          country: addr.country || '',
          postal_code: addr.postcode || '',
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (e) {
      // Keep lat/lng even if reverse geocoding fails
      onChange({ ...value, latitude: lat, longitude: lng });
    }
  }, [onChange, value]);

  const handlePositionChange = useCallback((latlng) => {
    setMarkerPos(latlng);
    if (mapRef.current) {
      mapRef.current.flyTo(latlng, 16);
    }
    reverseGeocode(latlng.lat, latlng.lng);
  }, [reverseGeocode]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSearchResults(data || []);
    } catch (e) {
      // ignore
    }
    setSearching(false);
  };

  const selectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const pos = { lat, lng };
    setMarkerPos(pos);
    setMapCenter([lat, lng]);
    setSearchResults([]);
    setSearchQuery(result.display_name);
    if (mapRef.current) {
      mapRef.current.flyTo(pos, 16);
    }
    const addr = result.address || {};
    onChange({
      address: [addr.road, addr.house_number].filter(Boolean).join(' ') || result.display_name?.split(',')[0] || '',
      city: addr.city || addr.town || addr.suburb || '',
      state: addr.state || '',
      country: addr.country || '',
      postal_code: addr.postcode || '',
      latitude: lat,
      longitude: lng,
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latlng = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarkerPos(latlng);
        setMapCenter([latlng.lat, latlng.lng]);
        if (mapRef.current) {
          mapRef.current.flyTo(latlng, 16);
        }
        reverseGeocode(latlng.lat, latlng.lng);
        setDetecting(false);
      },
      () => setDetecting(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search address..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ '--tw-ring-color': themeColor }}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="px-4 py-2.5 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: themeColor }}
        >
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
        </button>
        <button
          onClick={detectLocation}
          disabled={detecting}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
        >
          {detecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
          Detect
        </button>
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-lg">
          {searchResults.map((r, idx) => (
            <button
              key={idx}
              onClick={() => selectResult(r)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 border-b border-slate-100 last:border-b-0 flex items-start gap-2"
            >
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="text-slate-700 line-clamp-2">{r.display_name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="h-[300px] rounded-xl overflow-hidden border border-slate-200">
        <MapContainer
          center={mapCenter}
          zoom={markerPos ? 16 : 12}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={markerPos} onPositionChange={handlePositionChange} />
        </MapContainer>
      </div>

      <p className="text-xs text-slate-400 text-center">Click on the map or drag the marker to set your location</p>
    </div>
  );
}
