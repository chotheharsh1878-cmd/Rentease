import React from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Bed, 
  Bath, 
  Heart, 
  IndianRupee, 
  Building2, 
  Wifi, 
  GraduationCap, 
  Users, 
  Star, 
  Eye 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const PROPERTY_TYPE_COLORS = {
  'PG': 'bg-purple-100 text-purple-700',
  'hostel': 'bg-blue-100 text-blue-700',
  'room': 'bg-teal-100 text-teal-700',
  'flat': 'bg-brand-100 text-brand-700',
  'house': 'bg-amber-100 text-amber-700',
  'shared accommodation': 'bg-rose-100 text-rose-700'
};

export default function PropertyCard({ property, onFavoriteToggle }) {
  const { favoriteIds, toggleFavorite, isAuthenticated } = useAuth();
  const isFavorited = favoriteIds.includes(property.id);

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleFavorite(property.id);
    if (onFavoriteToggle) onFavoriteToggle();
  };

  const formatRent = (rent) => {
    return new Intl.NumberFormat('en-IN').format(rent);
  };

  const typeColor = PROPERTY_TYPE_COLORS[property.property_type] || 'bg-slate-100 text-slate-700';

  return (
    <Link to={`/properties/${property.id}`} className="group block">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 hover:border-brand-200 transition-all duration-300 overflow-hidden flex flex-col h-full">
        {/* Image Area */}
        <div className="relative h-52 bg-slate-100 overflow-hidden flex-shrink-0">
          <img
            src={property.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600'; }}
          />

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Featured badge */}
          {property.is_featured && (
            <div className="absolute top-3 left-3 flex items-center space-x-1 px-2.5 py-1 bg-amber-400 text-amber-900 text-xs font-bold rounded-full shadow">
              <Star className="w-3 h-3 fill-current" />
              <span>Featured</span>
            </div>
          )}

          {/* Property Type Badge */}
          <div className={`absolute top-3 ${property.is_featured ? 'left-24' : 'left-3'} px-2.5 py-1 text-xs font-bold rounded-full ${typeColor} shadow-sm uppercase tracking-wide flex items-center space-x-1`}>
            <span>{property.property_type}</span>
          </div>

          {/* External Untera / Global Indicator */}
          {property.is_external && (
            <div className="absolute top-11 left-3 px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-900/80 text-purple-100 shadow-sm backdrop-blur-sm">
              🌍 Untera Global API
            </div>
          )}

          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all duration-200 ${
              isFavorited 
                ? 'bg-rose-500 text-white scale-105 shadow-rose-300' 
                : 'bg-white/90 text-slate-500 hover:text-rose-500 hover:bg-white'
            }`}
            title={isFavorited ? 'Remove from saved' : 'Save property'}>
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>

          {/* Tenant Category Badge */}
          <div className="absolute bottom-3 left-3">
            {(property.tenant_category === 'student' || property.tenant_category === 'both') && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-blue-600/90 text-white text-xs font-semibold backdrop-blur-sm">
                <GraduationCap className="w-3 h-3" />
                <span>Student</span>
              </span>
            )}
            {property.tenant_category === 'family' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-xs font-semibold backdrop-blur-sm">
                <Users className="w-3 h-3" />
                <span>Family</span>
              </span>
            )}
            {property.tenant_category === 'both' && (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 ml-1.5 rounded-full bg-emerald-600/90 text-white text-xs font-semibold backdrop-blur-sm">
                <Users className="w-3 h-3" />
                <span>Family</span>
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1">
          {/* Location */}
          <div className="flex items-center space-x-1 text-xs text-slate-500 font-medium mb-2">
            <MapPin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
            <span className="truncate">{property.locality}, {property.city}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
            {property.title}
          </h3>

          {/* Specs Row */}
          <div className="flex items-center space-x-4 text-sm text-slate-600 mb-3">
            <span className="flex items-center space-x-1">
              <Bed className="w-4 h-4 text-slate-400" />
              <span>{property.bedrooms} BHK</span>
            </span>
            <span className="flex items-center space-x-1">
              <Bath className="w-4 h-4 text-slate-400" />
              <span>{property.bathrooms} Bath</span>
            </span>
            <span className="flex items-center space-x-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="capitalize">{property.furnishing_status?.split('-').join(' ')}</span>
            </span>
          </div>

          {/* Amenities Chips */}
          {Array.isArray(property.amenities) && property.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {property.amenities.slice(0, 3).map((amenity, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                  {amenity}
                </span>
              ))}
              {property.amenities.length > 3 && (
                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs">
                  +{property.amenities.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer: Rent + CTA */}
          <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-0.5">
                <span className="text-xl font-extrabold text-slate-900">
                  ₹{formatRent(property.monthly_rent)}
                </span>
                <span className="text-sm text-slate-500 font-medium">/mo</span>
              </div>
              {property.security_deposit > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  Deposit: ₹{formatRent(property.security_deposit)}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-1.5 text-sm font-semibold text-brand-600 group-hover:text-brand-700">
              <Eye className="w-4 h-4" />
              <span>View Details</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

