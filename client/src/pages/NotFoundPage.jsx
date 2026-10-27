import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Building2 } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';

export default function NotFoundPage() {
  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-lg px-4">
          <div className="w-24 h-24 bg-brand-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-12 h-12 text-brand-500" />
          </div>
          <h1 className="text-8xl font-black text-brand-600 mb-4">404</h1>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Page Not Found</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            The page you're looking for doesn't exist or may have been moved. Let's get you back to finding your perfect home!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition shadow-md">
              <Home className="w-5 h-5" />
              <span>Back to Home</span>
            </Link>
            <Link
              to="/properties"
              className="flex items-center justify-center space-x-2 px-6 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition">
              <Building2 className="w-5 h-5" />
              <span>Browse Properties</span>
            </Link>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

