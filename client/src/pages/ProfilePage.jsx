import React, { useState } from 'react';
import { User, Camera, Lock, Loader2, CheckCircle2, Save } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { authApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    tenant_type: user?.tenant_type || 'student',
    avatar_url: user?.avatar_url || ''
  });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmNew: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setSuccess(''); setError('');
    try {
      const res = await authApi.updateProfile(form);
      updateUser(res.data.user);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmNew) {
      setError('New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    setLoading(true); setSuccess(''); setError('');
    try {
      await authApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setSuccess('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmNew: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8 flex items-center space-x-3">
          <User className="w-7 h-7 text-brand-600" />
          <span>Profile Settings</span>
        </h1>

        {/* Tabs */}
        <div className="flex space-x-1 bg-slate-100 rounded-2xl p-1 mb-8 w-fit">
          {[
            { key: 'profile', label: 'Profile', icon: User },
            { key: 'password', label: 'Security', icon: Lock }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSuccess(''); setError(''); }}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition ${
                tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              <t.icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium rounded-2xl flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 font-medium rounded-2xl">
            {error}
          </div>
        )}

        {tab === 'profile' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            {/* Avatar */}
            <div className="flex items-center space-x-5 mb-8 pb-8 border-b border-slate-100">
              <div className="relative">
                <img
                  src={form.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`}
                  alt="Avatar"
                  className="w-20 h-20 rounded-2xl border-2 border-brand-200 object-cover"
                  onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'U')}`; }}
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
                <p className="text-slate-500 text-sm capitalize">{user?.role} account</p>
                <p className="text-xs text-slate-400 mt-0.5">Member since {new Date(user?.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar Image URL</label>
                <input
                  type="url"
                  value={form.avatar_url}
                  onChange={(e) => setForm(p => ({ ...p, avatar_url: e.target.value }))}
                  placeholder="https://example.com/your-photo.jpg"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>

              {user?.role === 'tenant' && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tenant Type</label>
                  <div className="flex space-x-3">
                    {['student', 'family'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, tenant_type: t }))}
                        className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition ${
                          form.tenant_type === t
                            ? 'border-brand-500 bg-brand-50 text-brand-700'
                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
                <label className="block text-sm font-semibold text-slate-500 mb-1">Email (cannot be changed)</label>
                <p className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100">{user?.email}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 disabled:opacity-50 transition shadow-md shadow-brand-500/25">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                <span>{loading ? 'Saving...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        )}

        {tab === 'password' && (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center space-x-2">
              <Lock className="w-5 h-5 text-slate-500" />
              <span>Change Password</span>
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords(p => ({ ...p, currentPassword: e.target.value }))}
                  required
                  placeholder="Enter current password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                  required
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwords.confirmNew}
                  onChange={(e) => setPasswords(p => ({ ...p, confirmNew: e.target.value }))}
                  required
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 disabled:opacity-50 transition">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-5 h-5" />}
                <span>{loading ? 'Updating...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

