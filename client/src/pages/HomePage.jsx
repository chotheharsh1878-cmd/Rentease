import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, GraduationCap, Users, ArrowRight, Star, Building2, 
  CheckCircle2, ShieldCheck, Zap, Heart, MapPin, IndianRupee,
  ChevronRight, Smartphone, Award
} from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import { propertyApi, faqApi } from '../services/api';

const STATS = [
  { value: '2,400+', label: 'Listed Properties', icon: Building2 },
  { value: '18,000+', label: 'Happy Tenants', icon: Heart },
  { value: '12', label: 'Major Cities', icon: MapPin },
  { value: '₹2,400', label: 'Starting Rent', icon: IndianRupee }
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search & Filter',
    desc: 'Use our powerful search to filter properties by city, budget, type, and amenities.',
    icon: Search,
    color: 'bg-blue-500'
  },
  {
    step: '02',
    title: 'Compare & Save',
    desc: 'View detailed property pages, compare options and save your favourites.',
    icon: Heart,
    color: 'bg-rose-500'
  },
  {
    step: '03',
    title: 'Contact Owner',
    desc: 'Submit a rental inquiry directly and get quick responses from verified owners.',
    icon: Smartphone,
    color: 'bg-emerald-500'
  },
  {
    step: '04',
    title: 'Move In!',
    desc: 'Finalize the agreement, pay the deposit, and move into your new home.',
    icon: Award,
    color: 'bg-amber-500'
  }
];

