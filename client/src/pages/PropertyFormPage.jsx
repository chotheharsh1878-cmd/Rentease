import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PlusCircle, Loader2, X, CheckCircle2, ChevronRight } from 'lucide-react';
import MainLayout from '../layouts/MainLayout';
import { propertyApi } from '../services/api';

const AMENITY_OPTIONS = [
  'High-speed Wi-Fi', 'Air Conditioning', 'Geyser', 'RO Water Purifier', 'Washing Machine',
  'Refrigerator', 'Microwave', 'Modular Kitchen', 'Balcony', 'Study Table', 'Wardrobe',
  'Car Parking', 'Two-wheeler Parking', 'Power Backup', '24/7 Water Supply', '24/7 Security',
  'CCTV Cameras', 'Elevator', 'Gym', 'Swimming Pool', 'Clubhouse', 'Housekeeping',
  '3 Times Meals', 'Pet Friendly', 'Intercom', 'Smart TV', 'Piped Gas', 'Solar Water Heater'
];

const EMPTY = {
  title: '', description: '', property_type: 'flat', tenant_category: 'both',
  monthly_rent: '', security_deposit: '', city: '', locality: '', address: '',
  bedrooms: '1', bathrooms: '1', furnishing_status: 'semi-furnished',
  available_from: new Date().toISOString().split('T')[0],
  availability_status: 'available',
  amenities: [], images: ['']
};

