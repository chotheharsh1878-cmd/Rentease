import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  SlidersHorizontal, X, ChevronDown, Search, MapPin, 
  Home, Building2, RefreshCw, Grid3X3, Map as MapIcon, 
  Sparkles, Layers, Compass, CheckCircle2, ChevronRight,
  School, Hospital, ShoppingBag, Bus, Trees, Thermometer,
  Activity, Loader2
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import PropertyCard from '../components/PropertyCard';
import PropertyMap from '../components/PropertyMap';
import { propertyApi, neighborhoodApi } from '../services/api';

const POPULAR_CITIES = [
  { name: 'All Cities', value: '' },
  { name: 'Pune', value: 'Pune' },
  { name: 'Mumbai', value: 'Mumbai' },
  { name: 'Bangalore', value: 'Bangalore' },
  { name: 'Delhi', value: 'Delhi' },
  { name: 'Hyderabad', value: 'Hyderabad' },
  { name: 'London', value: 'London' },
  { name: 'New York', value: 'New York' },
  { name: 'Paris', value: 'Paris' },
  { name: 'Tokyo', value: 'Tokyo' },
  { name: 'Dubai', value: 'Dubai' },
  { name: 'Toronto', value: 'Toronto' },
  { name: 'Sydney', value: 'Sydney' },
  { name: 'Berlin', value: 'Berlin' },
  { name: 'Singapore', value: 'Singapore' }
];

const LOCALITIES_BY_CITY = {
  pune: ['All Areas', 'Hinjewadi', 'Kothrud', 'Viman Nagar', 'Shivaji Nagar', 'Baner', 'Wakad'],
  mumbai: ['All Areas', 'Andheri West', 'Bandra', 'Powai', 'Goregaon', 'Dadar'],
  bangalore: ['All Areas', 'Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Electronic City'],
  delhi: ['All Areas', 'Hauz Khas', 'South Extension', 'Dwarka', 'Saket', 'Rohini'],
  hyderabad: ['All Areas', 'Gachibowli', 'Hitech City', 'Madhapur', 'Banjara Hills', 'Jubilee Hills'],
  london: ['All Areas', 'Bloomsbury', 'Camden', 'Kensington', 'Canary Wharf', 'Greenwich', 'Westminster'],
  'new york': ['All Areas', 'Park Slope', 'Manhattan', 'Brooklyn', 'Queens', 'Williamsburg'],
  paris: ['All Areas', 'Latin Quarter', 'Le Marais', 'Montmartre', 'Bastille'],
  tokyo: ['All Areas', 'Shinjuku', 'Shibuya', 'Roppongi', 'Ikebukuro'],
  dubai: ['All Areas', 'Dubai Marina', 'Downtown Dubai', 'JLT', 'Business Bay'],
  toronto: ['All Areas', 'Downtown', 'North York', 'Annex', 'Liberty Village'],
  sydney: ['All Areas', 'Kensington', 'Surry Hills', 'Bondi', 'Ultimo'],
  berlin: ['All Areas', 'Mitte', 'Kreuzberg', 'Prenzlauer Berg', 'Charlottenburg'],
  singapore: ['All Areas', 'Orchard', 'Bugis', 'Clementi', 'Tampines']
};

const FILTERS = {
  propertyType: ['house', 'flat', 'room', 'PG', 'hostel', 'shared accommodation'],
  bedrooms: ['1', '2', '3', '4+'],
  furnishing: ['furnished', 'semi-furnished', 'unfurnished'],
  tenantCategory: ['student', 'family', 'both'],
  amenities: ['High-speed Wi-Fi', 'Air Conditioning', 'Parking', 'Geyser', 'Washing Machine', 'RO Water Purifier', 'Power Backup', '24/7 Security']
};