const BENEFITS = [
  { icon: ShieldCheck, title: 'Verified Listings', desc: 'Every property is admin-reviewed before going live.', color: 'text-brand-600' },
  { icon: Zap, title: 'AI-Powered Search', desc: 'Our Gemini AI assistant helps you find rooms with natural language.', color: 'text-amber-500' },
  { icon: GraduationCap, title: 'Student Focused', desc: 'Dedicated filters for student rooms, PGs, and shared flats under ₹5,000.', color: 'text-blue-600' },
  { icon: Users, title: 'Family Friendly', desc: 'Find spacious, child-friendly apartments in gated societies.', color: 'text-emerald-600' }
];

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [faqs, setFaqs] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [featRes, faqRes] = await Promise.all([
          propertyApi.getFeatured(6),
          faqApi.getFaqs()
        ]);
        setFeatured(featRes.data.properties || []);
        setFaqs(faqRes.data.faqs || []);
      } catch (err) {
        console.error('Home page load error:', err);
      } finally {
        setLoadingFeatured(false);
      }
    };
    load();
  }, []);

  return (
    <MainLayout>
      {/* HERO SECTION */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1920')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/70 to-slate-900/80" />
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-brand-600/10 blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="max-w-4xl">
            {/* Category Badges */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link
                to="/properties?tenantCategory=student"
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-200 rounded-full text-sm font-semibold hover:bg-blue-500/30 transition backdrop-blur-sm">
                <GraduationCap className="w-4 h-4" />
                <span>Student Rooms from ₹2,800/mo</span>
              </Link>
              <Link
                to="/properties?tenantCategory=family"
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 rounded-full text-sm font-semibold hover:bg-emerald-500/30 transition backdrop-blur-sm">
                <Users className="w-4 h-4" />
                <span>Family Flats from ₹9,500/mo</span>
              </Link>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Find a Place
              <span className="block mt-1 text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400">
                You'll Love to
              </span>
              <span className="block">Call Home.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl leading-relaxed">
              RentEase connects students and families with verified, affordable rooms, PGs, flats, and houses across India's top cities.
            </p>

            {/* Search Box */}
            <SearchBar />

            {/* Popular Cities */}
            <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2">
              <span className="text-sm text-slate-400 font-medium">Popular cities:</span>
              {['Pune', 'Bangalore', 'Mumbai', 'Hyderabad', 'Delhi'].map(c => (
                <Link
                  key={c}
                  to={`/properties?city=${c}`}
                  className="text-sm font-semibold text-brand-300 hover:text-white transition underline underline-offset-2">
                  {c}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats Strip */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map((stat, idx) => (
              <div key={idx} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-5 text-center hover:bg-white/15 transition">
                <stat.icon className="w-6 h-6 text-brand-300 mx-auto mb-2" />
                <p className="text-2xl font-extrabold text-white">{stat.value}</p>
                <p className="text-sm text-slate-400 font-medium mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY CARDS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Find Your Perfect Stay</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Whether you're a student on a budget or a family looking for space – we've got you covered.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Student Card */}
            <Link to="/properties?tenantCategory=student" className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/50 to-transparent group-hover:from-blue-900/95 transition-all duration-500" />
              <div className="relative p-10 flex flex-col min-h-[340px] justify-end">
                <span className="inline-flex items-center space-x-2 px-3 py-1.5 bg-blue-500/30 border border-blue-400/40 text-blue-200 rounded-full text-xs font-bold uppercase tracking-wider mb-4 w-fit backdrop-blur-sm">
                  <GraduationCap className="w-4 h-4" />
                  <span>Student Accommodation</span>
                </span>
                <h3 className="text-3xl font-extrabold text-white mb-3 leading-tight">PGs, Rooms & Hostels<br />Under ₹5,000</h3>
                <p className="text-blue-100 mb-6 text-sm leading-relaxed">Safe, Wi-Fi enabled student rooms near universities. Includes shared flats, girls PGs, and boys hostels.</p>
                <div className="flex items-center space-x-2 text-white font-bold group-hover:space-x-3 transition-all">
                  <span>Explore Student Homes</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>

            {/* Family Card */}
            <Link to="/properties?tenantCategory=family" className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800')] bg-cover bg-center" />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/50 to-transparent group-hover:from-emerald-900/95 transition-all duration-500" />
              <div className="relative p-10 flex flex-col min-h-[340px] justify-end">
                <span className="inline-flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-4 w-fit backdrop-blur-sm">
                  <Users className="w-4 h-4" />
                  <span>Family Housing</span>
                </span>
                <h3 className="text-3xl font-extrabold text-white mb-3 leading-tight">Spacious 1, 2 & 3 BHK<br />Family Apartments</h3>
                <p className="text-emerald-100 mb-6 text-sm leading-relaxed">Child-friendly gated societies with parking, security, and modern amenities. Perfect for nuclear and joint families.</p>
                <div className="flex items-center space-x-2 text-white font-bold group-hover:space-x-3 transition-all">
                  <span>Browse Family Homes</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-2">Handpicked Listings</p>
              <h2 className="text-4xl font-extrabold text-slate-900">Featured Properties</h2>
            </div>
            <Link
              to="/properties"
              className="hidden sm:flex items-center space-x-2 text-brand-600 hover:text-brand-700 font-semibold group">
              <span>View All Listings</span>
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-52 bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
                    <div className="h-5 bg-slate-200 rounded-lg" />
                    <div className="h-4 bg-slate-200 rounded-lg w-2/3" />
                    <div className="h-8 bg-slate-100 rounded-lg mt-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : featured.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(p => <PropertyCard key={p.id} property={p} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="font-medium">No featured properties yet. Start the MySQL server and run the seed file.</p>
            </div>
          )}

          <div className="text-center mt-10">
            <Link
              to="/properties"
              className="inline-flex items-center space-x-2 px-8 py-4 bg-brand-600 text-white font-bold rounded-2xl hover:bg-brand-700 shadow-lg shadow-brand-500/25 transition-all hover:scale-105">
              <Search className="w-5 h-5" />
              <span>Browse All Available Properties</span>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-2">Simple & Fast</p>
            <h2 className="text-4xl font-extrabold text-slate-900">How RentEase Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step, idx) => (
              <div key={idx} className="relative text-center group">
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute top-10 left-1/2 w-full border-t-2 border-dashed border-slate-200 hidden lg:block" />
                )}
                <div className={`relative w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-9 h-9 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 bg-slate-900 text-white text-xs font-black rounded-full flex items-center justify-center">
                    {step.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="py-20 bg-gradient-to-br from-brand-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-brand-300 font-bold uppercase tracking-wider text-sm mb-2">Why Choose Us</p>
            <h2 className="text-4xl font-extrabold">The RentEase Advantage</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => (
              <div key={i} className="bg-white/10 border border-white/10 rounded-2xl p-7 hover:bg-white/15 transition-colors group">
                <div className={`w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <b.icon className={`w-6 h-6 ${b.color}`} />
                </div>
                <h3 className="font-bold text-lg mb-2">{b.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQS */}
      {faqs.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-2">Got Questions?</p>
              <h2 className="text-4xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-4">
              {faqs.slice(0, 7).map((faq) => (
                <div key={faq.id} className="border border-slate-200 rounded-2xl overflow-hidden hover:border-brand-300 transition-colors">
                  <button
                    onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors">
                    <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                    <ChevronRight className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-300 ${openFaq === faq.id ? 'rotate-90 text-brand-500' : ''}`} />
                  </button>
                  {openFaq === faq.id && (
                    <div className="px-6 pb-5 pt-0 bg-brand-50/30 border-t border-brand-100">
                      <p className="text-slate-600 leading-relaxed text-sm">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-slate-500 text-sm">Still have questions? Ask our</p>
              <Link to="/assistant" className="text-brand-600 font-semibold hover:text-brand-700">
                AI Chatbot Assistant →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA BANNER */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-12 text-center text-white shadow-2xl shadow-brand-500/30 relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMwLTkuOTQtOC4wNi0xOC0xOC0xOFYwYzkuOTQgMCAxOCA4LjA2IDE4IDE4aDIiIGZpbGw9IiNmZmYiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')]" />
            <div className="relative z-10">
              <h2 className="text-4xl font-extrabold mb-4">Own a Property?</h2>
              <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">List your house, flat, PG, or hostel on RentEase and connect with thousands of verified tenants today. Free listing, no commission!</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register"
                  className="px-8 py-4 bg-white text-brand-700 font-bold rounded-2xl hover:bg-blue-50 shadow-lg transition-all hover:scale-105">
                  Register as Owner – Free
                </Link>
                <Link
                  to="/add-property"
                  className="px-8 py-4 bg-white/20 border border-white/30 text-white font-bold rounded-2xl hover:bg-white/30 backdrop-blur-sm transition-all">
                  List a Property Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

