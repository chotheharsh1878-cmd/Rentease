import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, IndianRupee, SlidersHorizontal } from 'lucide-react';

export default function SearchBar({ initialValues = {}, onSearch, compact = false }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState(initialValues.search || '');
  const [city, setCity] = useState(initialValues.city || '');
  const [maxRent, setMaxRent] = useState(initialValues.maxRent || '');
  const [category, setCategory] = useState(initialValues.tenantCategory || '');

  const cities = ['Pune', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi', 'Noida', 'Ahmedabad', 'Chennai'];
  const rentOptions = [
    { label: 'Up to ₹5,000', value: '5000' },
    { label: 'Up to ₹10,000', value: '10000' },
    { label: 'Up to ₹15,000', value: '15000' },
    { label: 'Up to ₹25,000', value: '25000' },
    { label: 'Up to ₹50,000', value: '50000' }
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (city) params.set('city', city);
    if (maxRent) params.set('maxRent', maxRent);
    if (category) params.set('tenantCategory', category);

    if (onSearch) {
      onSearch(Object.fromEntries(params));
    } else {
      navigate(`/properties?${params.toString()}`);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search city, locality..."
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
          />
        </div>
        <button type="submit" className="px-4 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition">
          Search
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/15 border border-white/50 p-2">
        <div className="flex flex-col lg:flex-row gap-1">
          {/* Keyword search */}
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keyword, locality, amenity..."
              className="w-full pl-12 pr-4 py-4 rounded-xl text-slate-800 font-medium placeholder-slate-400 focus:ring-2 focus:ring-brand-500 focus:bg-brand-50/30 outline-none transition-all"
            />
          </div>

          <div className="hidden lg:block w-px bg-slate-200 my-2" />

          {/* City dropdown */}
          <div className="relative group">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="pl-12 pr-8 py-4 rounded-xl text-slate-700 font-medium bg-transparent focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer min-w-[170px]">
              <option value="">Any City</option>
              {cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="hidden lg:block w-px bg-slate-200 my-2" />

          {/* Budget */}
          <div className="relative group">
            <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <select
              value={maxRent}
              onChange={(e) => setMaxRent(e.target.value)}
              className="pl-12 pr-8 py-4 rounded-xl text-slate-700 font-medium bg-transparent focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer min-w-[170px]">
              <option value="">Any Budget</option>
              {rentOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="hidden lg:block w-px bg-slate-200 my-2" />

          {/* Category */}
          <div className="relative group">
            <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="pl-12 pr-8 py-4 rounded-xl text-slate-700 font-medium bg-transparent focus:ring-2 focus:ring-brand-500 outline-none appearance-none cursor-pointer min-w-[160px]">
              <option value="">Students & Families</option>
              <option value="student">Students Only</option>
              <option value="family">Families Only</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="flex items-center justify-center space-x-2 px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md shadow-brand-500/30 transition-all hover:scale-[1.02] active:scale-95 whitespace-nowrap">
            <Search className="w-5 h-5" />
            <span>Search Properties</span>
          </button>
        </div>
      </div>
    </form>
  );
}

