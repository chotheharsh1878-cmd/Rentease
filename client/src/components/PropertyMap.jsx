import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { Bed, Bath, MapPin, ExternalLink, Compass } from 'lucide-react';

// Fix standard Leaflet marker assets in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const POI_STYLES = {
  schools: { color: '#2563eb', letter: 'S', label: 'School' },
  colleges: { color: '#7c3aed', letter: 'C', label: 'College' },
  hospitals: { color: '#dc2626', letter: 'H', label: 'Hospital' },
  pharmacies: { color: '#e11d48', letter: 'P', label: 'Pharmacy' },
  markets: { color: '#16a34a', letter: 'M', label: 'Market' },
  shopping: { color: '#0d9488', letter: 'S', label: 'Shopping' },
  banks: { color: '#475569', letter: 'B', label: 'Bank / ATM' },
  restaurants: { color: '#ea580c', letter: 'R', label: 'Restaurant' },
  parks: { color: '#15803d', letter: 'G', label: 'Park' },
  transport: { color: '#0891b2', letter: 'T', label: 'Transport' },
  police: { color: '#1e40af', letter: 'P', label: 'Police' }
};

// Component that keeps the map framing all markers (houses + city centre)
function MapBoundsUpdater({ properties, selectedCity, cityCenter, nearbyPoints }) {
  const map = useMap();

  useEffect(() => {
    const points = [];

    if (cityCenter && Number.isFinite(cityCenter.latitude) && Number.isFinite(cityCenter.longitude)) {
      points.push([cityCenter.latitude, cityCenter.longitude]);
    }

    properties
      .filter((property) => property.latitude && property.longitude)
      .forEach((property) => points.push([parseFloat(property.latitude), parseFloat(property.longitude)]));

    if (points.length === 0 && nearbyPoints.length > 0) {
      points.push([nearbyPoints[0].latitude, nearbyPoints[0].longitude]);
    }

    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [properties, selectedCity, cityCenter, nearbyPoints, map]);

  return null;
}

const createPriceIcon = (rent, isHighlighted = false) => {
  const formatted = rent >= 1000 ? `₹${(rent / 1000).toFixed(1)}k` : `₹${rent}`;
  const background = isHighlighted ? '#0f172a' : '#2563eb';
  const scale = isHighlighted ? 'scale(1.18)' : 'scale(1)';
  const ring = isHighlighted ? '0 0 0 4px rgba(37,99,235,0.28)' : 'none';

  return L.divIcon({
    className: 'custom-price-marker',
    html: `
      <div style="
        background: ${background};
        color: #fff;
        padding: 4px 10px;
        border-radius: 9999px;
        font-weight: 800;
        font-size: 11px;
        font-family: system-ui, sans-serif;
        box-shadow: 0 4px 14px rgba(15,23,42,0.35), ${ring};
        border: 2px solid #fff;
        white-space: nowrap;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transform: translate(-50%, -50%) ${scale};
        transition: transform 0.2s ease, background 0.2s ease;
      ">
        ${formatted}
      </div>
    `,
    iconSize: [68, 26],
    iconAnchor: [34, 13]
  });
};

const createPoiIcon = (key) => {
  const style = POI_STYLES[key] || { color: '#64748b', letter: '?' };

  return L.divIcon({
    className: 'custom-poi-marker',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        border-radius: 9999px;
        background: ${style.color};
        color: #fff;
        border: 2px solid #fff;
        box-shadow: 0 2px 8px rgba(15,23,42,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 900;
        font-family: system-ui, sans-serif;
        transform: translate(-50%, -50%);
      ">
        ${style.letter}
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

export default function PropertyMap({
  properties = [],
  selectedCity = '',
  height = '600px',
  activePropertyId = null,
  onMarkerClick = null,
  nearby = null,
  cityCenter = null
}) {
  const defaultCenter = [18.5204, 73.8567]; // Pune default
  const validProperties = properties.filter(
    (property) => property.latitude && property.longitude
  );

  // Keep the map readable by showing the 2 closest places per category.
  const nearbyPoints = useMemo(() => {
    if (!nearby || typeof nearby !== 'object') return [];
    return Object.entries(nearby).flatMap(([key, items]) =>
      (Array.isArray(items) ? items : []).slice(0, 2).map((item) => ({
        ...item,
        categoryKey: key
      }))
    );
  }, [nearby]);

  const initialCenter = useMemo(() => {
    if (cityCenter && Number.isFinite(cityCenter.latitude) && Number.isFinite(cityCenter.longitude)) {
      return [cityCenter.latitude, cityCenter.longitude];
    }
    if (validProperties.length > 0) {
      return [parseFloat(validProperties[0].latitude), parseFloat(validProperties[0].longitude)];
    }
    return defaultCenter;
  }, [cityCenter, validProperties]);

  return (
    <div
      className="rounded-3xl overflow-hidden border border-slate-200 shadow-md relative z-10"
      style={{ height }}
    >
      <div className="absolute top-4 left-4 z-[500] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-slate-200/80 flex items-center space-x-2 text-xs font-bold text-slate-800">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>
          {validProperties.length} house{validProperties.length === 1 ? '' : 's'} mapped
          {selectedCity ? ` in ${selectedCity}` : ''}
        </span>
      </div>

      {nearbyPoints.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[500] bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200/80 flex flex-wrap gap-2 max-w-[260px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 w-full flex items-center space-x-1">
            <Compass className="w-3 h-3" />
            <span>Nearby essentials</span>
          </span>
          {Object.entries(
            nearbyPoints.reduce((acc, point) => {
              if (!acc[point.categoryKey]) acc[point.categoryKey] = POI_STYLES[point.categoryKey]?.label || point.type;
              return acc;
            }, {})
          ).map(([key, label]) => (
            <span key={key} className="flex items-center space-x-1 text-[10px] font-semibold text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-full border border-white shadow-sm inline-block"
                style={{ background: POI_STYLES[key]?.color || '#64748b' }}
              />
              <span>{label}</span>
            </span>
          ))}
        </div>
      )}

      <MapContainer
        center={initialCenter}
        zoom={12}
        scrollWheelZoom
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBoundsUpdater
          properties={validProperties}
          selectedCity={selectedCity}
          cityCenter={cityCenter}
          nearbyPoints={nearbyPoints}
        />

        {validProperties.map((property) => {
          const isSelected =
            activePropertyId && String(activePropertyId) === String(property.id);

          return (
            <Marker
              key={property.id}
              position={[parseFloat(property.latitude), parseFloat(property.longitude)]}
              icon={createPriceIcon(property.monthly_rent, isSelected)}
              eventHandlers={{
                click: () => {
                  if (onMarkerClick) onMarkerClick(property);
                }
              }}
            >
              <Popup className="custom-leaflet-popup" maxWidth={290}>
                <div className="p-1">
                  <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                    <img
                      src={
                        property.primary_image ||
                        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400'
                      }
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wide">
                        {property.property_type}
                      </span>
                      {property.tenant_category && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-900/80 text-white text-[10px] font-semibold capitalize">
                          {property.tenant_category}
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">
                    {property.title}
                  </h4>

                  <div className="flex items-center space-x-1 text-xs text-slate-500 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                    <span className="truncate">
                      {property.locality}, {property.city}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-600 mb-2">
                    <span className="flex items-center space-x-1">
                      <Bed className="w-3.5 h-3.5 text-slate-400" />
                      <span>{property.bedrooms} BHK</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Bath className="w-3.5 h-3.5 text-slate-400" />
                      <span>{property.bathrooms} Bath</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-sm font-extrabold text-slate-900">
                        ₹{Number(property.monthly_rent).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal"> /month</span>
                    </div>
                    <Link
                      to={`/properties/${property.id}`}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1 rounded-lg flex items-center space-x-1 transition"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {nearbyPoints.map((point, index) => (
          <Marker
            key={`poi-${point.categoryKey}-${point.name}-${index}`}
            position={[point.latitude, point.longitude]}
            icon={createPoiIcon(point.categoryKey)}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <span className="text-xs font-semibold">{point.name}</span>
              <br />
              <span className="text-[10px] text-slate-500">
                {POI_STYLES[point.categoryKey]?.label || point.type} · {point.distanceLabel}
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
