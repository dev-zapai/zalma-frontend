import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import publicApi from '@/lib/publicApi';
import { getTenantSiteUrl } from '@/lib/utils';

// Fix default marker icon (webpack breaks it)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function createColoredIcon(color) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

export default function LeafletMapEmbed({ lat, lng, salonName, themeColor, slug }) {
  const [nearbySalons, setNearbySalons] = useState([]);

  useEffect(() => {
    if (!lat || !lng) return;
    const fetchNearby = async () => {
      try {
        const res = await publicApi.get(`/salons-nearby?lat=${lat}&lng=${lng}&radius=25`);
        // Filter out the current salon
        setNearbySalons((res.data || []).filter(s => s.slug !== slug));
      } catch (e) {
        // silently fail
      }
    };
    fetchNearby();
  }, [lat, lng, slug]);

  const mainIcon = createColoredIcon(themeColor || '#7C3AED');
  const nearbyIcon = createColoredIcon('#8B5CF6');

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Current salon marker */}
      <Marker position={[lat, lng]} icon={mainIcon}>
        <Popup>
          <div className="text-center">
            <strong>{salonName}</strong>
            <br />
            <span className="text-xs text-slate-500">You are here</span>
          </div>
        </Popup>
      </Marker>

      {/* Nearby Zap AI salons */}
      {nearbySalons.map((salon) => (
        <Marker key={salon.slug} position={[salon.latitude, salon.longitude]} icon={nearbyIcon}>
          <Popup>
            <div className="text-center">
              <strong>{salon.name}</strong>
              {salon.address && <><br /><span className="text-xs text-slate-500">{salon.address}</span></>}
              {salon.distance_km != null && <><br /><span className="text-xs text-slate-400">{salon.distance_km} km away</span></>}
              <br />
              {/* Use getTenantSiteUrl so the link includes the /zalma
                  prefix in production - a bare /s/{slug} would 404 because
                  the app is hosted under PUBLIC_URL=/zalma. */}
              <a
                href={getTenantSiteUrl(salon.slug)}
                className="text-xs font-semibold"
                style={{ color: '#7C3AED' }}
              >
                Visit Website &rarr;
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
