import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, PlusCircle, Edit2, Trash2, Eye, CheckCircle2, Clock, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { propertyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  approved: { label: 'Live', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
  pending: { label: 'Pending', icon: Clock, color: 'bg-amber-100 text-amber-700' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-rose-100 text-rose-700' }
};

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await propertyApi.getMyProperties();
      setProperties(res.data.properties || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) return;
    setDeletingId(id);
    try {
      await propertyApi.deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete property.');
    } finally {
      setDeletingId(null);
    }
  };

  const stats = {
    total: properties.length,
    approved: properties.filter(p => p.approval_status === 'approved').length,
    pending: properties.filter(p => p.approval_status === 'pending').length,
    inquiries: properties.reduce((acc, p) => acc + (p.inquiry_count || 0), 0)
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Owner Dashboard</h1>
            <p className="text-slate-500 mt-1">Welcome back, {user?.name}! Manage your property listings.</p>
          </div>
          <Link
            to="/add-property"
            className="flex items-center space-x-2 px-5 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 shadow-md shadow-brand-500/25 transition">
            <PlusCircle className="w-5 h-5" />
            <span>Add New Property</span>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Listings', value: stats.total, color: 'from-brand-600 to-brand-700' },
            { label: 'Live Properties', value: stats.approved, color: 'from-emerald-600 to-emerald-700' },
            { label: 'Pending Approval', value: stats.pending, color: 'from-amber-500 to-amber-600' },
            { label: 'Total Inquiries', value: stats.inquiries, color: 'from-indigo-600 to-indigo-700' }
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-md`}>
              <p className="text-3xl font-extrabold">{stat.value}</p>
              <p className="text-sm text-white/80 mt-1 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Properties Table */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 text-brand-600 animate-spin mx-auto" />
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No properties listed yet</h3>
            <p className="text-slate-500 mb-8">Start by adding your first property to attract tenants.</p>
            <Link to="/add-property" className="inline-flex items-center space-x-2 px-6 py-3 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition">
              <PlusCircle className="w-5 h-5" />
              <span>Add Your First Property</span>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Property</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Rent</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Inquiries</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {properties.map(property => {
                    const statusConfig = STATUS_CONFIG[property.approval_status] || STATUS_CONFIG.pending;
                    return (
                      <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-16 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                              <img
                                src={property.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200'}
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200'; }}
                              />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 line-clamp-1">{property.title}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{property.locality}, {property.city}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-slate-900">₹{Number(property.monthly_rent).toLocaleString('en-IN')}</span>
                          <span className="text-slate-500 text-xs">/mo</span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${statusConfig.color}`}>
                            <statusConfig.icon className="w-3.5 h-3.5" />
                            <span>{statusConfig.label}</span>
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center space-x-1.5 text-slate-700 font-semibold">
                            <MessageSquare className="w-4 h-4 text-indigo-500" />
                            <span>{property.inquiry_count || 0}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/properties/${property.id}`}
                              className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                              title="View Property">
                              <Eye className="w-4 h-4" />
                            </Link>
                            <Link
                              to={`/edit-property/${property.id}`}
                              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                              title="Edit Property">
                              <Edit2 className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(property.id)}
                              disabled={deletingId === property.id}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-50"
                              title="Delete Property">
                              {deletingId === property.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

