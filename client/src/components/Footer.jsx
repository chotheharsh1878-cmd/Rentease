import React from 'react';
import { Link } from 'react-router-dom';
import { Building, ShieldCheck, Heart, Mail, Phone, MapPin, Database, Sparkles } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-md">
                <Building className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-2xl text-white tracking-tight">Rent<span className="text-brand-400">Ease</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Find a Place You'll Love to Call Home. Bridging the gap for students and families looking for verified, budget-friendly rooms, PGs, flats, and houses across India.
            </p>
            <div className="pt-2 flex items-center space-x-2 text-xs text-slate-400">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Strictly Powered by MySQL Relational DB & Express REST APIs</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>AI Chatbot with Gemini LLM & Parameterized SQL Fallbacks</span>
            </div>
          </div>

          {/* Student Accommodations */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">For Students</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/properties?tenantCategory=student&maxRent=5000" className="hover:text-white transition">
                  Rooms under ₹5,000
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=PG&tenantCategory=student" className="hover:text-white transition">
                  Student PGs with Meals
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=hostel" className="hover:text-white transition">
                  College Hostels
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=shared+accommodation" className="hover:text-white transition">
                  Shared Flats & Co-Living
                </Link>
              </li>
              <li>
                <Link to="/assistant" className="hover:text-brand-400 transition flex items-center space-x-1">
                  <span>Ask AI for Budget Rooms</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Family Accommodations */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">For Families</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/properties?tenantCategory=family&bedrooms=1" className="hover:text-white transition">
                  1 BHK Apartments
                </Link>
              </li>
              <li>
                <Link to="/properties?tenantCategory=family&bedrooms=2" className="hover:text-white transition">
                  2 BHK Gated Societies
                </Link>
              </li>
              <li>
                <Link to="/properties?propertyType=house&tenantCategory=family" className="hover:text-white transition">
                  Independent Villas & Houses
                </Link>
              </li>
              <li>
                <Link to="/properties?furnishingStatus=furnished" className="hover:text-white transition">
                  Fully Furnished Flats
                </Link>
              </li>
              <li>
                <Link to="/properties?city=Pune" className="hover:text-white transition">
                  Rentals in Pune
                </Link>
              </li>
            </ul>
          </div>

          {/* Quick Help & Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">Platform & Support</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li>
                <Link to="/assistant" className="hover:text-white transition">
                  RentEase AI Assistant
                </Link>
              </li>
              <li>
                <Link to="/add-property" className="hover:text-white transition">
                  List Your Property
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Owner Portal
                </Link>
              </li>
              <li>
                <span className="flex items-center space-x-2 text-slate-400">
                  <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>support@rentease.com</span>
                </span>
              </li>
              <li>
                <span className="flex items-center space-x-2 text-slate-400">
                  <Phone className="w-4 h-4 text-brand-400 shrink-0" />
                  <span>+91 98230 00001</span>
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} RentEase – House Rental & Student Accommodation Platform. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span>Built with React.js &bull; Node.js &bull; Express.js &bull; MySQL</span>
            <span className="text-slate-600">|</span>
            <span className="text-brand-400 font-medium">Industry Standard Stack</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

