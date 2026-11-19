'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc,
  writeBatch 
} from 'firebase/firestore';
import { auth, signInWithGoogle, signOutUser, onAuthStateChanged, db, isLiveFirebaseConfigured } from '@/lib/firebase';
import { PendingUpiOrder, PaymentRequest } from '@/types/pond';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  Smartphone, 
  Check, 
  X,
  CreditCard
} from 'lucide-react';

export default function AdminPaymentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [orders, setOrders] = useState<PendingUpiOrder[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'orders'>('requests');

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubAuth();
  }, []);

  // Listen to payment requests & orders when admin is logged in
  useEffect(() => {
    if (!currentUser || !isLiveFirebaseConfigured) return;

    // Listen to manual payment requests
    const reqQ = query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(50));
    const unsubReq = onSnapshot(reqQ, (snap) => {
      const list: PaymentRequest[] = [];
      snap.forEach((d) => {
        list.push(d.data() as PaymentRequest);
      });
      setRequests(list);
    });

    // Listen to pending & paid UPI orders
    const ordersQ = query(collection(db, 'pending_upi_orders'), orderBy('createdAt', 'desc'), limit(50));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const list: PendingUpiOrder[] = [];
      snap.forEach((d) => {
        list.push(d.data() as PendingUpiOrder);
      });
      setOrders(list);
    });

    return () => {
      unsubReq();
      unsubOrders();
    };
  }, [currentUser]);

  const handleApproveRequest = async (req: PaymentRequest) => {
    setActionLoading(req.utr);
    try {
      const batch = writeBatch(db);

      // 1. Update request status to approved
      const reqRef = doc(db, 'payment_requests', req.utr);
      batch.update(reqRef, {
        status: 'approved',
        reviewedAt: Date.now(),
      });

      // 2. Unlock plan in users/{uid}
      const userRef = doc(db, 'users', req.uid);
      const secondsUnlocked = req.planTier === 'pro_100' ? 6000 : -1;
      const renewsAt = Date.now() + 30 * 24 * 60 * 60 * 1000;

      batch.set(
        userRef,
        {
          uid: req.uid,
          email: req.userEmail || null,
          planTier: req.planTier,
          remainingSeconds: secondsUnlocked,
          monthlyAllowanceSeconds: secondsUnlocked,
          planRenewsAt: renewsAt,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      // 3. If matching pending order exists, update it as well
      if (req.orderCode) {
        const orderRef = doc(db, 'pending_upi_orders', req.orderCode);
        batch.update(orderRef, {
          status: 'paid',
          paidAt: Date.now(),
          detectedUtr: req.utr,
          manualApproved: true,
        });
      }

      await batch.commit();
    } catch (err) {
      console.error('Approval failed:', err);
      alert('Approval failed: ' + (err as any)?.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (req: PaymentRequest) => {
    setActionLoading(req.utr);
    try {
      const reqRef = doc(db, 'payment_requests', req.utr);
      await updateDoc(reqRef, {
        status: 'rejected',
        reviewedAt: Date.now(),
      });
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const isAuthorized = Boolean(
    currentUser &&
    adminEmail &&
    currentUser.email?.toLowerCase().trim() === adminEmail.toLowerCase().trim()
  );

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#E0F7FA] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#E0F7FA] flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-xl text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-3">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Restricted Admin Console
          </h2>
          <p className="text-xs text-slate-600 font-medium mt-1 mb-5">
            This dashboard is reserved for verifying direct UPI payments and reviewing manual UTR requests.
          </p>

          {currentUser ? (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
                Signed in as: <strong>{currentUser.email}</strong> (Not authorized as admin)
              </div>
              <button
                type="button"
                onClick={() => signOutUser()}
                className="w-full py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all"
              >
                Sign Out & Switch Account
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              Sign In with Google Admin Account
            </button>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catfisher Pond</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E0F7FA] text-slate-800 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 shadow-md mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                title="Back to pond"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Pond Payment Admin Console
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium ml-8 mt-0.5">
              Logged in as <strong className="text-teal-700">{currentUser.email}</strong> • Direct UPI <strong className="text-slate-700">6306814355@ptsbi</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => signOutUser()}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Manual UTR Requests ({requests.filter((r) => r.status === 'submitted').length} Pending)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All UPI Orders ({orders.length})
          </button>
        </div>

        {/* TAB 1: MANUAL UTR REQUESTS */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-6 overflow-x-auto">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center justify-between">
              <span>Customer Submitted UTR Verification Requests</span>
              <span className="text-xs text-slate-400 font-normal">Real-time sync</span>
            </h2>

            {requests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                Zero manual requests currently submitted.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                    <th className="pb-3">12-Digit UTR</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">User Email / UID</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {requests.map((r) => (
                    <tr key={r.utr} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-black text-slate-900">{r.utr}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase">
                          {r.planTier === 'unlimited' ? 'Unlimited' : '100 Mins'}
                        </span>
                      </td>
                      <td className="py-3 font-black text-slate-900">₹{r.exactAmount}</td>
                      <td className="py-3 max-w-[180px] truncate">
                        {r.userEmail || r.uid}
                      </td>
                      <td className="py-3 text-slate-500 text-[11px]">
                        {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3">
                        {r.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approved</span>
                          </span>
                        ) : r.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-black text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-[10px] font-black">
                            <Clock className="w-3 h-3" />
                            <span>Needs Review</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {r.status === 'submitted' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              disabled={actionLoading === r.utr}
                              onClick={() => handleApproveRequest(r)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === r.utr}
                              onClick={() => handleRejectRequest(r)}
                              className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: ALL UPI ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-5 sm:p-6 overflow-x-auto">
            <h2 className="text-base font-black text-slate-900 mb-4 flex items-center justify-between">
              <span>All Generated UPI Orders (Fingerprinted Paise)</span>
              <span className="text-xs text-slate-400 font-normal">Real-time sync</span>
            </h2>

            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                Zero orders generated yet.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                    <th className="pb-3">Order Code</th>
                    <th className="pb-3">Exact Amount</th>
                    <th className="pb-3">Plan</th>
                    <th className="pb-3">User UID</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Detected UTR</th>
                    <th className="pb-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {orders.map((o) => (
                    <tr key={o.orderCode} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 font-mono font-bold text-slate-900">{o.orderCode}</td>
                      <td className="py-3 font-black text-teal-800">₹{o.exactAmount.toFixed(2)}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold uppercase">
                          {o.planTier}
                        </span>
                      </td>
                      <td className="py-3 max-w-[140px] truncate text-slate-500">{o.uid}</td>
                      <td className="py-3">
                        {o.status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-black">
                            ✓ PAID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold">
                            PENDING
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-mono text-slate-600 text-[11px]">
                        {o.detectedUtr || '—'}
                      </td>
                      <td className="py-3 text-right text-slate-400 text-[11px]">
                        {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

