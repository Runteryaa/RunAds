"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, updateDoc, increment } from "firebase/firestore";
import { Check, Loader2, CreditCard, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BuyCreditsPage() {
  const [processing, setProcessing] = useState<string | null>(null);
  const router = useRouter();

  const handlePurchase = async (packageId: string, amount: number) => {
    if (!auth.currentUser) return;
    setProcessing(packageId);

    try {
      // SIMULATION: In production, redirect to Stripe here.
      // await stripe.redirectToCheckout(...)
      
      // Simulating network delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Direct credit add (Secure this via server-side API/Webhook in production!)
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        credits: increment(amount)
      });

      alert(`Success! Added ${amount} credits to your account.`);
      // Force refresh or redirect to update balance in layout
      window.location.reload(); 
      
    } catch (error) {
      console.error("Purchase failed:", error);
      alert("Purchase failed. Please try again.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="text-center mb-16">
        <h1 className="text-3xl font-bold text-white mb-4">Boost Your Traffic</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Purchase credits to display your website on our network without waiting to earn them organically.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Starter Pack */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-colors flex flex-col">
          <div className="mb-6">
             <span className="bg-indigo-500/10 text-indigo-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
               Starter
             </span>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$5</span>
            <span className="text-slate-400">/one-time</span>
          </div>
          <div className="mb-8">
            <p className="text-xl font-bold text-white mb-1">500 Credits</p>
            <p className="text-sm text-slate-400">approx. 500 visitors</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> Instant Delivery
            </li>
            <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> No Expiration
            </li>
          </ul>
          <button
            onClick={() => handlePurchase('starter', 500)}
            disabled={!!processing}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {processing === 'starter' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy Now'}
          </button>
        </div>

        {/* Pro Pack (Featured) */}
        <div className="bg-slate-900 border-2 border-indigo-500 rounded-2xl p-8 transform md:-translate-y-4 shadow-2xl shadow-indigo-500/20 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">
             POPULAR
          </div>
          <div className="mb-6">
             <span className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide flex items-center gap-1 w-fit">
               <Sparkles className="w-3 h-3" /> Pro Value
             </span>
          </div>
          <div className="mb-6">
            <span className="text-5xl font-bold text-white">$20</span>
            <span className="text-slate-400">/one-time</span>
          </div>
          <div className="mb-8">
            <p className="text-xl font-bold text-white mb-1">2,500 Credits</p>
            <p className="text-sm text-slate-400">approx. 2,500 visitors</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> <span className="text-indigo-300 font-bold">+500 Bonus Credits</span>
            </li>
            <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> Instant Delivery
            </li>
            <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> Priority Support
            </li>
          </ul>
          <button
            onClick={() => handlePurchase('pro', 2500)}
            disabled={!!processing}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25"
          >
            {processing === 'pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy Now'}
          </button>
        </div>

        {/* Enterprise Pack */}
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 hover:border-indigo-500/50 transition-colors flex flex-col">
          <div className="mb-6">
             <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
               Business
             </span>
          </div>
          <div className="mb-6">
            <span className="text-4xl font-bold text-white">$50</span>
            <span className="text-slate-400">/one-time</span>
          </div>
          <div className="mb-8">
            <p className="text-xl font-bold text-white mb-1">7,000 Credits</p>
            <p className="text-sm text-slate-400">approx. 7,000 visitors</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> <span className="text-purple-300 font-bold">+2,000 Bonus Credits</span>
            </li>
            <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> Instant Delivery
            </li>
             <li className="flex items-center gap-3 text-slate-300 text-sm">
              <Check className="w-4 h-4 text-green-400" /> Account Manager
            </li>
          </ul>
          <button
            onClick={() => handlePurchase('business', 7000)}
            disabled={!!processing}
            className="w-full py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {processing === 'business' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buy Now'}
          </button>
        </div>

      </div>

      <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
              Secure payments powered by Stripe (Simulation Mode). By purchasing you agree to our <a href="/legal/terms" className="underline hover:text-white">Terms</a>.
          </p>
      </div>

    </div>
  );
}
