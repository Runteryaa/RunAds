"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Globe, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";

export default function LandingPage() {
  
  useEffect(() => {
    // Inject Demo Script
    const script = document.createElement('script');
    script.src = '/api/script?id=DEMO';
    script.async = true;
    document.body.appendChild(script);

    return () => {
        // Cleanup if needed (though difficult with appended scripts)
        const widget = document.getElementById('runads-widget');
        if (widget) widget.remove();
        document.body.removeChild(script);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white overflow-hidden">
      {/* Navbar */}
      <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-lg">R</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              RunAds
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-white transition-colors">Features</Link>
            <Link href="#how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-5 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/register" className="px-5 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -z-10" />
        
        <div className="container mx-auto px-6 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-6 inline-block">
              Advertising Network 2.0
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
              Grow Your Website Traffic <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
                For Free.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Join the RunAds network. Embed our smart widget, display relevant ads, and earn credits to show your ads on other high-quality sites.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/register" className="group px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-slate-100 transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] flex items-center gap-2">
                Start Growing Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#how-it-works" className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                Learn More
              </Link>
            </div>
            
             <div className="mt-8 p-4 bg-slate-900/50 rounded-lg inline-block border border-white/10 max-w-xl mx-auto">
                <p className="text-sm text-slate-400 mb-2">Want to see it in action? Look at the bottom right corner!</p>
                <div className="flex items-center gap-2 bg-black/30 p-2 rounded text-xs font-mono text-indigo-300">
                    <span className="select-none text-slate-500">$</span>
                    <span className="break-all">{`<script src="https://runads.com/api/script?id=DEMO" async></script>`}</span>
                </div>
            </div>

          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-slate-900/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Globe className="w-8 h-8 text-cyan-400" />}
              title="Targeted Traffic"
              description="Ads are shown only on websites within your specific category, ensuring high-quality, relevant visitors."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-8 h-8 text-purple-400" />}
              title="Domain Locked"
              description="Scripts are secured to your specific domain. No unauthorized usage or traffic theft."
            />
            <FeatureCard 
              icon={<BarChart3 className="w-8 h-8 text-indigo-400" />}
              title="Real-time Analytics"
              description="Track views, clicks, and balance growth in real-time from your comprehensive dashboard."
            />
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How RunAds Works</h2>
            <p className="text-slate-400">Simple steps to skyrocket your reach.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Step number="01" title="Create an Account" desc="Sign up and add your website details including domain and category." />
              <Step number="02" title="Embed the Script" desc="Copy the unique, secure code snippet and paste it into your website's body." />
              <Step number="03" title="Earn & Grow" desc="Display ads to earn credits. Your credits automatically display your ads on other sites." />
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
                 <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div className="ml-4 h-2 w-32 bg-slate-800 rounded-full" />
                 </div>
                 <div className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-2/3 h-32 bg-slate-800/50 rounded-lg animate-pulse" />
                        <div className="w-1/3 h-32 bg-slate-800/50 rounded-lg animate-pulse" />
                    </div>
                    <div className="h-4 w-full bg-slate-800/50 rounded-full" />
                    <div className="h-4 w-5/6 bg-slate-800/50 rounded-full" />
                    
                    {/* Simulated Widget */}
                    <div className="absolute bottom-8 right-8 w-64 bg-slate-800 border border-indigo-500/30 rounded-lg p-4 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded flex-shrink-0" />
                            <div>
                                <p className="text-xs text-indigo-300 font-bold mb-1">Sponsored</p>
                                <p className="text-sm font-medium text-white">Boost your sales today!</p>
                            </div>
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10 bg-slate-950">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} RunAds Network. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-2xl bg-slate-900 border border-white/5 hover:border-indigo-500/30 transition-all hover:bg-slate-800/50 group">
      <div className="mb-6 p-3 bg-slate-950 rounded-xl inline-block border border-white/10 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function Step({ number, title, desc }: { number: string, title: string, desc: string }) {
  return (
    <div className="flex gap-6">
      <div className="text-4xl font-black text-slate-800">{number}</div>
      <div>
        <h4 className="text-xl font-bold text-white mb-2">{title}</h4>
        <p className="text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
