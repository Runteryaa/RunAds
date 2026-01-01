"use client";

import { useState } from "react";
import { auth } from "@/lib/firebase";
import { Check, Loader2, CreditCard, Sparkles, AlertCircle } from "lucide-react";

export default function BuyCreditsPage() {
  const [processing, setProcessing] = useState<string | null>(null);
  
  const handlePurchase = async (packageId: string) => {
    if (!auth.currentUser) return;
    setProcessing(packageId);

    try {
      const res = await fetch('/api/coinbase/create-charge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              packageId,
              userId: auth.currentUser.uid
          })
      });

      const data = await res.json();

      if (!res.ok) {
          throw new Error(data.error || "Server failed to respond");
      }

      if (data.url) {
          window.location.href = data.url; // Redirect to Coinbase
      } else {
          alert("Error: No payment URL returned. Check server logs.");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      alert(`Payment Failed: ${error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Add Credits with Crypto</h1>
        <p className="text-slate-400 max-w-xl mx-auto mb-8">
          Instant delivery. Secure payments via Coinbase Commerce.
          <br /><span className="text-xs text-slate-500">(Bitcoin, Ethereum, USDC, Litecoin, etc.)</span>
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Starter Pack ($1) */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-colors flex flex-col">
          <div className="mb-6">
             <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
               Starter
             </span>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$1</span>
            <span className="text-slate-400"> / one-time</span>
          </div>
          <div className="mb-8">
            <p className="text-xl font-bold text-white mb-1">100 Credits</p>
            <p className="text-sm text-slate-400">approx. 100 visitors</p>
          </div>
          <button
            onClick={() => handlePurchase('starter')}
            disabled={!!processing}
            className="mt-auto w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {processing === 'starter' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy with Crypto'}
          </button>
        </div>

        {/* Business Pack ($20) - BEST VALUE */}
        <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-8 transform md:-translate-y-4 shadow-2xl shadow-indigo-500/20 flex flex-col relative">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
             BEST VALUE
          </div>
          <div className="mb-6">
             <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
               Business
             </span>
          </div>
          <div className="mb-6">
            <span className="text-5xl font-bold text-white">$20</span>
            <span className="text-slate-400"> / one-time</span>
          </div>
          <div className="mb-8">
            <p className="text-xl font-bold text-white mb-1">3,000 Credits</p>
            <p className="text-sm text-slate-400 text-indigo-300">+1,000 Bonus Credits</p>
          </div>
          <button
            onClick={() => handlePurchase('business')}
            disabled={!!processing}
            className="mt-auto w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {processing === 'business' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy with Crypto'}
          </button>
        </div>

        {/* Pro Pack ($5) */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-colors flex flex-col">
          <div className="mb-6">
             <span className="bg-slate-800 text-slate-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
               Pro
             </span>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$5</span>
            <span className="text-slate-400"> / one-time</span>
          </div>
          <div className="mb-8">
            <p className="text-xl font-bold text-white mb-1">600 Credits</p>
            <p className="text-sm text-slate-400 text-indigo-300">+100 Bonus Credits</p>
          </div>
          <button
            onClick={() => handlePurchase('pro')}
            disabled={!!processing}
            className="mt-auto w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
          >
            {processing === 'pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy with Crypto'}
          </button>
        </div>

      </div>

      <div className="mt-12 text-center text-sm text-slate-500">
          <p>Secure payments powered by Coinbase Commerce. Credits are added automatically after network confirmation.</p>
      </div>

    </div>
  );
}
