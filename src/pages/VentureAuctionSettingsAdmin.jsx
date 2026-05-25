import { useEffect, useState } from 'react';
import { ventureAuctionAPI } from '../api/services';

export default function VentureAuctionSettingsAdmin() {
  const [fee, setFee] = useState('118');
  const [maxBid, setMaxBid] = useState('50000000');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    ventureAuctionAPI.adminGetSettings()
      .then(({ data }) => {
        const body = data?.data ?? data;
        setFee(String(body.participationFeeInr ?? 118));
        setMaxBid(String(body.maxBidInr ?? 50000000));
      })
      .catch(() => setErr('Could not load settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setErr('');
    try {
      const { data } = await ventureAuctionAPI.adminUpdateSettings({
        participationFeeInr: parseFloat(fee),
        maxBidInr: parseFloat(maxBid),
      });
      const body = data?.data ?? data;
      setFee(String(body.participationFeeInr));
      setMaxBid(String(body.maxBidInr));
      setMsg('Settings saved. New bidders will use these limits.');
    } catch (e) {
      setErr(e.response?.data?.error || e.response?.data?.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-16 text-gray-500">Loading auction settings…</div>;
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <h2 className="font-display text-xl font-bold text-gray-900 mb-1">Venture auction settings</h2>
      <p className="text-sm text-gray-600 mb-6">
        Bidders must pay the participation fee before placing bids. Minimum bid increment is fixed at 5% above the current highest bid.
      </p>

      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Participation fee (₹)
          </label>
          <input
            type="number"
            min="1"
            max="100000"
            step="1"
            value={fee}
            onChange={(e) => setFee(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Default ₹118 — charged once per auction per bidder via Razorpay.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum bid amount (₹)
          </label>
          <input
            type="number"
            min="1000"
            step="1000"
            value={maxBid}
            onChange={(e) => setMaxBid(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Caps bid size to prevent invalid entries (e.g. ₹5,00,00,000).</p>
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}
        {msg && <div className="text-sm text-green-600">{msg}</div>}

        <button type="submit" className="btn-glow" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>
    </div>
  );
}
