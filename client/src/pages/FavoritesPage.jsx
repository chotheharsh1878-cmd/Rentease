import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Trash2, Building2, Search } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import PropertyCard from '../components/PropertyCard';
import { favoriteApi } from '../services/api';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const res = await favoriteApi.getFavorites();
      setFavorites(res.data.favorites || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
              <Heart className="w-7 h-7 text-rose-500 fill-rose-500" />
              Saved Properties
            </h1>
            <p className="text-slate-500 mt-1">
              {favorites.length > 0 ? `${favorites.length} property saved` : 'No saved properties yet'}
            </p>
          </div>
          <Link 
            to="/properties" 
            className="flex items-center space-x-2 px-5 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition text-sm">
            <Search className="w-4 h-4" />
            <span>Browse More</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse border border-slate-100">
                <div className="h-52 bg-slate-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-slate-200 rounded-lg w-3/4" />
                  <div className="h-4 bg-slate-200 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Heart className="w-10 h-10 text-rose-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No saved properties yet</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">
              Click the heart icon on any property card to save it here for quick access later.
            </p>
            <Link
              to="/properties"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition">
              <Building2 className="w-5 h-5" />
              <span>Start Browsing Properties</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map(fav => (
              <PropertyCard
                key={fav.id || fav.favorite_id}
                property={fav}
                onFavoriteToggle={loadFavorites}
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}

