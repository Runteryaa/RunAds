"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { Check, Loader2, CreditCard, AlertCircle, ArrowRight, Zap, Gift, Bitcoin, Info } from "lucide-react";
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function CashoutPage() {
  const [processing, setProcessing] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [method, setMethod] = useState<"lightning" | "bitrefill" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [userCredits, setUserCredits] = useState<number>(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    setUserCredits(docSnap.data().credits || 0);
                }
            });
            return () => unsubscribeSnapshot();
        }
    });
    return () => unsubscribeAuth();
  }, []);

  // Configuration
  // "500 credits equal to 2 dollars and with fees its 5 dollars"
  // Gross: 500 credits = $5.00 -> 1 credit = $0.01
  // Net:   500 credits = $2.00 -> 1 credit = $0.004
  const GROSS_RATE_PER_CREDIT = 0.01; 
  
  // Fee Breakdown (Total 60%)
  const NETWORK_FEE_PERCENT = 0.20;
  const GAS_FEE_PERCENT = 0.10;
  const SERVICE_FEE_PERCENT = 0.30;

  // Derived values for display
  const creditsValue = parseInt(amount || "0");
  const grossUsd = creditsValue * GROSS_RATE_PER_CREDIT;
  
  const networkFee = grossUsd * NETWORK_FEE_PERCENT;
  const gasFee = grossUsd * GAS_FEE_PERCENT;
  const serviceFee = grossUsd * SERVICE_FEE_PERCENT;
  
  const totalFee = networkFee + gasFee + serviceFee;
  const netUsd = grossUsd - totalFee;

  // Value of user's *current balance* in USD (Gross)
  const userBalanceGrossUsd = userCredits * GROSS_RATE_PER_CREDIT;

  const handleCashout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !method) return;
    setError(null);
    setProcessing("true");

    try {
      const creditsToDeduct = parseInt(amount);
      if (isNaN(creditsToDeduct) || creditsToDeduct < 5000) {
          throw new Error("Minimum cashout is 5,000 credits.");
      }

      // Check user balance
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) throw new Error("User not found");
      
      const currentCredits = userSnap.data().credits || 0;
      if (currentCredits < creditsToDeduct) {
          throw new Error("Insufficient credits.");
      }

      // Create a cashout request in Firestore
      await addDoc(collection(db, "cashouts"), {
          userId: auth.currentUser.uid,
          amount: creditsToDeduct,
          method: method,
          destination: method === "lightning" ? address : email,
          status: "pending", // pending, completed, rejected
          createdAt: serverTimestamp(),
          usdGross: grossUsd.toFixed(2),
          usdFee: totalFee.toFixed(2),
          usdNet: netUsd.toFixed(2),
          feeBreakdown: {
              network: networkFee.toFixed(2),
              gas: gasFee.toFixed(2),
              service: serviceFee.toFixed(2)
          }
      });

      // Deduct credits immediately
      await updateDoc(userRef, {
          credits: increment(-creditsToDeduct)
      });

      setSuccess(true);
      setAmount("");
      setAddress("");
      setEmail("");
      
    } catch (err: any) {
      console.error("Cashout error:", err);
      setError(err.message);
    } finally {
      setProcessing(null);
    }
  };

  if (success) {
      return (
          <div className="max-w-2xl mx-auto py-12 px-4">
              <div className="bg-slate-900 border border-green-500/30 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Check className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Cashout Request Submitted!</h2>
                  <p className="text-slate-400 mb-6">
                      Your request has been received. {method === 'lightning' ? 'Your Satoshis' : 'Your Gift Card'} will be sent within 24 hours.
                  </p>
                  <button 
                      onClick={() => setSuccess(false)}
                      className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
                  >
                      Make Another Request
                  </button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Cashout Earnings</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Convert your earned credits into real value. Choose your preferred withdrawal method.
          <br /><span className="text-xs text-slate-500">Minimum withdrawal: 5,000 Credits</span>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        {/* Lightning Option */}
        <div 
            onClick={() => { setMethod("lightning"); setError(null); }}
            className={`cursor-pointer border rounded-2xl p-6 transition-all ${method === "lightning" ? "bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500" : "bg-slate-900 border-white/10 hover:border-white/20"}`}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500">
                    <Zap className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Lightning Network</h3>
                    <p className="text-xs text-slate-400">Instant Bitcoin Payment</p>
                </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
                Receive Bitcoin instantly via the Lightning Network. Perfect for micro-transactions with near-zero fees.
            </p>
        </div>

        {/* Bitrefill Option */}
        <div 
            onClick={() => { setMethod("bitrefill"); setError(null); }}
            className={`cursor-pointer border rounded-2xl p-6 transition-all ${method === "bitrefill" ? "bg-indigo-900/20 border-indigo-500 ring-1 ring-indigo-500" : "bg-slate-900 border-white/10 hover:border-white/20"}`}
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                    <Gift className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Bitrefill Gift Card</h3>
                    <p className="text-xs text-slate-400">Shop at 5,000+ Stores</p>
                </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
                Convert credits directly into a Bitrefill balance or Gift Card code sent to your email.
            </p>
        </div>
      </div>

      {method && (
          <form onSubmit={handleCashout} className="max-w-xl mx-auto bg-slate-900 border border-white/10 rounded-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  {method === "lightning" ? <Zap className="w-5 h-5 text-yellow-500" /> : <Gift className="w-5 h-5 text-blue-500" />}
                  Cashout Details
              </h3>

              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-400 mb-2">Amount (Credits)</label>
                      <div className="relative">
                          <input 
                              type="number" 
                              value={amount}
                              onChange={(e) => setAmount(e.target.value)}
                              placeholder="Min. 5000"
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                              min="5000"
                          />
                      </div>
                  </div>

                  {/* Pricing Breakdown */}
                  {userCredits >= 5000 ? (
                    <div className="bg-slate-950/50 rounded-lg p-4 border border-white/5 space-y-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Gross Value</span>
                            <span className="text-white">${grossUsd.toFixed(2)} USD</span>
                        </div>
                        
                        <div className="border-t border-white/5 my-2"></div>
                        
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Network Fee (20%)</span>
                            <span className="text-red-400/80">-${networkFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Gas Fee (10%)</span>
                            <span className="text-red-400/80">-${gasFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Service Fee (30%)</span>
                            <span className="text-red-400/80">-${serviceFee.toFixed(2)}</span>
                        </div>

                        <div className="border-t border-white/10 pt-2 flex justify-between font-bold mt-2">
                            <span className="text-white">You Receive</span>
                            <span className="text-green-400">${netUsd.toFixed(2)} USD</span>
                        </div>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                        <div>
                            <p className="text-sm text-amber-300">
                                You need at least 5,000 credits to view cashout details.
                            </p>
                            <p className="text-xs text-amber-400/70 mt-1">
                                Current Balance: <span className="text-white font-medium">{userCredits} Credits</span> 
                                <span className="mx-1">•</span> 
                                Est. Value: <span className="text-white font-medium">${userBalanceGrossUsd.toFixed(2)}</span>
                            </p>
                        </div>
                    </div>
                  )}

                  {method === "lightning" ? (
                      <div>
                          <label className="block text-sm font-medium text-slate-400 mb-2">Lightning Address / Invoice</label>
                          <input 
                              type="text" 
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
                              placeholder="e.g. user@wallet.com or lnbc..."
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                          />
                      </div>
                  ) : (
                      <div>
                           <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                          <input 
                              type="email" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Where to send the gift card code"
                              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              required
                          />
                      </div>
                  )}

                  {error && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-300">{error}</p>
                      </div>
                  )}

                  <button
                      type="submit"
                      disabled={!!processing || userCredits < 5000}
                      className={`w-full py-4 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg ${userCredits < 5000 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}`}
                  >
                      {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                          <>
                            Request Cashout <ArrowRight className="w-4 h-4" />
                          </>
                      )}
                  </button>
              </div>
          </form>
      )}

    </div>
  );
}
