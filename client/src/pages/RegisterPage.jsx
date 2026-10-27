import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, GraduationCap, Users, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    role: 'tenant', tenant_type: 'student'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (!form.phone.trim() || form.phone.length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role,
        tenant_type: form.role === 'tenant' ? form.tenant_type : undefined
      });
      if (user.role === 'owner') navigate('/owner-dashboard');
      else navigate('/tenant-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-slate-900 to-slate-900 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-2/5 p-16">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">Rent<span className="text-brand-400">Ease</span></span>
        </Link>

        <div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Join<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
              RentEase
            </span><br />
            today!
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-xs">
            Register as a tenant to find your dream home, or as an owner to list your property and connect with thousands of tenants.
          </p>
        </div>

        <p className="text-slate-600 text-sm">© 2026 RentEase Platform. All rights reserved.</p>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Rent<span className="text-brand-400">Ease</span></span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Create your account</h2>
            <p className="text-slate-500 text-sm mb-8">Fill in the details below to get started for free</p>

            {error && (
              <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl">
                {error}
              </div>
            )}

            {/* Role Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-700 mb-3">I want to...</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => update('role', 'tenant')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition ${
                    form.role === 'tenant'
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <Users className={`w-6 h-6 mb-2 ${form.role === 'tenant' ? 'text-brand-600' : 'text-slate-400'}`} />
                  <p className={`font-bold text-sm ${form.role === 'tenant' ? 'text-brand-700' : 'text-slate-700'}`}>Find a Home</p>
                  <p className="text-xs text-slate-500 mt-0.5">As a Tenant</p>
                  {form.role === 'tenant' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => update('role', 'owner')}
                  className={`relative p-4 rounded-2xl border-2 text-left transition ${
                    form.role === 'owner'
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}>
                  <Home className={`w-6 h-6 mb-2 ${form.role === 'owner' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <p className={`font-bold text-sm ${form.role === 'owner' ? 'text-emerald-700' : 'text-slate-700'}`}>List a Property</p>
                  <p className="text-xs text-slate-500 mt-0.5">As an Owner</p>
                  {form.role === 'owner' && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-emerald-600 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Tenant Type selector (only for tenant) */}
            {form.role === 'tenant' && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">I am looking for accommodation as...</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'student', icon: GraduationCap, label: 'Student', desc: 'PGs, Rooms, Hostels' },
                    { key: 'family', icon: Users, label: 'Family', desc: 'Flats, Houses, Villas' }
                  ].map(t => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => update('tenant_type', t.key)}
                      className={`relative p-3.5 rounded-xl border-2 text-left transition flex items-center space-x-3 ${
                        form.tenant_type === t.key ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <t.icon className={`w-5 h-5 flex-shrink-0 ${form.tenant_type === t.key ? 'text-blue-600' : 'text-slate-400'}`} />
                      <div>
                        <p className={`font-bold text-sm ${form.tenant_type === t.key ? 'text-blue-700' : 'text-slate-700'}`}>{t.label}</p>
                        <p className="text-xs text-slate-500">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => update('password', e.target.value)}
                      placeholder="Min 6 characters"
                      required
                      className="w-full px-4 py-3 pr-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="Repeat password"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-md shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition mt-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                <span>{loading ? 'Creating account...' : 'Create Account – Free'}</span>
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-bold hover:text-brand-700">
                Sign in →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

