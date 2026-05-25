import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cocreationAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import CurrencyPriceInput from '../components/common/CurrencyPriceInput';
import { DEFAULT_LISTING_CURRENCY } from '../constants/currencies';
import {
  formatCocreationApiError,
  fromSoftwareApiToForm,
  mapSoftwareForUi,
  toUpdateSoftwarePayload,
} from '../utils/cocreationPayload';

const CATEGORIES = [
  'SAAS', 'MOBILE_APP', 'DESKTOP', 'API_TOOL',
  'AUTOMATION', 'ECOMMERCE', 'EDUCATION', 'OTHER',
];

const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
const labelCls = 'text-sm font-medium text-gray-700';

export default function EditTechnologyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [listedById, setListedById] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cocreationAPI.get(id)
      .then(({ data }) => {
        const mapped = mapSoftwareForUi(data);
        setListedById(mapped.listedBy?.id ?? null);
        setForm({
          ...fromSoftwareApiToForm(mapped),
          currency: DEFAULT_LISTING_CURRENCY,
        });
      })
      .catch(() => navigate('/cocreation'))
      .finally(() => setFetching(false));
  }, [id, navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await cocreationAPI.update(id, toUpdateSoftwarePayload(form));
      navigate(`/cocreation/${id}/analytics`);
    } catch (err) {
      setError(formatCocreationApiError(err) || 'Failed to update listing.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching || !form) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (listedById && user?.id && listedById !== user.id) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">You can only edit your own listings.</p>
          <button type="button" className="btn-glow btn-glow-sm" onClick={() => navigate('/cocreation')}>
            Back to Technology
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-[2rem] font-bold text-gray-900 m-0 mb-2">Edit Technology</h1>
          <p className="text-gray-600">Update your listing details. Buyers see changes on the marketplace immediately.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8 bg-white border border-gray-200 rounded-[18px] shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Software Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Description</label>
            <textarea className={`${inputCls} resize-vertical`} rows={3} value={form.description}
              onChange={(e) => set('description', e.target.value)} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>What It Does</label>
              <textarea className={`${inputCls} resize-vertical`} rows={3} value={form.whatItDoes}
                onChange={(e) => set('whatItDoes', e.target.value)} required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>How It Helps</label>
              <textarea className={`${inputCls} resize-vertical`} rows={3} value={form.howItHelps}
                onChange={(e) => set('howItHelps', e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} required>
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Tech Stack</label>
              <input className={inputCls} value={form.techStack} onChange={(e) => set('techStack', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CurrencyPriceInput
              id="edit-software-price"
              label="Price"
              value={form.price}
              onChange={(v) => set('price', v)}
              currency={form.currency}
              onCurrencyChange={(code) => set('currency', code)}
              required
              inputClassName={inputCls}
              labelClassName={labelCls}
            />
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Pricing Type</label>
              <select className={inputCls} value={form.pricingDemand}
                onChange={(e) => set('pricingDemand', e.target.value)} required>
                <option value="">Select type</option>
                <option value="FIXED">Fixed Price</option>
                <option value="NEGOTIABLE">Negotiable</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Demo Video Link</label>
              <input className={inputCls} value={form.videoLink} onChange={(e) => set('videoLink', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Live Demo Link</label>
              <input className={inputCls} value={form.liveDemoLink} onChange={(e) => set('liveDemoLink', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>GitHub Link</label>
            <input className={inputCls} value={form.githubLink} onChange={(e) => set('githubLink', e.target.value)} required />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 flex-wrap">
            <button type="submit" className="btn-glow" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn-glow btn-glow-sm" onClick={() => navigate(`/cocreation/${id}/analytics`)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
