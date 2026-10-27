import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, Search, GraduationCap, Home, 
  Building2, Clock, CheckCircle2, ArrowRight, User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import PropertyCard from '../components/PropertyCard';
import { favoriteApi, inquiryApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function TenantDashboardPage() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [favRes, inqRes] = await Promise.all([
          favoriteApi.getFavorites(),
          inquiryApi.getMyInquiries()
        ]);
        setFavorites((favRes.data.favorites || []).slice(0, 3));
        setInquiries((inqRes.data.inquiries || []).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = {
    saved: favorites.length,
    pending: inquiries.filter(i => i.status === 'pending').length,
    accepted: inquiries.filter(i => i.status === 'accepted').length
  };

  const STATUS_COLORS = {
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    completed: 'bg-blue-100 text-blue-700'
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="flex items-center space-x-4">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'T')}`}
              alt={user?.name}
              className="w-16 h-16 rounded-2xl border-2 border-brand-200 object-cover"
            />
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
              <div className="flex items-center space-x-2 mt-1">
                {user?.tenant_type === 'student' ? (
                  <span className="flex items-center space-x-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    <GraduationCap className="w-3.5 h-3.5" />
                    <span>Student Tenant</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    <Home className="w-3.5 h-3.5" />
                    <span>Family Tenant</span>
                  </span>
                )}
                <span className="text-xs text-slate-400">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Saved Properties', value: stats.saved, icon: Heart, color: 'bg-rose-50 text-rose-600 border-rose-200', link: '/favorites' },
            { label: 'Pending Inquiries', value: stats.pending, icon: Clock, color: 'bg-amber-50 text-amber-600 border-amber-200', link: '/my-inquiries' },
            { label: 'Accepted Inquiries', value: stats.accepted, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', link: '/my-inquiries' }
          ].map((s, i) => (
            <Link key={i} to={s.link} className={`${s.color} border rounded-2xl p-5 text-center hover:shadow-md transition`}>
              <s.icon className={`w-6 h-6 mx-auto mb-2`} />
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="text-xs font-semibold mt-1">{s.label}</p>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Browse All Properties', icon: Search, link: '/properties', color: 'bg-brand-600 hover:bg-brand-700 text-white' },
            { label: user?.tenant_type === 'student' ? 'Student Rooms' : 'Family Flats', icon: GraduationCap, link: `/properties?tenantCategory=${user?.tenant_type}`, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
            { label: 'My Saved Homes', icon: Heart, link: '/favorites', color: 'bg-rose-600 hover:bg-rose-700 text-white' },
            { label: 'My Inquiries', icon: MessageSquare, link: '/my-inquiries', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' }
          ].map((a, i) => (
            <Link key={i} to={a.link} className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-semibold transition shadow-sm ${a.color}`}>
              <a.icon className="w-5 h-5" />
              <span className="text-sm">{a.label}</span>
            </Link>
          ))}
        </div>

        {/* Recent Inquiries */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recent Inquiries</h2>
              <Link to="/my-inquiries" className="text-sm text-brand-600 font-semibold hover:text-brand-700 flex items-center space-x-1">
                <span>View All</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl p-4 animate-pulse border border-slate-100">
                    <div className="h-4 bg-slate-200 rounded-lg w-3/4 mb-2" />
                    <div className="h-3 bg-slate-200 rounded-lg w-1/2" />
                  </div>
                ))}
              </div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-semibold text-slate-700">No inquiries yet</p>
                <p className="text-sm text-slate-500 mt-1">Find a property you like and send an inquiry to the owner.</p>
                <Link to="/properties" className="inline-block mt-4 text-brand-600 font-semibold hover:text-brand-700 text-sm">
                  Browse Properties →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map(inq => (
                  <Link key={inq.id} to="/my-inquiries" className="block bg-white rounded-2xl border border-slate-100 p-4 hover:border-brand-200 hover:shadow-sm transition">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{inq.property_title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{inq.property_locality}, {inq.property_city}</p>
                        <p className="text-xs text-slate-400 mt-1 italic line-clamp-1">"{inq.message}"</p>
                      </div>
                      <span className={`flex-shrink-0 ml-3 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${STATUS_COLORS[inq.status]}`}>
                        {inq.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Profile Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-5">Your Profile</h2>
              <div className="space-y-4">
                {[
                  { label: 'Name', value: user?.name },
                  { label: 'Email', value: user?.email },
                  { label: 'Phone', value: user?.phone },
                  { label: 'Account Type', value: `${user?.role} (${user?.tenant_type || 'N/A'})` },
                  { label: 'Member Since', value: new Date(user?.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) }
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-2 text-sm py-2 border-b border-slate-100 last:border-0">
                    <span className="text-slate-500 font-medium flex-shrink-0">{label}</span>
                    <span className="text-slate-900 font-semibold text-right capitalize">{value}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/profile"
                className="mt-5 w-full flex items-center justify-center space-x-2 py-2.5 border border-brand-200 text-brand-600 font-semibold rounded-xl hover:bg-brand-50 transition text-sm">
                <User className="w-4 h-4" />
                <span>Edit Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

