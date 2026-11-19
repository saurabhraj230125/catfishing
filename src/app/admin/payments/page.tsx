'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  collection, 
  query, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
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
  Copy,
  Check, 
  X,
  CreditCard,
  User,
  Smartphone
} from 'lucide-react';
import { showToast } from '@/components/Toast';

export default function AdminPaymentsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [orders, setOrders] = useState<PendingUpiOrder[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'orders'>('requests');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || '';

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubAuth();
  }, []);

  // Listen to payment requests & orders when admin is logged in
  // Single-collection queries without composite index requirements, sorted in memory
  useEffect(() => {
    if (!currentUser || !isLiveFirebaseConfigured) return;

    // Listen to manual payment requests
    const reqQ = query(collection(db, 'payment_requests'), limit(100));
    const unsubReq = onSnapshot(reqQ, (snap) => {
      const list: PaymentRequest[] = [];
      snap.forEach((d) => {
        list.push(d.data() as PaymentRequest);
      });
      // Sort newest first
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRequests(list);
    });

    // Listen to pending & paid UPI orders
    const ordersQ = query(collection(db, 'pending_upi_orders'), limit(100));
    const unsubOrders = onSnapshot(ordersQ, (snap) => {
      const list: PendingUpiOrder[] = [];
      snap.forEach((d) => {
        list.push(d.data() as PendingUpiOrder);
      });
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setOrders(list);
    });

    return () => {
      unsubReq();
      unsubOrders();
    };
  }, [currentUser]);

  const copyToClipboard = (text: string, label: string = 'UTR') => {
    navigator.clipboard.writeText(text);
    setCopiedUtr(text);
    showToast(`✓ Copied ${label}: ${text}`, 'success');
    setTimeout(() => {
      setCopiedUtr(null);
    }, 2000);
  };

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

      // 2. Unlock plan in users/{uid} and clear pending UTR
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
          pendingPaymentUtr: null,
          lastApprovedUtr: req.utr,
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
      showToast(`✓ UTR ${req.utr} approved! Plan unlocked for user.`, 'success');
    } catch (err: any) {
      console.error('Approval failed:', err);
      showToast('Approval failed: ' + (err?.message || 'Unknown error'), 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (req: PaymentRequest) => {
    setActionLoading(req.utr);
    try {
      const batch = writeBatch(db);
      const reqRef = doc(db, 'payment_requests', req.utr);
      batch.update(reqRef, {
        status: 'rejected',
        reviewedAt: Date.now(),
      });

      const userRef = doc(db, 'users', req.uid);
      batch.set(
        userRef,
        {
          pendingPaymentUtr: null,
          lastRejectedUtr: req.utr,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      await batch.commit();
      showToast(`UTR ${req.utr} marked as rejected`, 'info');
    } catch (err: any) {
      console.error('Reject failed:', err);
      showToast('Reject failed: ' + (err?.message || 'Unknown error'), 'error');
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
                className="w-full min-h-[44px] py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-all cursor-pointer"
              >
                Sign Out & Switch Account
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="w-full min-h-[44px] py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-md transition-all cursor-pointer"
            >
              Sign In with Google Admin Account
            </button>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors p-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Catfisher Pond</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter((r) => r.status === 'submitted' || r.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#E0F7FA] text-slate-800 p-3 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Top Header */}
        <div className="bg-white rounded-3xl border-2 border-slate-200 p-4 sm:p-6 shadow-md mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="p-2 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Back to pond"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                Pond Payment Admin Console
              </h1>
            </div>
            <p className="text-xs text-slate-500 font-medium ml-10 mt-0.5">
              Admin: <strong className="text-teal-700">{currentUser.email}</strong> • Direct UPI: <strong className="text-slate-700 font-mono">6306814355@ptsbi</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => signOutUser()}
              className="px-4 py-2 min-h-[44px] rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all cursor-pointer flex items-center justify-center"
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
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>Manual UTR Requests</span>
            {pendingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'bg-teal-600 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>All UPI Orders ({orders.length})</span>
          </button>
        </div>

        {/* TAB 1: MANUAL UTR REQUESTS */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900">
                Customer Submitted UTR Verification Requests
              </h2>
              <span className="text-xs text-slate-400 font-normal">Real-time sync</span>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                Zero manual requests currently submitted.
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                        <th className="pb-3">12-Digit UTR</th>
                        <th className="pb-3">Plan</th>
                        <th className="pb-3">Amount</th>
                        <th className="pb-3">Payer Name</th>
                        <th className="pb-3">User Email / UID</th>
                        <th className="pb-3">Time</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold">
                      {requests.map((r) => {
                        const isPending = r.status === 'submitted' || r.status === 'pending';
                        return (
                          <tr key={r.utr} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3">
                              <button
                                type="button"
                                onClick={() => copyToClipboard(r.utr, 'UTR')}
                                className="inline-flex items-center gap-1 font-mono font-black text-slate-900 hover:text-teal-700 bg-slate-50 hover:bg-teal-50 px-2 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                                title="Click to copy UTR"
                              >
                                <span>{r.utr}</span>
                                <Copy className="w-3 h-3 text-slate-400" />
                              </button>
                            </td>
                            <td className="py-3">
                              <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase">
                                {r.planTier === 'unlimited' ? 'Unlimited Pass' : '100 Mins Bank'}
                              </span>
                            </td>
                            <td className="py-3 font-black text-slate-900">
                              ₹{r.exactAmount || (r.planTier === 'unlimited' ? 249 : 99)}
                            </td>
                            <td className="py-3 font-medium text-slate-700">
                              {r.payerName || '—'}
                            </td>
                            <td className="py-3 max-w-[160px] truncate font-medium text-slate-600">
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
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    disabled={actionLoading === r.utr}
                                    onClick={() => handleApproveRequest(r)}
                                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs flex items-center gap-1 transition-all cursor-pointer min-h-[36px]"
                                  >
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={actionLoading === r.utr}
                                    onClick={() => handleRejectRequest(r)}
                                    className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer min-h-[36px]"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">Resolved</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Responsive Card Stack */}
                <div className="md:hidden space-y-3">
                  {requests.map((r) => {
                    const isPending = r.status === 'submitted' || r.status === 'pending';
                    return (
                      <div
                        key={r.utr}
                        className="p-4 rounded-2xl border-2 border-slate-200/90 bg-slate-50/60 shadow-xs space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(r.utr, 'UTR')}
                            className="inline-flex items-center gap-1.5 font-mono font-black text-sm text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-300"
                          >
                            <span>{r.utr}</span>
                            <Copy className="w-3 h-3 text-slate-400" />
                          </button>

                          <span className="font-black text-base text-slate-900">
                            ₹{r.exactAmount || (r.planTier === 'unlimited' ? 249 : 99)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-black uppercase">
                            {r.planTier === 'unlimited' ? 'Unlimited Pass' : '100 Mins Bank'}
                          </span>
                          <span className="text-slate-400 text-[11px]">
                            {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="text-xs space-y-0.5 pt-1 border-t border-slate-200/70">
                          {r.payerName && (
                            <div className="flex items-center gap-1 text-slate-700 font-semibold">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>Payer: {r.payerName}</span>
                            </div>
                          )}
                          <div className="text-slate-500 font-mono text-[11px] truncate">
                            {r.userEmail || r.uid}
                          </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <div>
                            {r.status === 'approved' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-black text-xs">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approved</span>
                              </span>
                            ) : r.status === 'rejected' ? (
                              <span className="inline-flex items-center gap-1 text-rose-600 font-black text-xs">
                                <XCircle className="w-4 h-4" />
                                <span>Rejected</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300 text-xs font-black">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Needs Review</span>
                              </span>
                            )}
                          </div>

                          {isPending && (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                disabled={actionLoading === r.utr}
                                onClick={() => handleApproveRequest(r)}
                                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-4 h-4 stroke-[3]" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                disabled={actionLoading === r.utr}
                                onClick={() => handleRejectRequest(r)}
                                className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                                <span>Reject</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: ALL UPI ORDERS */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-md p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-black text-slate-900">
                All Generated UPI Orders (Fingerprinted Paise)
              </h2>
              <span className="text-xs text-slate-400 font-normal">Real-time sync</span>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                Zero orders generated yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
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
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