export default function PropertyFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isEdit) {
      const load = async () => {
        try {
          const res = await propertyApi.getPropertyById(id);
          const p = res.data.property;
          setForm({
            title: p.title || '',
            description: p.description || '',
            property_type: p.property_type || 'flat',
            tenant_category: p.tenant_category || 'both',
            monthly_rent: p.monthly_rent || '',
            security_deposit: p.security_deposit || '',
            city: p.city || '',
            locality: p.locality || '',
            address: p.address || '',
            bedrooms: String(p.bedrooms || 1),
            bathrooms: String(p.bathrooms || 1),
            furnishing_status: p.furnishing_status || 'semi-furnished',
            available_from: p.available_from?.split('T')[0] || EMPTY.available_from,
            availability_status: p.availability_status || 'available',
            amenities: Array.isArray(p.amenities) ? p.amenities : [],
            images: p.images?.map(i => i.image_url) || ['']
          });
        } catch (err) {
          setError('Failed to load property data.');
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [id, isEdit]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleAmenity = (a) => {
    setForm(prev => ({
      ...prev,
      amenities: prev.amenities.includes(a)
        ? prev.amenities.filter(x => x !== a)
        : [...prev.amenities, a]
    }));
  };

  const updateImage = (idx, val) => {
    const imgs = [...form.images];
    imgs[idx] = val;
    update('images', imgs);
  };

  const addImageField = () => update('images', [...form.images, '']);
  const removeImageField = (idx) => update('images', form.images.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!form.title.trim() || !form.city.trim() || !form.monthly_rent) {
      setError('Title, city, and monthly rent are required.');
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...form,
        monthly_rent: parseFloat(form.monthly_rent),
        security_deposit: parseFloat(form.security_deposit) || 0,
        bedrooms: parseInt(form.bedrooms, 10),
        bathrooms: parseInt(form.bathrooms, 10),
        images: form.images.filter(img => img.trim() !== '')
      };

      if (isEdit) {
        await propertyApi.updateProperty(id, payload);
        setSuccess('Property updated successfully!');
      } else {
        await propertyApi.createProperty(payload);
        setSuccess('Property submitted for admin approval! You can track its status on the Owner Dashboard.');
      }

      setTimeout(() => navigate('/owner-dashboard'), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save property. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-3">
            <span>Dashboard</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 font-semibold">{isEdit ? 'Edit Property' : 'Add New Property'}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            {isEdit ? 'Edit Property Listing' : 'List a New Property'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEdit ? 'Update your property details below.' : 'Fill in the form below. Your listing will be reviewed by the admin before going live.'}
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-2xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium rounded-2xl flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Basic Information</h2>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Property Title *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="e.g. Cozy 1 BHK Apartment near Shivaji Nagar"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description *</label>
              <textarea
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                rows={5}
                placeholder="Describe the property in detail: highlights, nearby landmarks, house rules, surroundings, etc."
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Property Type *</label>
                <select
                  value={form.property_type}
                  onChange={(e) => update('property_type', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  {['house', 'flat', 'room', 'PG', 'hostel', 'shared accommodation'].map(t => (
                    <option key={t} value={t} className="capitalize">{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Suitable For *</label>
                <select
                  value={form.tenant_category}
                  onChange={(e) => update('tenant_category', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  <option value="both">Students & Families</option>
                  <option value="student">Students Only</option>
                  <option value="family">Families Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Pricing & Availability</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly Rent (₹) *</label>
                <input
                  type="number"
                  value={form.monthly_rent}
                  onChange={(e) => update('monthly_rent', e.target.value)}
                  placeholder="e.g. 8500"
                  required
                  min="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Security Deposit (₹)</label>
                <input
                  type="number"
                  value={form.security_deposit}
                  onChange={(e) => update('security_deposit', e.target.value)}
                  placeholder="e.g. 20000"
                  min="0"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Available From *</label>
                <input
                  type="date"
                  value={form.available_from}
                  onChange={(e) => update('available_from', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Availability Status</label>
                <select
                  value={form.availability_status}
                  onChange={(e) => update('availability_status', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  <option value="available">Available</option>
                  <option value="reserved">Reserved</option>
                  <option value="rented">Rented Out</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Location Details</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => update('city', e.target.value)}
                  placeholder="e.g. Pune"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Locality / Area *</label>
                <input
                  type="text"
                  value={form.locality}
                  onChange={(e) => update('locality', e.target.value)}
                  placeholder="e.g. Kothrud, Hinjewadi"
                  required
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Full Address *</label>
              <textarea
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                rows={3}
                placeholder="Building name, street, landmark, pincode..."
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>

          {/* Property Specs */}
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Property Specifications</h2>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Bedrooms</label>
                <select
                  value={form.bedrooms}
                  onChange={(e) => update('bedrooms', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  {[1,2,3,4,5].map(n => (
                    <option key={n} value={n}>{n} Bedroom{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Bathrooms</label>
                <select
                  value={form.bathrooms}
                  onChange={(e) => update('bathrooms', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  {[1,2,3,4].map(n => (
                    <option key={n} value={n}>{n} Bathroom{n > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Furnishing</label>
                <select
                  value={form.furnishing_status}
                  onChange={(e) => update('furnishing_status', e.target.value)}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                  <option value="furnished">Fully Furnished</option>
                  <option value="semi-furnished">Semi Furnished</option>
                  <option value="unfurnished">Unfurnished</option>
                </select>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5">
              Amenities & Facilities
              <span className="ml-2 text-sm font-normal text-slate-400">{form.amenities.length} selected</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {AMENITY_OPTIONS.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition text-left ${
                    form.amenities.includes(amenity)
                      ? 'bg-brand-50 border-brand-400 text-brand-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}>
                  <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${
                    form.amenities.includes(amenity) ? 'bg-brand-600 border-brand-600' : 'border-slate-300'
                  }`}>
                    {form.amenities.includes(amenity) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="leading-tight">{amenity}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Property Images
              <span className="ml-2 text-xs font-normal text-slate-400">(Paste image URLs from Unsplash or your server)</span>
            </h2>
            {form.images.map((img, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {idx === 0 ? '★ Primary' : `#${idx + 1}`}
                  </span>
                  <input
                    type="url"
                    value={img}
                    onChange={(e) => updateImage(idx, e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full pl-20 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
                  />
                </div>
                {img && (
                  <img src={img} className="w-12 h-12 object-cover rounded-lg border border-slate-200" onError={(e) => { e.target.style.display='none'; }} alt="" />
                )}
                {form.images.length > 1 && (
                  <button type="button" onClick={() => removeImageField(idx)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {form.images.length < 6 && (
              <button
                type="button"
                onClick={addImageField}
                className="flex items-center space-x-2 text-sm font-semibold text-brand-600 hover:text-brand-700 transition">
                <PlusCircle className="w-4 h-4" />
                <span>Add Another Image URL</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center space-x-2 py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-2xl shadow-lg shadow-brand-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition text-base">
              {submitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Saving...</span></>
              ) : (
                <><CheckCircle2 className="w-5 h-5" /><span>{isEdit ? 'Update Property' : 'Submit for Approval'}</span></>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

