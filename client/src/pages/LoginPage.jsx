import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email.trim(), password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'owner') navigate('/owner-dashboard');
      else navigate(from);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (roleKey) => {
    setLoading(true);
    try {
      const user = await demoLogin(roleKey);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'owner') navigate('/owner-dashboard');
      else navigate('/tenant-dashboard');
    } catch (err) {
      setError('Demo login failed. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const DEMO_ACCOUNTS = [
    { key: 'tenant-student', label: '🎓 Student Tenant', email: 'rahul.student@rentease.com', color: 'bg-blue-50 border-blue-200 text-blue-800 hover:bg-blue-100' },
    { key: 'tenant-family', label: '👨‍👩‍👧 Family Tenant', email: 'priya.family@rentease.com', color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100' },
    { key: 'owner', label: '🏠 Property Owner', email: 'amit.owner@rentease.com', color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' },
    { key: 'admin', label: '⚡ Administrator', email: 'admin@rentease.com', color: 'bg-purple-50 border-purple-200 text-purple-800 hover:bg-purple-100' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-950 via-slate-900 to-slate-900 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-16">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-extrabold text-white">Rent<span className="text-brand-400">Ease</span></span>
        </Link>

        <div>
          <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
            Your perfect<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
              home awaits
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
            Students and families find verified, affordable rental properties across India with RentEase.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {['Student Rooms ₹2,800+', 'Family Flats ₹9,500+', 'AI Chatbot Advisor', '12 Major Cities'].map(f => (
              <div key={f} className="flex items-center space-x-2 text-sm text-slate-300">
                <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-3 h-3 text-brand-400" />
                </div>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-sm">© 2026 RentEase Platform. All rights reserved.</p>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-white">Rent<span className="text-brand-400">Ease</span></span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
            <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Welcome back!</h2>
            <p className="text-slate-500 text-sm mb-8">Sign in to your RentEase account</p>

            {/* Error */}
            {error && (
              <div className="mb-5 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700">Password</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 pr-12 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center space-x-2 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-md shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              </button>
            </form>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs text-slate-400 uppercase tracking-wider">
                <span className="bg-white px-3">Quick Demo Access</span>
              </div>
            </div>

            {/* Demo Logins */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.key}
                  onClick={() => handleDemo(acc.key)}
                  disabled={loading}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition text-left disabled:opacity-50 ${acc.color}`}>
                  <div className="font-bold">{acc.label}</div>
                  <div className="text-[10px] opacity-70 truncate mt-0.5">{acc.email}</div>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 mt-6">
              New to RentEase?{' '}
              <Link to="/register" className="text-brand-600 font-bold hover:text-brand-700">
                Create an account →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

