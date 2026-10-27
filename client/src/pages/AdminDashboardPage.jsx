import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Building2, MessageSquare, CheckCircle2, Clock, XCircle,
  ShieldCheck, Loader2, AlertTriangle, Eye, Trash2, ToggleLeft, ToggleRight
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { adminApi } from '../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, pendingRes] = await Promise.all([
        adminApi.getDashboard(),
        adminApi.getUsers(),
        adminApi.getPendingProperties()
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users || []);
      setPendingProperties(pendingRes.data.properties || []);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, status) => {
    try {
      await adminApi.updateApproval(id, status);
      setPendingProperties(prev => prev.filter(p => p.id !== id));
      load(); // Refresh stats
    } catch (err) {
      alert('Failed to update property approval.');
    }
  };

  const handleToggleUser = async (userId, currentActive) => {
    try {
      await adminApi.toggleUserActive(userId, !currentActive);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !currentActive } : u));
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  const handleDeleteUser = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${name}"? All their data will be removed.`)) return;
    try {
      await adminApi.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    }
  };

  const TABS = [
    { key: 'overview', label: 'Dashboard Overview', icon: ShieldCheck },
    { key: 'pending', label: `Pending Approval (${pendingProperties.length})`, icon: Clock },
    { key: 'users', label: `User Management (${users.length})`, icon: Users }
  ];

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 flex items-center space-x-3">
              <ShieldCheck className="w-8 h-8 text-purple-600" />
              <span>Admin Control Panel</span>
            </h1>
            <p className="text-slate-500 mt-1">Manage the RentEase platform: users, properties, and approvals.</p>
          </div>
          <span className="px-4 py-2 bg-purple-100 text-purple-700 font-bold rounded-full text-sm">
            Administrator
          </span>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 rounded-2xl p-1 mb-8">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex-1 justify-center ${
                activeTab === tab.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}>
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.key.charAt(0).toUpperCase() + tab.key.slice(1)}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: stats.users.total_users, sub: `${stats.users.total_owners} owners, ${stats.users.total_tenants} tenants`, color: 'from-brand-600 to-brand-700', icon: Users },
                { label: 'Total Properties', value: stats.properties.total_properties, sub: `${stats.properties.approved_properties} approved`, color: 'from-emerald-600 to-emerald-700', icon: Building2 },
                { label: 'Pending Approvals', value: stats.properties.pending_approvals, sub: 'Awaiting review', color: 'from-amber-500 to-amber-600', icon: Clock },
                { label: 'Total Inquiries', value: stats.inquiries.total_inquiries, sub: `${stats.inquiries.pending_inquiries} pending`, color: 'from-indigo-600 to-indigo-700', icon: MessageSquare }
              ].map((s, i) => (
                <div key={i} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-md`}>
                  <div className="flex items-center justify-between mb-3">
                    <s.icon className="w-6 h-6 text-white/80" />
                  </div>
                  <p className="text-3xl font-extrabold">{s.value || 0}</p>
                  <p className="text-sm font-bold mt-1">{s.label}</p>
                  <p className="text-xs text-white/70 mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Avg Rent */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Student Tenants', value: stats.users.total_students || 0, icon: '🎓' },
                { label: 'Family Tenants', value: stats.users.total_families || 0, icon: '👨‍👩‍👧' },
                { label: 'Avg. Monthly Rent', value: `₹${Math.round(stats.properties.avg_rent || 0).toLocaleString('en-IN')}`, icon: '💰' }
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
                  <p className="text-3xl mb-2">{s.icon}</p>
                  <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                  <p className="text-sm text-slate-500 font-medium mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Properties */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Recently Added Properties</h3>
              <div className="space-y-3">
                {stats.recentProperties?.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.city} · ₹{Number(p.monthly_rent).toLocaleString('en-IN')}/mo · by {p.owner_name}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      p.approval_status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      p.approval_status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>
                      {p.approval_status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PENDING PROPERTIES TAB */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingProperties.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700">All caught up!</h3>
                <p className="text-slate-500 text-sm mt-1">No properties are waiting for approval.</p>
              </div>
            ) : pendingProperties.map(property => (
              <div key={property.id} className="bg-white rounded-2xl border border-amber-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <img
                    src={property.primary_image || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300'}
                    alt={property.title}
                    className="w-full sm:w-32 h-24 object-cover rounded-xl flex-shrink-0"
                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=300'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{property.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {property.locality}, {property.city} · ₹{Number(property.monthly_rent).toLocaleString('en-IN')}/mo
                        </p>
                        <p className="text-sm text-slate-500">
                          {property.property_type?.toUpperCase()} · {property.bedrooms} BHK · {property.furnishing_status}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          Owner: {property.owner_name} ({property.owner_email})
                        </p>
                      </div>
                      <Link
                        to={`/properties/${property.id}`}
                        className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition flex-shrink-0"
                        title="Preview Property">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                    <p className="text-sm text-slate-600 mt-2 line-clamp-2">{property.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        onClick={() => handleApproval(property.id, 'approved')}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Publish</span>
                      </button>
                      <button
                        onClick={() => handleApproval(property.id, 'rejected')}
                        className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 transition shadow-sm">
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USER MANAGEMENT TAB */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</th>
                    <th className="text-left px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className={`hover:bg-slate-50 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                            {u.name?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                          u.role === 'owner' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role} {u.tenant_type ? `(${u.tenant_type})` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-slate-700 font-semibold">
                        {u.properties_count || 0}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {u.is_active ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          {u.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => handleToggleUser(u.id, u.is_active)}
                                title={u.is_active ? 'Deactivate user' : 'Activate user'}
                                className={`p-2 rounded-lg transition ${
                                  u.is_active 
                                    ? 'text-amber-500 hover:bg-amber-50' 
                                    : 'text-emerald-500 hover:bg-emerald-50'
                                }`}>
                                {u.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete user">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

