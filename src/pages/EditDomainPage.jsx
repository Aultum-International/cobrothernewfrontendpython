import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { domainAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../components/layout/AppLayout';
import CurrencyPriceInput from '../components/common/CurrencyPriceInput';
import { DEFAULT_LISTING_CURRENCY } from '../constants/currencies';
import {
  formatDomainApiError,
  fromDomainApiToForm,
  mapDomainForUi,
  toUpdateDomainListingPayload,
  isDomainListingOwner,
} from '../utils/domainPayload';

const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100';
const labelCls = 'text-sm font-medium text-gray-700';

export default function EditDomainPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    domainAPI.getListing(id)
      .then(({ data }) => {
        const mapped = mapDomainForUi(data);
        setListing(mapped);
        setForm({
          ...fromDomainApiToForm(mapped),
          currency: DEFAULT_LISTING_CURRENCY,
        });
      })
      .catch(() => navigate('/domains'))
      .finally(() => setFetching(false));
  }, [id, navigate]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await domainAPI.update(id, toUpdateDomainListingPayload(form));
      navigate('/domains?tab=mine');
    } catch (err) {
      setError(formatDomainApiError(err) || 'Failed to update listing.');
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

  if (!isDomainListingOwner(listing, user)) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-red-600 mb-4">You can only edit your own domain listings.</p>
          <button type="button" className="btn-glow btn-glow-sm" onClick={() => navigate('/domains')}>
            Back to Domains
          </button>
        </div>
      </AppLayout>
    );
  }

  const isAuction = form.saleType === 'AUCTION';

  return (
    <AppLayout>
      <div className="max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-[2rem] font-bold text-gray-900 m-0 mb-2">Edit Domain Listing</h1>
          <p className="text-gray-600">Update price, contact details, and other listing information.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-8 bg-white border border-gray-200 rounded-[18px] shadow-sm">
          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Domain name</label>
            <input
              className={inputCls}
              value={(form.domainName || '') + (form.domainExtension || '')}
              onChange={(e) => {
                const full = e.target.value;
                const dot = full.indexOf('.');
                if (dot !== -1) {
                  setForm((f) => ({
                    ...f,
                    domainName: full.slice(0, dot),
                    domainExtension: full.slice(dot),
                  }));
                } else {
                  setForm((f) => ({ ...f, domainName: full, domainExtension: '' }));
                }
              }}
              required
            />
          </div>

          {form.saleType && (
            <p className="text-sm text-gray-500">
              Sale type: <strong>{form.saleType.replace(/_/g, ' ')}</strong> (cannot be changed after listing)
            </p>
          )}

          {!isAuction && (
            <CurrencyPriceInput
              id="edit-domain-price"
              label="Asking price"
              value={form.askingPrice}
              onChange={(v) => set('askingPrice', v)}
              currency={form.currency}
              onCurrencyChange={(code) => set('currency', code)}
              required
              inputClassName={inputCls}
              labelClassName={labelCls}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label className={labelCls}>Pricing type</label>
            <select
              className={inputCls}
              value={form.pricingDemand}
              onChange={(e) => set('pricingDemand', e.target.value)}
              required
            >
              <option value="">Select type</option>
              <option value="FIXED">Fixed Price</option>
              <option value="NEGOTIABLE">Negotiable</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Contact email</label>
              <input
                className={inputCls}
                type="email"
                value={form.contactInfo.email}
                onChange={(e) => set('contactInfo', { ...form.contactInfo, email: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={labelCls}>Phone</label>
              <input
                className={inputCls}
                value={form.contactInfo.phoneNumber}
                onChange={(e) => set('contactInfo', { ...form.contactInfo, phoneNumber: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 flex-wrap">
            <button type="submit" className="btn-glow" disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn-glow btn-glow-sm" onClick={() => navigate('/domains?tab=mine')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
