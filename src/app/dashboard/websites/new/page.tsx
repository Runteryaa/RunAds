"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { submitWebsite } from "@/app/actions/websites";

const CATEGORIES = [
  "Technology", "Finance", "Health", "Education", "Entertainment", "E-commerce", "Blog", "Other"
];

export default function NewWebsitePage() {
  const [domain, setDomain] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [refreshInterval, setRefreshInterval] = useState(30);
  
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");

  const [widgetColor, setWidgetColor] = useState("#4f46e5");
  const [widgetBgColor, setWidgetBgColor] = useState("#ffffff");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);
    setError(null);

    try {
      const idToken = await auth.currentUser.getIdToken();
      
      await submitWebsite(idToken, {
        domain,
        category,
        refreshInterval: Number(refreshInterval),
        adTitle: adTitle || domain,
        adDescription: adDescription || `Check out this ${category} website.`,
        widgetColor,
        widgetBgColor,
      });

      router.push("/dashboard/websites");
    } catch (error: any) {
      console.error("Error adding website:", error);
      setError(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <Link href="/dashboard/websites" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Websites
      </Link>
      
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2">Add New Website</h1>
        <p className="text-slate-400 mb-8">Your website will be submitted for review before it goes live. This usually takes around 12-24hours.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {error && (
            <div className="bg-red-900/50 border border-red-500/50 text-red-300 p-4 rounded-lg">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Website Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Domain Name</label>
                    <div className="relative">
                        <span className="absolute left-4 top-3.5 text-slate-500">https://</span>
                        <input
                        type="text"
                        required
                        className="w-full pl-20 pr-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="example.com"
                        value={domain}
                        onChange={(e) => setDomain(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                    <select
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors appearance-none"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                    </select>
                </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Ad Creative</h3>
            <p className="text-xs text-slate-400">This is how your website will appear when advertised on other sites.</p>
            
            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ad Title</label>
                <input
                  type="text"
                  maxLength={50}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="e.g. The Best Tech News"
                  value={adTitle}
                  onChange={(e) => setAdTitle(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Ad Description</label>
                <textarea
                  rows={2}
                  maxLength={100}
                  className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="e.g. Daily updates on the latest gadgets and software."
                  value={adDescription}
                  onChange={(e) => setAdDescription(e.target.value)}
                />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-2">Widget Customization</h3>
            <p className="text-xs text-slate-400">Customize how the ad popup looks on YOUR website.</p>
            
            <div className="grid md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Ad Refresh Interval (s)</label>
                    <input
                    type="number"
                    min="10"
                    max="300"
                    required
                    className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    value={refreshInterval}
                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Accent Color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            className="h-12 w-12 bg-transparent border-0 cursor-pointer"
                            value={widgetColor}
                            onChange={(e) => setWidgetColor(e.target.value)}
                        />
                        <input 
                            type="text" 
                            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white uppercase"
                            value={widgetColor}
                            onChange={(e) => setWidgetColor(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Background Color</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            className="h-12 w-12 bg-transparent border-0 cursor-pointer"
                            value={widgetBgColor}
                            onChange={(e) => setWidgetBgColor(e.target.value)}
                        />
                        <input 
                            type="text" 
                            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white uppercase"
                            value={widgetBgColor}
                            onChange={(e) => setWidgetBgColor(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="mt-6 p-6 bg-slate-800/50 rounded-xl border border-white/5">
                <p className="text-xs font-bold text-slate-500 uppercase mb-4">Preview</p>
                <div className="w-80 mx-auto rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: widgetBgColor }}>
                    <div style={{ background: `linear-gradient(135deg, ${widgetColor}, ${widgetColor}dd)`, padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div className="flex items-center gap-2">
                             <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase">Ad</span>
                             <span className="text-white font-semibold text-xs">RunAds Network</span>
                        </div>
                        <div className="text-white/80 text-lg leading-none">&times;</div>
                    </div>
                    <div className="p-4">
                        <h3 className="font-bold text-base mb-1" style={{ color: widgetBgColor === '#ffffff' ? '#1e293b' : '#ffffff' }}>{adTitle || "Example Ad Title"}</h3>
                        <p className="text-sm" style={{ color: widgetBgColor === '#ffffff' ? '#64748b' : '#94a3b8' }}>{adDescription || "This is how ads will look on your website."}</p>
                    </div>
                     <div className="px-4 py-2 border-t flex justify-between items-center" style={{ borderColor: widgetBgColor === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.1)', backgroundColor: widgetBgColor === '#ffffff' ? '#f8fafc' : 'rgba(0,0,0,0.1)' }}>
                         <span className="text-[10px]" style={{ color: widgetBgColor === '#ffffff' ? '#94a3b8' : 'rgba(255,255,255,0.5)' }}>Powered by RunAds</span>
                         <span className="text-xs font-bold" style={{ color: widgetColor }}>Visit Site &rarr;</span>
                     </div>
                </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit for Review"}
          </button>
        </form>
      </div>
    </div>
  );
}