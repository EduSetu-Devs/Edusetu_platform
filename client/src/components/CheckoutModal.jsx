import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  CreditCard,
  Smartphone,
  Building2,
  Sparkles,
  ArrowRight,
  Lock
} from 'lucide-react';

const CheckoutModal = ({
  isOpen,
  onClose,
  itemTitle = 'Academic Course Batch',
  itemSubtitle = 'Grade 10 · Mathematics',
  instructor = 'Er. Ashutosh Tripathi',
  schedule = 'Mon, Wed, Fri · 5:00 PM - 6:30 PM',
  price = 999,
  onConfirmPayment
}) => {
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD' | 'NETBANKING'
  const [upiId, setUpiId] = useState('student@okhdfcbank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txnId, setTxnId] = useState('');

  if (!isOpen) return null;

  const displayPrice = Number(price) > 0 ? Number(price) : 0;
  const originalPrice = displayPrice > 0 ? Math.round(displayPrice * 2.5) : 1999;
  const discount = originalPrice - displayPrice;

  const handlePay = async () => {
    setIsProcessing(true);
    const mockTxn = `TXN_EDU_${Math.floor(10000000 + Math.random() * 90000000)}`;
    setTxnId(mockTxn);

    // Simulate realistic 1.2s gateway verification
    setTimeout(async () => {
      try {
        if (onConfirmPayment) {
          await onConfirmPayment(mockTxn);
        }
        setIsProcessing(false);
        setIsSuccess(true);
      } catch (err) {
        setIsProcessing(false);
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-indigo-700 via-indigo-600 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-base font-black leading-tight">EduSetu Pay Gateway</h3>
              <p className="text-[11px] text-indigo-100 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 inline" />
                <span>256-bit Bank-Grade Encryption</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner animate-bounce">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-wider border border-emerald-200">
                Payment Confirmed
              </span>
              <h4 className="text-xl font-black text-slate-900 mt-2">Enrollment Unlocked!</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Your payment of <strong className="text-slate-800">₹{displayPrice}</strong> was verified successfully.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="font-mono font-bold text-slate-800">{txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Course Batch:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">{itemTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className="font-bold text-emerald-600">Active & Enrolled</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Go to My Dashboard
            </button>
          </div>
        ) : (
          /* Checkout View */
          <div className="p-6 space-y-5">
            
            {/* Order Summary Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase">
                    {itemSubtitle}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-1">{itemTitle}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Faculty: {instructor}</p>
                  <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">🕒 {schedule}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs text-slate-400 line-through">₹{originalPrice}</div>
                  <div className="text-lg font-black text-slate-900">₹{displayPrice}</div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Save ₹{discount}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Payment Method
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'UPI', label: 'UPI / QR', icon: <Smartphone className="w-4 h-4" /> },
                  { id: 'CARD', label: 'Card', icon: <CreditCard className="w-4 h-4" /> },
                  { id: 'NETBANKING', label: 'NetBanking', icon: <Building2 className="w-4 h-4" /> }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all ${
                      paymentMethod === m.id
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-2xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Method Form */}
            {paymentMethod === 'UPI' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-semibold text-slate-600">Virtual Payment Address (VPA / UPI ID)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="mobile@upi or user@okaxis"
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                  />
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    Auto-Verified
                  </span>
                </div>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                  <span>Supported:</span>
                  <span className="font-bold text-slate-700">GPay</span>·
                  <span className="font-bold text-slate-700">PhonePe</span>·
                  <span className="font-bold text-slate-700">Paytm</span>·
                  <span className="font-bold text-slate-700">BHIM</span>
                </div>
              </div>
            )}

            {paymentMethod === 'CARD' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Card Number</label>
                  <input
                    type="text"
                    readOnly
                    value="4242 •••• •••• 4242"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Expiry</label>
                    <input
                      type="text"
                      readOnly
                      value="12 / 28"
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">CVV</label>
                    <input
                      type="password"
                      readOnly
                      value="•••"
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-xl bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'NETBANKING' && (
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <label className="text-xs font-semibold text-slate-600">Select Partner Bank</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank'].map((b, i) => (
                    <div
                      key={b}
                      className={`p-2 rounded-xl border text-center font-bold cursor-pointer transition-colors ${
                        i === 0 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {b}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePay}
                className="w-full py-3.5 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Payment ₹{displayPrice}...</span>
                  </>
                ) : (
                  <>
                    <span>Pay ₹{displayPrice} & Complete Enrollment</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[10px] text-center text-slate-400 mt-3">
                Simulated Sandbox Checkout · Zero Actual Bank Charges · Safe TiDB Ledger Sync
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CheckoutModal;
