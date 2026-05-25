import { useState, useEffect } from 'react';
import { feeAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCurrency } from '../context/CurrencyContext';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { buildOrderCurrencyPayload } from '../utils/currencyDisplay';
import AppLayout from '../components/layout/AppLayout';

const STATUS_COLORS = {
  PAYMENT_PENDING:   { color: '#c8a96e', label: 'Payment Required' },
  FORWARDED:         { color: '#a06ec8', label: 'Under Review'     },
  ACCEPTED:          { color: '#6ec896', label: 'Accepted'         },
  REJECTED:          { color: '#c86e6e', label: 'Rejected'         },
  CANCELLED:         { color: '#666',    label: 'Cancelled'        },
};

export default function FeeRequestsPage() {
  const { formatPrice } = useCurrency();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [payTarget, setPayTarget] = useState(null);

  const load = () => {
    setLoading(true);
    feeAPI.getMyRequests()
      .then(({ data }) => setRequests(Array.isArray(data) ? data : []))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this request?')) return;
    await feeAPI.cancel(id);
    load();
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 m-0">CoBrother Fee Requests</h1>
          <p className="text-gray-600 mt-1">Payment requests from admin for CoBrother services.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="w-12 h-12 border-4 border-gray-400 border-t-gray-800 rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">◆</div>
          <h3 className="font-display text-2xl font-bold text-gray-900 mb-2">No fee requests</h3>
          <p className="text-gray-600">No CoBrother service requests have been made for your listings.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map(r => {
            const s = STATUS_COLORS[r.status] || { color: '#888', label: r.status };
            return (
              <div key={r.id} className="p-4 bg-white border border-gray-200 rounded-[10px] shadow-sm">
                <div className="flex justify-between flex-wrap gap-2 mb-2">
                  <div>
                    <div className="font-semibold text-gray-900">{r.entityTitle}</div>
                    <div className="text-xs text-gray-500">{r.requestType}</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: s.color }}>
                    {s.label}
                  </span>
                </div>

                {r.coBrotherNote && (
                  <div className="text-xs text-gray-400 mb-3">
                    <strong>CoBrother Note:</strong> {r.coBrotherNote}
                  </div>
                )}

                <div className="flex gap-3 flex-wrap">
                  {r.status === 'PAYMENT_PENDING' && (
                    <>
                      <button className="btn-glow btn-glow-sm"
                        onClick={() => setPayTarget(r)}>
                        Pay {formatPrice(1000)} →
                      </button>
                      <button className="btn-glow btn-glow-sm"
                        onClick={() => handleCancel(r.id)}>
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {payTarget && (
        <FeePaymentModal
          request={payTarget}
          onClose={() => setPayTarget(null)}
          onSuccess={() => { setPayTarget(null); load(); }}
        />
      )}
    </AppLayout>
  );
}

function FeePaymentModal({ request, onClose, onSuccess }) {
  const { user } = useAuth();
  const { currency, formatPrice } = useCurrency();
  const FEE_INR = 1000;
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handlePay = async () => {
    setLoading(true); setError('');
    try {
      const { data: orderData } = await feeAPI.createOrder(request.id, {
        ...buildOrderCurrencyPayload(currency),
      });

      openRazorpayCheckout({
        orderData,
        user,
        description: 'CoBrother Service Fee — ' + request.entityTitle,
        themeColor: '#a06ec8',
        onSuccess: async (response) => {
          try {
            await feeAPI.verify(request.id, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId:   response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            onSuccess();
          } catch {
            setError('Payment verification failed. Contact support.');
            setLoading(false);
          }
        },
        onDismiss: () => setLoading(false),
        onFailure: () => {
          setError('Payment failed. Please try again.');
          setLoading(false);
        },
      });
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to initiate payment.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full max-w-[440px] bg-white border border-gray-200 rounded-[18px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-slideUp">
        <div className="absolute -top-24 -right-24 w-[300px] h-[300px] rounded-full bg-purple-100/30 blur-3xl pointer-events-none" />
        <button className="absolute top-4 right-4 z-20 bg-transparent border-none text-gray-400 text-xl cursor-pointer transition-colors duration-200 hover:text-gray-700" onClick={onClose}>✕</button>
        <div className="relative z-10 p-8 pb-6">
          <div className="inline-block px-2.5 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-md mb-4">CoBrother Service Fee</div>
          <h2 className="font-display text-2xl font-bold text-gray-900 m-0 mb-2">{request.entityTitle}</h2>
          <p className="text-gray-500 text-sm m-0 mb-6">One-time fee to engage CoBrother services for this request.</p>
        </div>

        <div className="relative z-10 mx-8 my-6 p-4 bg-green-500/8 border border-green-500/20 rounded-[10px]">
          <div className="text-xs text-gray-500 mb-1">
            Service Fee
          </div>
          <div className="text-[1.75rem] font-bold text-green-400 font-display">
            {formatPrice(FEE_INR)}
          </div>
        </div>

        <div className="relative z-10 mx-8 px-3.5 py-3 bg-purple-50 border border-purple-200 rounded-lg mb-5 text-xs text-purple-700">
          ⚡ After payment, a CoBrother will be assigned to assist with your request.
        </div>

        {error && <div className="relative z-10 mx-8 mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-[10px] text-red-400 text-sm">{error}</div>}

        <div className="relative z-10 px-8 pb-8 flex gap-3">
          <button onClick={handlePay} disabled={loading}
            className="btn-glow flex-1 flex items-center justify-center gap-2">
            {loading ? <span className="w-4 h-4 border-2 border-gray-400 border-t-gray-800 rounded-full animate-spin" /> : `Pay ${formatPrice(FEE_INR)} →`}
          </button>
          <button onClick={onClose}
            className="btn-glow">Cancel</button>
        </div>
      </div>
    </div>
  );
}