export default function BrowsePropertiesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // View Mode: 'split' | 'grid' | 'map'
  const [viewMode, setViewMode] = useState('grid');
  const [activePropertyId, setActivePropertyId] = useState(null);
  const [neighborhood, setNeighborhood] = useState(null);
  const [neighborhoodLoading, setNeighborhoodLoading] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    city: searchParams.get('city') || '',
    locality: searchParams.get('locality') || '',
    minRent: searchParams.get('minRent') || '',
    maxRent: searchParams.get('maxRent') || '',
    tenantCategory: searchParams.get('tenantCategory') || '',
    propertyType: searchParams.get('propertyType') || '',
    bedrooms: searchParams.get('bedrooms') || '',
    furnishingStatus: searchParams.get('furnishingStatus') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page') || '1')
  });

  const [cityInput, setCityInput] = useState(
    searchParams.get('city') || searchParams.get('search') || ''
  );

  const fetchProperties = useCallback(async (currentFilters) => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(currentFilters).filter(([, v]) => v !== '' && v !== undefined)
      );
      if (params.city) params.limit = 24;

      const res = await propertyApi.getProperties(params);
      setProperties(res.data.properties || []);
      setPagination(res.data.pagination || {});
      if (res.data.properties?.length > 0) {
        setActivePropertyId(res.data.properties[0].id);
      }
    } catch (err) {
      console.error('Browse error:', err);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced city search so typing a city name triggers one clean request.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => {
        if (prev.city === cityInput && prev.search === cityInput) return prev;
        return { ...prev, city: cityInput, search: cityInput, locality: '', page: 1 };
      });
    }, 450);

    return () => clearTimeout(timer);
  }, [cityInput]);

  useEffect(() => {
    fetchProperties(filters);
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    setSearchParams(params, { replace: true });
  }, [filters, fetchProperties, setSearchParams]);

  // City environment + nearby essentials for the active city.
  useEffect(() => {
    if (!filters.city) {
      setNeighborhood(null);
      return;
    }

    let active = true;
    setNeighborhoodLoading(true);

    neighborhoodApi
      .getCity(filters.city)
      .then((res) => {
        if (active) setNeighborhood(res.data.neighborhood || null);
      })
      .catch(() => {
        if (active) setNeighborhood(null);
      })
      .finally(() => {
        if (active) setNeighborhoodLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters.city]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value, 
      // If city changes, reset locality
      ...(key === 'city' ? { locality: '' } : {}),
      page: 1 
    }));
    if (key === 'city') setCityInput(value);
  };

  const clearFilters = () => {
    setFilters({
      search: '', city: '', locality: '', minRent: '', maxRent: '',
      tenantCategory: '', propertyType: '', bedrooms: '',
      furnishingStatus: '', sortBy: 'newest', page: 1
    });
    setCityInput('');
  };

  const activeFilterCount = Object.entries(filters).filter(([k, v]) => 
    !['sortBy', 'page'].includes(k) && v !== ''
  ).length;

  const currentCityKey = (filters.city || '').toLowerCase().trim();
  const availableLocalities = LOCALITIES_BY_CITY[currentCityKey] || [];

  return (
    <MainLayout>
      {/* 99acres Style Top Bar with City Search & Map View Mode */}
      <div className="bg-white border-b border-slate-200 sticky top-[57px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            
            {/* Search Input for City / Locality / Title */}
            <div className="flex-1 flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Enter any city to see all available houses on map (e.g. Pune, London, Tokyo, New York)..."
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition"
                />
                {(cityInput || filters.city) && (
                  <button 
                    onClick={clearFilters}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Advanced Filter Toggle Button */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold border transition shrink-0 ${
                  activeFilterCount > 0 
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm' 
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
              </button>
            </div>

            {/* View Mode & Sorting Controls */}
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              {/* 99acres Style "Show on Map" Indicator & Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200/80">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                    viewMode === 'grid' 
                      ? 'bg-white text-slate-900 shadow-sm font-extrabold' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}>
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>List View</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                    viewMode === 'map' 
                      ? 'bg-brand-600 text-white shadow-sm font-extrabold' 
                      : 'text-slate-700 hover:text-brand-600 font-bold'
                  }`}>
                  <MapIcon className="w-3.5 h-3.5 text-current animate-pulse" />
                  <span>Show on Map ({properties.length})</span>
                </button>
              </div>

              {/* Sort By */}
              <select
                value={filters.sortBy}
                onChange={(e) => updateFilter('sortBy', e.target.value)}
                className="px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 text-slate-700 font-semibold bg-white cursor-pointer">
                <option value="newest">Newest First</option>
                <option value="price_asc">Rent: Low to High</option>
                <option value="price_desc">Rent: High to Low</option>
                <option value="bedrooms">Most BHK</option>
              </select>

              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  title="Clear all filters"
                  className="flex items-center space-x-1 px-2.5 py-2 text-xs text-rose-600 font-semibold hover:bg-rose-50 rounded-xl border border-rose-200 transition">
                  <RefreshCw className="w-3 h-3" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Select Popular City Chips */}
          <div className="mt-3 flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1 shrink-0">
              Try a city:
            </span>
            {POPULAR_CITIES.filter((c) => c.value !== '').map(c => {
              const isSelected = filters.city && filters.city.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.name}
                  onClick={() => updateFilter('city', c.value)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition ${
                    isSelected
                      ? 'bg-slate-900 text-white font-bold shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}>
                  {c.name}
                </button>
              );
            })}
          </div>

          {/* 99acres-Style Locality / Area Indicators if a city is active */}
          {availableLocalities.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
              <span className="text-brand-600 font-bold uppercase tracking-wider text-[10px] mr-1 shrink-0 flex items-center space-x-1">
                <MapPin className="w-3 h-3" />
                <span>Areas in {filters.city}:</span>
              </span>
              {availableLocalities.map(area => {
                const isAll = area === 'All Areas';
                const isSelected = isAll ? !filters.locality : filters.locality.toLowerCase() === area.toLowerCase();
                return (
                  <button
                    key={area}
                    onClick={() => updateFilter('locality', isAll ? '' : area)}
                    className={`px-2.5 py-0.5 rounded-md whitespace-nowrap text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-brand-50 text-brand-700 border border-brand-300 font-bold'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}>
                    {area}
                  </button>
                );
              })}
            </div>
          )}

          {/* Advanced Expandable Filter Panel */}
          {filtersOpen && (
            <div className="mt-3 pt-3 border-t border-slate-100 animate-in slide-in-from-top-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                {/* Min Rent */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Min Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={filters.minRent}
                    onChange={(e) => updateFilter('minRent', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Max Rent */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Max Rent (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 25000"
                    value={filters.maxRent}
                    onChange={(e) => updateFilter('maxRent', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Tenant Category */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Suitable For</label>
                  <select
                    value={filters.tenantCategory}
                    onChange={(e) => updateFilter('tenantCategory', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 font-medium">
                    <option value="">Students & Families</option>
                    <option value="student">Students Only</option>
                    <option value="family">Families Only</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Property Type</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => updateFilter('propertyType', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 font-medium capitalize">
                    <option value="">All Types</option>
                    {FILTERS.propertyType.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1 uppercase">Bedrooms</label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => updateFilter('bedrooms', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-brand-500 bg-white text-slate-700 font-medium">
                    <option value="">Any BHK</option>
                    {FILTERS.bedrooms.map(b => (
                      <option key={b} value={b}>{b} BHK</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Furnishing Status */}
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-500">Furnishing:</span>
                {FILTERS.furnishing.map(f => (
                  <button
                    key={f}
                    onClick={() => updateFilter('furnishingStatus', filters.furnishingStatus === f ? '' : f)}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border transition capitalize ${
                      filters.furnishingStatus === f
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-300'
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 99acres-Style Location & Status Banner */}
      <div className="bg-slate-50 border-b border-slate-200/60 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row lg:items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-700 font-semibold">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span>
              Showing {properties.length} available house{properties.length === 1 ? '' : 's'}
              {filters.city ? ` in ${filters.city}` : ''}
              {filters.locality ? ` · ${filters.locality}` : ''}
              {properties.some((property) => property.is_external) ? ' · Live city results' : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-slate-500">
            {neighborhood && (
              <div className="hidden lg:flex items-center space-x-3">
                <span className="flex items-center space-x-1">
                  <Thermometer className="w-3.5 h-3.5 text-sky-500" />
                  <span>
                    {neighborhood.environment?.weather?.temperatureC}°C{' '}
                    {neighborhood.environment?.weather?.condition}
                  </span>
                </span>
                {neighborhood.environment?.airQuality && (
                  <span className="flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>
                      AQI {neighborhood.environment.airQuality.usAqi} (
                      {neighborhood.environment.airQuality.level})
                    </span>
                  </span>
                )}
                <span className="flex items-center space-x-1">
                  <School className="w-3.5 h-3.5 text-blue-500" />
                  <span>{neighborhood.counts?.schools || 0} schools</span>
                </span>
                <span className="flex items-center space-x-1">
                  <Hospital className="w-3.5 h-3.5 text-rose-500" />
                  <span>{neighborhood.counts?.hospitals || 0} hospitals</span>
                </span>
                <span className="flex items-center space-x-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                  <span>
                    {(neighborhood.counts?.markets || 0) + (neighborhood.counts?.shopping || 0)} markets
                  </span>
                </span>
                <span className="flex items-center space-x-1">
                  <Bus className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{neighborhood.counts?.transport || 0} transit</span>
                </span>
                {neighborhoodLoading && <Loader2 className="w-3 h-3 animate-spin" />}
              </div>
            )}
            {viewMode === 'grid' ? (
              <button 
                onClick={() => setViewMode('map')}
                className="text-brand-600 font-bold hover:underline flex items-center space-x-1">
                <span>Show all houses on map with nearby essentials</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Every house + schools, hospitals, markets, transport plotted</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-slate-100">
                <div className="h-52 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
                  <div className="h-5 bg-slate-200 rounded-lg" />
                  <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-600">
              <MapPin className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">
              No properties found {filters.city ? `in ${filters.city}` : ''}
            </h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto text-sm">
              We couldn't find matching rental houses for your criteria. Try searching another city like Pune, Mumbai, Bangalore, or London.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-md shadow-brand-500/20 transition">
              Reset Filters & Show All
            </button>
          </div>
        ) : (
          <>
            {/* VIEW MODE: Interactive 99acres Map View vs Grid */}
            {viewMode === 'map' ? (
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 text-xs text-slate-700">
                    <span className="font-extrabold text-slate-900">Interactive City Map</span>
                    <span className="text-slate-300">|</span>
                    <span>
                      {properties.length} house{properties.length === 1 ? '' : 's'} + nearby
                      essentials plotted
                    </span>
                    {filters.city && <span className="font-bold text-brand-600">around {filters.city}</span>}
                  </div>
                  <button
                    onClick={() => setViewMode('grid')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100"
                  >
                    <Grid3X3 className="w-3 h-3" />
                    <span>Return to property cards</span>
                  </button>
                </div>
                {neighborhood?.environmentSummary && (
                  <div className="bg-white/90 backdrop-blur rounded-2xl border border-slate-200 px-4 py-3 text-xs text-slate-600">
                    {neighborhood.environmentSummary}
                  </div>
                )}
                <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
                  <PropertyMap 
                    properties={properties} 
                    height="760px" 
                    selectedCity={filters.city}
                    activePropertyId={activePropertyId}
                    onMarkerClick={(property) => setActivePropertyId(property.id)}
                    nearby={neighborhood?.facilities || null}
                    cityCenter={neighborhood?.center || null}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(p => (
                  <PropertyCard key={p.id} property={p} />
                ))}
              </div>
            )}

            {/* Pagination for Grid View */}
            {viewMode === 'grid' && pagination.totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center space-x-2">
                <button
                  disabled={filters.page === 1}
                  onClick={() => updateFilter('page', filters.page - 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Previous
                </button>
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => updateFilter('page', i + 1)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold transition ${
                      filters.page === i + 1
                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}>
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={filters.page === pagination.totalPages}
                  onClick={() => updateFilter('page', filters.page + 1)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
