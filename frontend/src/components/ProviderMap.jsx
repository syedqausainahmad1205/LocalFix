import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Star, ShieldCheck, MapPin, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

// Custom CSS-based pulse marker icons for high-tech appearance
const createCustomIcon = (categorySlug, isAvailable) => {
  const bgClass = isAvailable ? 'bg-blue-600 ring-4 ring-blue-100' : 'bg-amber-600 ring-4 ring-amber-100';
  let emoji = '🛠️';
  if (categorySlug?.includes('electrician')) emoji = '⚡';
  else if (categorySlug?.includes('plumber')) emoji = '🔧';
  else if (categorySlug?.includes('ac')) emoji = '❄️';
  else if (categorySlug?.includes('carpenter')) emoji = '🪚';
  else if (categorySlug?.includes('maid') || categorySlug?.includes('clean')) emoji = '🧹';
  else if (categorySlug?.includes('barber')) emoji = '✂️';
  else if (categorySlug?.includes('painter')) emoji = '🎨';
  else if (categorySlug?.includes('interior')) emoji = '🛋️';
  else if (categorySlug?.includes('laptop') || categorySlug?.includes('tech')) emoji = '💻';
  else if (categorySlug?.includes('tutor')) emoji = '🎓';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative group cursor-pointer">
        <div class="w-10 h-10 rounded-2xl ${bgClass} shadow-lg flex items-center justify-center text-white font-bold text-base transition-transform transform hover:scale-110">
          ${emoji}
        </div>
        <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${isAvailable ? 'bg-emerald-500' : 'bg-amber-500'} border-2 border-white shadow"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });
};

// Auto-recenter map when providers or center changes
function RecenterMap({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || 12);
    }
  }, [center, zoom, map]);
  return null;
}

export default function ProviderMap({ providers = [], userLocation = null, onSelectProvider = null }) {
  // Determine center based on first provider or user location or default coordinates
  const defaultCenter = [27.8974, 78.0880];
  const center = userLocation || (providers.length > 0 && providers[0].latitude ? [providers[0].latitude, providers[0].longitude] : defaultCenter);

  return (
    <div className="w-full h-[520px] rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative z-0">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <RecenterMap center={center} zoom={providers.length > 1 ? 11 : 13} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User Current Location Marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={L.divIcon({
              className: 'user-location-marker',
              html: `
                <div class="relative flex items-center justify-center">
                  <div class="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs">
                    📍
                  </div>
                  <div class="absolute w-10 h-10 rounded-full bg-rose-400 opacity-40 animate-ping"></div>
                </div>
              `,
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })}
          >
            <Popup>
              <div className="p-1 text-xs">
                <strong>Your Location</strong>
                <p className="text-slate-500">Searching providers around here.</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Provider Markers */}
        {providers.map((p) => {
          if (!p.latitude || !p.longitude) return null;
          const primaryService = p.services?.[0];
          const categorySlug = primaryService?.category_slug || '';

          return (
            <Marker
              key={p.provider_id}
              position={[p.latitude, p.longitude]}
              icon={createCustomIcon(categorySlug, p.is_available)}
            >
              <Popup>
                <div className="p-2 space-y-2 min-w-[210px] text-slate-800">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      {p.profile_photo_url && (
                        <img
                          src={p.profile_photo_url}
                          alt={p.full_name}
                          className="w-8 h-8 rounded-lg object-cover border border-emerald-500 shrink-0"
                        />
                      )}
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 leading-tight">
                          {p.full_name || p.business_name}
                        </h4>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                          {p.service_area} (~{p.distance_km} km)
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {(Number(p.avg_rating) || 0).toFixed(1)}
                    </span>
                  </div>

                  {(p.tutor_grades || p.tutor_mode || /tutor|teach/i.test(p.primary_skill || '')) && (
                    <div className="text-[10px] bg-indigo-50 text-indigo-700 p-1.5 rounded font-medium space-y-0.5">
                      <div className="font-bold">🎓 Work: Teaching ({p.tutor_mode === 'online' ? 'Online' : p.tutor_mode === 'offline' ? 'Offline' : 'Online & Offline'})</div>
                      {p.tutor_subjects && <div>Subjects: {p.tutor_subjects}</div>}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className={`text-[10px] font-semibold flex items-center gap-1 ${p.is_available ? 'text-emerald-600' : 'text-amber-600'}`}>
                      <span className={`w-2 h-2 rounded-full ${p.is_available ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                      {p.is_available ? 'Available Now' : 'Busy on Job'}
                    </span>
                    <Link
                      to={`/providers/${p.provider_id}`}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-[11px] flex items-center gap-1 shadow-sm"
                    >
                      Book <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
