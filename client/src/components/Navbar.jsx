import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Search, 
  Heart, 
  MessageSquare, 
  PlusCircle, 
  User, 
  LogOut, 
  ShieldCheck, 
  Bot, 
  Menu, 
  X,
  Building,
  GraduationCap,
  Users
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isOwner, isAdmin, isTenant, favoritesCount, logout, demoLogin } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserDropdownOpen(false);
  };

  const handleDemoSwitch = async (roleKey) => {
    await demoLogin(roleKey);
    setDemoMenuOpen(false);
    if (roleKey === 'admin') navigate('/admin');
    else if (roleKey === 'owner') navigate('/owner-dashboard');
    else navigate('/tenant-dashboard');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
      {/* Top Demo Bar for Reviewers & Examiners */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 hidden md:flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-medium text-slate-200">RentEase Platform</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">MySQL Relational DB &bull; Student & Family Accommodations</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-slate-400">1-Click Demo Login:</span>
          <button 
            onClick={() => handleDemoSwitch('tenant-student')}
            className="px-2 py-0.5 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/50 transition">
            🎓 Student Tenant
          </button>
          <button 
            onClick={() => handleDemoSwitch('tenant-family')}
            className="px-2 py-0.5 rounded bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 transition">
            👨‍👩‍👧 Family Tenant
          </button>
          <button 
            onClick={() => handleDemoSwitch('owner')}
            className="px-2 py-0.5 rounded bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 transition">
            🏠 Property Owner
          </button>
          <button 
            onClick={() => handleDemoSwitch('admin')}
            className="px-2 py-0.5 rounded bg-purple-900/60 hover:bg-purple-800 text-purple-200 border border-purple-700/50 transition">
            ⚡ Admin
          </button>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">Rent<span className="text-brand-600">Ease</span></span>
                <span className="text-[10px] bg-brand-100 text-brand-700 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">v2.0</span>
              </div>
              <p className="text-[10px] text-slate-500 -mt-1 font-medium hidden sm:block">House Rental & Student Living</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1 text-sm font-semibold text-slate-700">
            <Link 
              to="/" 
              className={`px-3 py-2 rounded-lg transition-colors ${isActive('/') ? 'text-brand-600 bg-brand-50' : 'hover:text-brand-600 hover:bg-slate-100'}`}>
              Home
            </Link>
            <Link 
              to="/properties" 
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${isActive('/properties') ? 'text-brand-600 bg-brand-50' : 'hover:text-brand-600 hover:bg-slate-100'}`}>
              <Search className="w-4 h-4" />
              <span>Browse All</span>
            </Link>
            <Link 
              to="/properties?tenantCategory=student" 
              className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-slate-100 transition-colors flex items-center space-x-1.5 text-blue-700">
              <GraduationCap className="w-4 h-4" />
              <span>Student PG & Rooms</span>
            </Link>
            <Link 
              to="/properties?tenantCategory=family" 
              className="px-3 py-2 rounded-lg hover:text-brand-600 hover:bg-slate-100 transition-colors flex items-center space-x-1.5 text-slate-700">
              <Users className="w-4 h-4" />
              <span>Family Flats & Houses</span>
            </Link>
            <Link 
              to="/assistant" 
              className={`px-3 py-2 rounded-lg transition-colors flex items-center space-x-1.5 ${isActive('/assistant') ? 'text-brand-600 bg-brand-50' : 'hover:text-brand-600 hover:bg-slate-100'}`}>
              <Bot className="w-4 h-4 text-brand-600" />
              <span>AI Assistant</span>
            </Link>
          </nav>

          {/* Right Action Icons / Profile */}
          <div className="flex items-center space-x-3">
            {/* Favorites Icon */}
            <Link 
              to="/favorites" 
              className="relative p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="My Saved Properties">
              <Heart className="w-5 h-5" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                  {favoritesCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                {/* User Dropdown Trigger */}
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 pl-2 pr-3 rounded-full border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition shadow-sm">
                  <img 
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user?.name || 'User')}`} 
                    alt={user?.name}
                    className="w-8 h-8 rounded-full border border-brand-200 object-cover" 
                  />
                  <div className="text-left hidden md:block">
                    <p className="text-xs font-bold text-slate-900 leading-tight truncate max-w-[110px]">{user?.name}</p>
                    <span className="text-[10px] font-medium text-brand-600 uppercase tracking-wide">
                      {user?.role} {user?.tenant_type ? `(${user?.tenant_type})` : ''}
                    </span>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div 
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 capitalize">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1 text-sm font-medium text-slate-700">
                      {/* Role Dashboard Routing */}
                      {isAdmin && (
                        <>
                          <Link
                            to="/admin"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-purple-700">
                            <ShieldCheck className="w-4 h-4 text-purple-600" />
                            <span>Admin Dashboard</span>
                          </Link>
                          <Link
                            to="/owner-inquiries"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-emerald-700">
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            <span>All Inquiries & Visits</span>
                          </Link>
                        </>
                      )}

                      {isOwner && (
                        <>
                          <Link
                            to="/owner-dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-slate-700">
                            <Building className="w-4 h-4 text-brand-600" />
                            <span>My Properties</span>
                          </Link>
                          <Link
                            to="/owner-inquiries"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-slate-700">
                            <MessageSquare className="w-4 h-4 text-emerald-600" />
                            <span>Tenant Inquiries</span>
                          </Link>
                          <Link
                            to="/add-property"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-brand-600 font-semibold">
                            <PlusCircle className="w-4 h-4 text-brand-600" />
                            <span>Add New Property</span>
                          </Link>
                        </>
                      )}

                      {isTenant && (
                        <>
                          <Link
                            to="/tenant-dashboard"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-slate-700">
                            <Home className="w-4 h-4 text-brand-600" />
                            <span>Tenant Dashboard</span>
                          </Link>
                          <Link
                            to="/my-inquiries"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-slate-700">
                            <MessageSquare className="w-4 h-4 text-indigo-600" />
                            <span>My Inquiries</span>
                          </Link>
                        </>
                      )}

                      <Link
                        to="/favorites"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-slate-700">
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Saved Favorites</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 hover:bg-brand-50 text-slate-700">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Profile Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2.5 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 w-full text-left">
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-brand-600 rounded-lg hover:bg-slate-100 transition">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm shadow-brand-500/25 transition">
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-6 space-y-3">
          <div className="space-y-1">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
              Home
            </Link>
            <Link 
              to="/properties" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
              Browse Properties
            </Link>
            <Link 
              to="/properties?tenantCategory=student" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-semibold text-blue-700 hover:bg-slate-100">
              Student Accommodation
            </Link>
            <Link 
              to="/properties?tenantCategory=family" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-semibold text-slate-800 hover:bg-slate-100">
              Family Houses
            </Link>
            <Link 
              to="/assistant" 
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg font-semibold text-brand-600 hover:bg-slate-100">
              AI Chatbot Assistant
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Switch Demo Account</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button 
                onClick={() => { handleDemoSwitch('tenant-student'); setMobileMenuOpen(false); }}
                className="p-2 rounded bg-blue-50 text-blue-700 text-left border border-blue-200">
                🎓 Student
              </button>
              <button 
                onClick={() => { handleDemoSwitch('tenant-family'); setMobileMenuOpen(false); }}
                className="p-2 rounded bg-indigo-50 text-indigo-700 text-left border border-indigo-200">
                👨‍👩‍👧 Family
              </button>
              <button 
                onClick={() => { handleDemoSwitch('owner'); setMobileMenuOpen(false); }}
                className="p-2 rounded bg-emerald-50 text-emerald-700 text-left border border-emerald-200">
                🏠 Owner
              </button>
              <button 
                onClick={() => { handleDemoSwitch('admin'); setMobileMenuOpen(false); }}
                className="p-2 rounded bg-purple-50 text-purple-700 text-left border border-purple-200">
                ⚡ Admin
              </button>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2">
              <Link 
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700">
                Sign In
              </Link>
              <Link 
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-brand-600 text-white font-semibold shadow">
                Register New Account
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

