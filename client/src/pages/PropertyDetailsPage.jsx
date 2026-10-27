import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, Bed, Bath, IndianRupee, Calendar, ShieldCheck, 
  Heart, MessageSquare, Phone, ChevronLeft, ChevronRight, 
  Wifi, Car, Wind, Zap, Droplets, Building2, User, CheckCircle2,
  GraduationCap, Users, Star, Share2, Home, Loader2,
  School, Hospital, ShoppingBag, Bus, Trees, Banknote, Utensils,
  Thermometer, Activity, Navigation, Compass
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { propertyApi, inquiryApi, neighborhoodApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ScheduleVisitModal from '../components/ScheduleVisitModal';
import PropertyMap from '../components/PropertyMap';

const AMENITY_ICONS = {
  'High-speed Wi-Fi': Wifi,
  'Air Conditioning': Wind,
  'Parking': Car,
  'Power Backup': Zap,
  '24/7 Water Supply': Droplets,
  'Security Guard': ShieldCheck,
};

export default function PropertyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, toggleFavorite, favoriteIds } = useAuth();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showInquiry, setShowInquiry] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('');
  const [contactMethod, setContactMethod] = useState('phone');
  const [submitting, setSubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [error, setError] = useState('');
  const [cityProperties, setCityProperties] = useState([]);
  const [neighborhood, setNeighborhood] = useState(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);
  const [showNearby, setShowNearby] = useState(true);

  const isFavorited = favoriteIds.includes(parseInt(id));

  useEffect(() => {
    const load = async () => {
      try {
        const res = await propertyApi.getPropertyById(id);
        setProperty(res.data.property);
      } catch (err) {
        setError('Property not found or unavailable.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Load every other home in the same city + neighborhood intelligence.
  useEffect(() => {
    if (!property?.city) return;

    let active = true;
    setNeighborhoodLoading(true);

    Promise.allSettled([
      propertyApi.getProperties({ city: property.city, limit: 24 }),
      neighborhoodApi.getCity(property.city)
    ]).then(([propertiesResult, neighborhoodResult]) => {
      if (!active) return;

      if (propertiesResult.status === 'fulfilled') {
        setCityProperties(propertiesResult.value.data.properties || []);
      }
      if (neighborhoodResult.status === 'fulfilled') {
        setNeighborhood(neighborhoodResult.value.data.neighborhood || null);
      }
      setNeighborhoodLoading(false);
    });

    return () => {
      active = false;
    };
  }, [property?.city]);

  const mapProperties = useMemo(() => {
    if (!property) return [];
    const byId = new Map();
    [property, ...cityProperties].forEach((item) => {
      if (item && item.id !== undefined && item.id !== null) {
        byId.set(String(item.id), item);
      }
    });
    return Array.from(byId.values());
  }, [property, cityProperties]);

  const facilityGroups = useMemo(() => {
    if (!neighborhood?.facilities) return [];
    const config = [
      { key: 'schools', label: 'Schools', icon: School, color: 'text-blue-600 bg-blue-50' },
      { key: 'hospitals', label: 'Hospitals', icon: Hospital, color: 'text-rose-600 bg-rose-50' },
      { key: 'markets', label: 'Markets & Grocery', icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50' },
      { key: 'transport', label: 'Transport', icon: Bus, color: 'text-cyan-600 bg-cyan-50' },
      { key: 'parks', label: 'Parks', icon: Trees, color: 'text-green-600 bg-green-50' },
      { key: 'banks', label: 'Banks & ATMs', icon: Banknote, color: 'text-slate-600 bg-slate-100' },
      { key: 'restaurants', label: 'Food & Cafes', icon: Utensils, color: 'text-orange-600 bg-orange-50' },
      { key: 'pharmacies', label: 'Pharmacies', icon: Activity, color: 'text-pink-600 bg-pink-50' }
    ];

    return config
      .map((item) => ({
        ...item,
        places: (neighborhood.facilities[item.key] || []).slice(0, 3)
      }))
      .filter((group) => group.places.length > 0);
  }, [neighborhood]);

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/properties/${id}` } } });
      return;
    }
    await toggleFavorite(parseInt(id));
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: `/properties/${id}` } } });
      return;
    }
    if (!inquiryMsg.trim()) return;

    setSubmitting(true);
    try {
      await inquiryApi.create({
        property_id: property.id,
        message: inquiryMsg,
        preferred_contact_method: contactMethod
      });
      setInquirySuccess(true);
      setShowInquiry(false);
      setInquiryMsg('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit inquiry.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-brand-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Loading property details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !property) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Home className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Property Not Found</h2>
            <p className="text-slate-500 mb-6">{error}</p>
            <Link to="/properties" className="px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition">
              Back to Browse
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  const images = property.images || [];
  const displayImages = images.length > 0 ? images : [{ image_url: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900', is_primary: true }];

  const formatRent = (n) => new Intl.NumberFormat('en-IN').format(n);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Immediately';

  return (
    <MainLayout>
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center space-x-2 text-sm text-slate-500">
          <Link to="/" className="hover:text-brand-600 transition">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link to="/properties" className="hover:text-brand-600 transition">Properties</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium truncate">{property.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Image Gallery */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
              <div className="relative h-80 sm:h-[450px] bg-slate-100">
                <img
                  src={displayImages[activeImg]?.image_url}
                  alt={property.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=900'; }}
                />
                {displayImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImg((activeImg - 1 + displayImages.length) % displayImages.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition">
                      <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>
                    <button
                      onClick={() => setActiveImg((activeImg + 1) % displayImages.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition">
                      <ChevronRight className="w-5 h-5 text-slate-700" />
                    </button>
                  </>
                )}
                <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full">
                  {activeImg + 1} / {displayImages.length}
                </div>
                {property.is_featured && (
                  <div className="absolute top-4 left-4 flex items-center space-x-1.5 px-3 py-1.5 bg-amber-400 text-amber-900 font-bold rounded-full text-sm shadow">
                    <Star className="w-4 h-4 fill-current" />
                    <span>Featured</span>
                  </div>
                )}
              </div>
              {displayImages.length > 1 && (
                <div className="p-4 flex space-x-3 overflow-x-auto">
                  {displayImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImg(i)}
                      className={`flex-shrink-0 w-20 h-16 rounded-xl overflow-hidden border-2 transition ${
                        i === activeImg ? 'border-brand-500' : 'border-transparent hover:border-slate-200'
                      }`}>
                      <img
                        src={img.image_url}
                        alt={`View ${i + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200'; }}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold uppercase tracking-wide">
                  {property.property_type}
                </span>
                {property.tenant_category === 'student' || property.tenant_category === 'both' ? (
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1">
                    <GraduationCap className="w-3 h-3" />
                    <span>Student Friendly</span>
                  </span>
                ) : null}
                {property.tenant_category === 'family' || property.tenant_category === 'both' ? (
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>Family Friendly</span>
                  </span>
                ) : null}
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  property.availability_status === 'available' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-rose-100 text-rose-700'
                }`}>
                  {property.availability_status.charAt(0).toUpperCase() + property.availability_status.slice(1)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 leading-tight">
                {property.title}
              </h1>

              <div className="flex items-center space-x-2 text-slate-500 mb-6">
                <MapPin className="w-4 h-4 text-brand-500 flex-shrink-0" />
                <span className="text-sm">{property.address}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl mb-6">
                <div className="text-center">
                  <Bed className="w-6 h-6 text-brand-600 mx-auto mb-1" />
                  <p className="text-xl font-extrabold text-slate-900">{property.bedrooms}</p>
                  <p className="text-xs text-slate-500 font-medium">Bedrooms</p>
                </div>
                <div className="text-center">
                  <Bath className="w-6 h-6 text-indigo-500 mx-auto mb-1" />
                  <p className="text-xl font-extrabold text-slate-900">{property.bathrooms}</p>
                  <p className="text-xs text-slate-500 font-medium">Bathrooms</p>
                </div>
                <div className="text-center">
                  <Building2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-slate-900 capitalize">{property.furnishing_status?.split('-').join(' ')}</p>
                  <p className="text-xs text-slate-500 font-medium">Furnishing</p>
                </div>
                <div className="text-center">
                  <Calendar className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-sm font-bold text-slate-900">{formatDate(property.available_from)}</p>
                  <p className="text-xs text-slate-500 font-medium">Available From</p>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-3">About this Property</h3>
              <p className="text-slate-600 leading-relaxed">{property.description}</p>
            </div>

            {/* Amenities */}
            {Array.isArray(property.amenities) && property.amenities.length > 0 && (
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-900 mb-5">Amenities & Facilities</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {property.amenities.map((amenity, idx) => {
                    const Icon = AMENITY_ICONS[amenity] || CheckCircle2;
                    return (
                      <div key={idx} className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-brand-200 hover:bg-brand-50/30 transition">
                        <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-4 h-4 text-brand-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">{amenity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Interactive Location Map */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-brand-600" />
                    <span>Property Location & Neighborhood</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{property.address}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                    {mapProperties.length} homes in {property.city}
                  </span>
                  <button
                    onClick={() => setShowNearby((value) => !value)}
                    className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                      showNearby
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {showNearby ? 'Hide nearby places' : 'Show nearby places'}
                  </button>
                </div>
              </div>
              <PropertyMap
                properties={mapProperties}
                height="440px"
                selectedCity={property.city}
                activePropertyId={property.id}
                nearby={showNearby ? neighborhood?.facilities : null}
                cityCenter={neighborhood?.center || null}
              />
              <p className="text-[11px] text-slate-400 mt-3">
                Blue price pins are available houses in {property.city}. Colored letter pins show nearby
                schools, hospitals, markets, transport, and parks. Click any pin for details.
              </p>
            </div>

            {/* Neighborhood Intelligence */}
            <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
                    <Compass className="w-5 h-5 text-brand-600" />
                    <span>Living in {neighborhood?.city || property.city}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Live area intelligence from OpenStreetMap, Open-Meteo weather, and air-quality data.
                  </p>
                </div>
                {neighborhoodLoading && (
                  <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                )}
              </div>

              {neighborhood ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
                      <Thermometer className="w-5 h-5 text-sky-600 mb-2" />
                      <p className="text-lg font-extrabold text-slate-900">
                        {neighborhood.environment?.weather
                          ? `${neighborhood.environment.weather.temperatureC}°C`
                          : '—'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {neighborhood.environment?.weather?.condition || 'Live weather'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                      <Activity className="w-5 h-5 text-emerald-600 mb-2" />
                      <p className="text-lg font-extrabold text-slate-900">
                        {neighborhood.environment?.airQuality
                          ? `AQI ${neighborhood.environment.airQuality.usAqi}`
                          : '—'}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {neighborhood.environment?.airQuality?.level || 'Air quality'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <School className="w-5 h-5 text-blue-600 mb-2" />
                      <p className="text-lg font-extrabold text-slate-900">
                        {neighborhood.counts?.schools || 0}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">Schools mapped nearby</p>
                    </div>
                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
                      <Hospital className="w-5 h-5 text-rose-600 mb-2" />
                      <p className="text-lg font-extrabold text-slate-900">
                        {neighborhood.counts?.hospitals || 0}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-500">Hospitals / clinics nearby</p>
                    </div>
                  </div>

                  {neighborhood.environmentSummary && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 mb-5">
                      <p className="text-sm text-slate-700 leading-relaxed">
                        {neighborhood.environmentSummary}
                      </p>
                    </div>
                  )}

                  {facilityGroups.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {facilityGroups.map((group) => {
                        const Icon = group.icon;
                        return (
                          <div key={group.key} className="rounded-2xl border border-slate-100 p-4">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${group.color}`}>
                                <Icon className="w-4 h-4" />
                              </span>
                              <h4 className="text-sm font-bold text-slate-900">{group.label}</h4>
                            </div>
                            <ul className="space-y-2">
                              {group.places.map((place) => (
                                <li key={`${place.name}-${place.latitude}-${place.longitude}`} className="flex items-start justify-between gap-2">
                                  <span className="text-xs text-slate-700 font-medium leading-snug">
                                    {place.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                    {place.distanceLabel}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {neighborhood.cityLore?.knownFor?.length > 0 && (
                    <div className="mt-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                        {neighborhood.city} is known for
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {neighborhood.cityLore.knownFor.map((item) => (
                          <span
                            key={item}
                            className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-[11px] font-semibold"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : neighborhoodLoading ? (
                <p className="text-sm text-slate-500">Gathering schools, hospitals, markets, and transport data...</p>
              ) : (
                <p className="text-sm text-slate-500">
                  Neighborhood details are temporarily unavailable. The property map still shows all
                  nearby homes.
                </p>
              )}
            </div>

            {/* Success banner */}
            {inquirySuccess && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-emerald-800">Inquiry Sent Successfully!</p>
                  <p className="text-sm text-emerald-600">The property owner has been notified and will respond shortly.</p>
                </div>
              </div>
            )}

            {/* Inquiry Form */}
            {showInquiry && (
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-brand-200">
                <h3 className="text-lg font-bold text-slate-900 mb-5">
                  Send Rental Inquiry to Owner
                </h3>
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Your Message to the Owner</label>
                    <textarea
                      value={inquiryMsg}
                      onChange={(e) => setInquiryMsg(e.target.value)}
                      rows={4}
                      placeholder="Hi! I'm interested in renting this property. Could you please tell me more about the move-in process and whether the deposit is negotiable?"
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Preferred Contact Method</label>
                    <div className="flex flex-wrap gap-3">
                      {['phone', 'whatsapp', 'email'].map(m => (
                        <label key={m} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="contact"
                            value={m}
                            checked={contactMethod === m}
                            onChange={() => setContactMethod(m)}
                            className="text-brand-600"
                          />
                          <span className="text-sm font-medium capitalize">{m}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {error && <p className="text-sm text-rose-600 font-medium">{error}</p>}
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={submitting || !inquiryMsg.trim()}
                      className="flex-1 flex items-center justify-center space-x-2 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                      <span>{submitting ? 'Sending...' : 'Send Inquiry'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowInquiry(false)}
                      className="px-5 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT: Sidebar */}
          <div className="space-y-5">
            {/* Price Card */}
            <div className="bg-white rounded-3xl p-7 shadow-lg shadow-slate-200/50 border border-slate-100 sticky top-28">
              <div className="flex items-end space-x-1 mb-1">
                <span className="text-3xl font-extrabold text-slate-900">₹{formatRent(property.monthly_rent)}</span>
                <span className="text-slate-500 font-medium pb-1">/month</span>
              </div>
              {property.security_deposit > 0 && (
                <p className="text-sm text-slate-500 mb-5">
                  + ₹{formatRent(property.security_deposit)} security deposit
                </p>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {property.availability_status === 'available' && (
                  <>
                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login', { state: { from: { pathname: `/properties/${id}` } } });
                          return;
                        }
                        if (user?.role === 'owner' && property.owner_id === user.id) return;
                        setShowInquiry(!showInquiry);
                        setInquirySuccess(false);
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                      }}
                      disabled={user?.role === 'owner' && property.owner_id === user.id}
                      className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-md shadow-brand-500/25 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      <MessageSquare className="w-5 h-5" />
                      <span>Send Rental Inquiry</span>
                    </button>

                    <button
                      onClick={() => {
                        if (!isAuthenticated) {
                          navigate('/login', { state: { from: { pathname: `/properties/${id}` } } });
                          return;
                        }
                        setShowVisitModal(true);
                      }}
                      disabled={user?.role === 'owner' && property.owner_id === user.id}
                      className="w-full flex items-center justify-center space-x-2 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-2xl border border-emerald-300 transition disabled:opacity-50">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span>Schedule a Visit / Tour</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handleFavorite}
                  className={`w-full flex items-center justify-center space-x-2 py-3.5 font-bold rounded-2xl border-2 transition ${
                    isFavorited
                      ? 'bg-rose-50 border-rose-400 text-rose-600 hover:bg-rose-100'
                      : 'border-slate-200 text-slate-700 hover:border-rose-300 hover:text-rose-600'
                  }`}>
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  <span>{isFavorited ? 'Saved to Favourites' : 'Save to Favourites'}</span>
                </button>
              </div>

              {/* Owner Info */}
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Owner Details</h4>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg">
                    {property.owner_name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{property.owner_name}</p>
                    <p className="text-xs text-slate-500">Verified Property Owner</p>
                  </div>
                </div>
                {isAuthenticated && (
                  <a
                    href={`tel:${property.owner_phone}`}
                    className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition text-sm">
                    <Phone className="w-4 h-4" />
                    <span>{property.owner_phone}</span>
                  </a>
                )}
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    className="block text-center text-sm text-brand-600 font-semibold hover:text-brand-700 mt-2">
                    Login to view owner contact →
                  </Link>
                )}
              </div>

              {/* Key Details Summary */}
              <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                {[
                  { label: 'Property Type', value: property.property_type.toUpperCase() },
                  { label: 'For', value: property.tenant_category.charAt(0).toUpperCase() + property.tenant_category.slice(1) },
                  { label: 'Furnishing', value: property.furnishing_status?.replace(/-/g, ' ') },
                  { label: 'City', value: `${property.locality}, ${property.city}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 font-medium">{label}</span>
                    <span className="text-slate-900 font-bold capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Visit Modal */}
      <ScheduleVisitModal
        property={property}
        isOpen={showVisitModal}
        onClose={() => setShowVisitModal(false)}
      />
    </MainLayout>
  );
}

