import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Phone, Navigation, Clock, ShieldCheck, MapPin, CheckCircle2 } from 'lucide-react';

function RecenterTrackingMap({ bounds }) {
  const map = useMap();
  const hasInitializedRef = useRef(false);

  useEffect(() => {
    if (bounds && bounds.length === 2 && !hasInitializedRef.current) {
      map.fitBounds(bounds, { padding: [40, 40], animate: false });
      hasInitializedRef.current = true;
    }
  }, [bounds, map]);
  return null;
}

export default function TrackingMap({
  providerName = 'Service Technician',
  providerPhone = '+91 98765 43210',
  destinationAddress = 'Civil Lines, Aligarh',
  destinationCoords = [27.9015, 78.0792],
  providerCoords = [27.8920, 78.0850],
  status = 'on_the_way'
}) {
  const [currentProviderCoords, setCurrentProviderCoords] = useState(providerCoords);
  const [etaMins, setEtaMins] = useState(12);
  const [distanceKm, setDistanceKm] = useState(3.2);

  // Live GPS simulation: nudge technician coords closer to destination over time
  useEffect(() => {
    if (status !== 'on_the_way' && status !== 'in_progress') return;

    const interval = setInterval(() => {
      setCurrentProviderCoords(([lat, lon]) => {
        const destLat = destinationCoords[0];
        const destLon = destinationCoords[1];

        const step = 0.0003;
        const newLat = lat + (destLat - lat) * 0.08;
        const newLon = lon + (destLon - lon) * 0.08;

        // Calculate approximate remaining distance
        const remaining = Math.sqrt(Math.pow(destLat - newLat, 2) + Math.pow(destLon - newLon, 2)) * 111;
        setDistanceKm(Math.max(0.2, parseFloat(remaining.toFixed(1))));
        setEtaMins(Math.max(2, Math.round(remaining * 3.5)));

        return [newLat, newLon];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [status, destinationCoords]);

  const customerIcon = L.divIcon({
    className: 'customer-destination-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-2xl bg-emerald-600 shadow-xl border-2 border-white flex items-center justify-center text-white text-lg font-bold">
          🏠
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });

  const technicianIcon = L.divIcon({
    className: 'technician-tracking-icon',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-2xl bg-blue-600 shadow-xl border-2 border-white flex items-center justify-center text-white text-lg font-bold transform -rotate-12">
          🛵
        </div>
        <div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white animate-ping"></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
  });

  const bounds = [currentProviderCoords, destinationCoords];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-3">
      {/* Telemetry HUD Top Header */}
      <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/80 flex items-center justify-center text-white shrink-0">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                {status === 'on_the_way' ? 'Technician En Route' : status === 'in_progress' ? 'Service In Progress' : 'Job Confirmed'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </div>
            <h4 className="text-base font-bold text-white">{providerName}</h4>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-center">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Estimated Arrival</span>
            <span className="text-sm font-black text-amber-300">{etaMins} mins</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-white/10 backdrop-blur border border-white/20 text-center">
            <span className="text-[10px] text-blue-200 uppercase font-bold block">Distance</span>
            <span className="text-sm font-black text-white">{distanceKm} km</span>
          </div>

          <a
            href={`tel:${providerPhone}`}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition"
          >
            <Phone className="w-3.5 h-3.5" />
            Call
          </a>
        </div>
      </div>

      {/* Interactive Map */}
      <div className="w-full h-[360px] relative z-0">
        <MapContainer
          center={destinationCoords}
          zoom={13}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <RecenterTrackingMap bounds={bounds} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Polyline Route */}
          <Polyline
            positions={[currentProviderCoords, destinationCoords]}
            color="#2563eb"
            weight={4}
            opacity={0.8}
            dashArray="8, 8"
          />

          {/* Provider Marker */}
          <Marker position={currentProviderCoords} icon={technicianIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong>{providerName}</strong>
                <p className="text-blue-600 font-semibold mt-0.5">Live Location (~{distanceKm} km away)</p>
              </div>
            </Popup>
          </Marker>

          {/* Customer Destination Marker */}
          <Marker position={destinationCoords} icon={customerIcon}>
            <Popup>
              <div className="p-1 text-xs">
                <strong>Service Destination</strong>
                <p className="text-slate-500">{destinationAddress}</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Footer Info */}
      <div className="px-4 pb-3 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1.5 text-slate-600 font-medium">
          <MapPin className="w-3.5 h-3.5 text-rose-500" />
          Destination: {destinationAddress}
        </span>
        <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          GPS Live Tracking Active
        </span>
      </div>
    </div>
  );
}
