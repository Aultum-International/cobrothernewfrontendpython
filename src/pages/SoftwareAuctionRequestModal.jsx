import { useState } from 'react';
import { softwareAuctionAPI } from '../api/services';

const DURATIONS = ['ONE_DAY', 'THREE_DAYS', 'FIVE_DAYS', 'SEVEN_DAYS', 'FOURTEEN_DAYS', 'THIRTY_DAYS'];
const DURATION_LABELS = {
  ONE_DAY: '1 Day', THREE_DAYS: '3 Days', FIVE_DAYS: '5 Days',
  SEVEN_DAYS: '7 Days', FOURTEEN_DAYS: '14 Days', THIRTY_DAYS: '30 Days',
};

export default function SoftwareAuctionRequestModal({ software, onClose, onSubmitted }) {
  const [form, setForm] = useState({
    minBidPrice: '',
    duration: 'SEVEN_DAYS',
    auctionRationale: '',
    sourceCodeIncluded: false,
    supportIncluded: false,
    supportDays: 30,
    transferDetails: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.minBidPrice || parseFloat(form.minBidPrice) <= 0) {
      setError('Enter a valid minimum bid price'); return;
    }
    if (!form.auctionRationale.trim()) {
      setError('Please explain why you want to auction this software'); return;
    }
    setError('');
    setLoading(true);
    try {
      await softwareAuctionAPI.create(software.id, {
        minBidPrice: parseFloat(form.minBidPrice),
        duration: form.duration,
        auctionRationale: form.auctionRationale,
        sourceCodeIncluded: form.sourceCodeIncluded,
        supportIncluded: form.supportIncluded,
        supportDays: form.supportIncluded ? parseInt(form.supportDays) : 0,
        transferDetails: form.transferDetails,
      });
      onSubmitted();
    } catch (e) {
      setError(e.response?.data || e.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-glow" />
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-header">
          <div className="modal-badge">Request Auction</div>
          <h2>List "{software.name}" for Auction</h2>
          <p>Submit your auction request for admin review. Once approved, it goes live immediately.</p>
        </div>

        {/* Info banner */}
        <div style={{ padding: '0.875rem', background: 'rgba(110,173,200,0.08)',
                      border: '1px solid rgba(110,173,200,0.25)', borderRadius: 8,
                      marginBottom: '1.25rem', fontSize: '0.83rem', color: '#6eadc8' }}>
          💡 Unlike fixed-price sales, auction lets the market decide the value. Bids escalate in 5% increments with anti-snipe extension in the final 5 minutes.
        </div>

        <div className="flex flex-col gap-4 md:gap-5">

          <div className="form-group">
            <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2">Minimum Bid Price (₹) <span className="text-red-500">*</span></label>
            <input type="number" min="1" value={form.minBidPrice}
              onChange={e => set('minBidPrice', e.target.value)}
              placeholder="Enter minimum bid amount (e.g. 50000)"
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm md:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400 placeholder:font-normal" />
            <span className="text-xs md:text-sm text-gray-500 mt-1">
              Reference price: <span className="font-semibold text-gray-700">
                ₹{Number(software.price || 0).toLocaleString('en-IN')}
                {software.purchaseType === 'AUCTION' && Number(software.price) === 0 ? ' (set min bid below)' : ''}
              </span>
            </span>
          </div>

          <div className="form-group">
            <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2">Auction Duration <span className="text-red-500">*</span></label>
            <select value={form.duration} onChange={e => set('duration', e.target.value)}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm md:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer appearance-none">
              {DURATIONS.map(d => (
                <option key={d} value={d}>{DURATION_LABELS[d]}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2">Why auction instead of fixed price? <span className="text-red-500">*</span></label>
            <textarea value={form.auctionRationale}
              onChange={e => set('auctionRationale', e.target.value)}
              placeholder="Explain why you want to auction this software. For example: The software has high potential and competitive bidding will reflect its true value."
              rows={3}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm md:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-gray-400 placeholder:font-normal" />
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col gap-2 md:gap-3">
            <label className="flex items-center gap-2 md:gap-3 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
              <input type="checkbox" checked={form.sourceCodeIncluded}
                onChange={e => set('sourceCodeIncluded', e.target.checked)}
                className="w-4 h-4 md:w-5 md:h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer accent-indigo-600" />
              <span className="font-medium">Source code / repository access included</span>
            </label>
            <label className="flex items-center gap-2 md:gap-3 text-sm text-gray-700 cursor-pointer hover:text-gray-900 transition-colors">
              <input type="checkbox" checked={form.supportIncluded}
                onChange={e => set('supportIncluded', e.target.checked)}
                className="w-4 h-4 md:w-5 md:h-5 rounded border-2 border-gray-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 cursor-pointer accent-indigo-600" />
              <span className="font-medium">Post-sale support / handover included</span>
            </label>
          </div>

          {form.supportIncluded && (
            <div className="form-group">
              <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2">Support Duration (days)</label>
              <input type="number" min="1" max="365" value={form.supportDays}
                onChange={e => set('supportDays', e.target.value)}
                placeholder="Enter number of days (1-365)"
                className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm md:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-gray-400 placeholder:font-normal" />
            </div>
          )}

          <div className="form-group">
            <label className="block text-sm md:text-base font-semibold text-gray-800 mb-1.5 md:mb-2">IP / Ownership Transfer Details</label>
            <textarea value={form.transferDetails}
              onChange={e => set('transferDetails', e.target.value)}
              placeholder="Describe the IP transfer process. For example: Full IP transfer included. Domain, hosting credentials, and all assets handed over within 7 days of auction close."
              rows={2}
              className="w-full px-3 md:px-4 py-2.5 md:py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm md:text-base outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-y placeholder:text-gray-400 placeholder:font-normal" />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 flex items-start gap-2">
            <span className="mt-0.5">⚠</span> {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-4 md:mt-6">
          <button className="btn-glow flex-1 order-2 sm:order-1" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Submit for Review →'}
          </button>
          <button
            className="px-4 py-2.5 md:py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg transition-all hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 hover:text-white hover:shadow-lg order-1 sm:order-2"
            onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}