"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Loader2, ArrowLeft, Copy, Check, Save, Play, Pause, MonitorPlay, MonitorStop } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function WebsiteDetailsPage() {
  const params = useParams();
  const [website, setWebsite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable fields
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [adTitle, setAdTitle] = useState("");
  const [adDescription, setAdDescription] = useState("");
  const [widgetColor, setWidgetColor] = useState("#4f46e5");
  const [widgetBgColor, setWidgetBgColor] = useState("#ffffff");

  // Control fields
  const [campaignActive, setCampaignActive] = useState(false); // active: Is my site being advertised?
  const [showAds, setShowAds] = useState(true); // showAds: Do I show ads on my site?

  const websiteId = params.id as string;

  useEffect(() => {
    const fetchWebsite = async () => {
      if (!websiteId) return;
      try {
        const docRef = doc(db, "websites", websiteId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setWebsite({ id: docSnap.id, ...data });
          
          // Set initial state for editable fields with fallbacks
          setRefreshInterval(data.refreshInterval || 30);
          setAdTitle(data.adTitle || data.domain || "");
          setAdDescription(data.adDescription || "");
          setWidgetColor(data.widgetColor || "#4f46e5");
          setWidgetBgColor(data.widgetBgColor || "#ffffff");
          
          setCampaignActive(data.active || false);
          setShowAds(data.showAds !== false); // Default to true if undefined
        }
      } catch (error) {
        console.error("Error fetching website:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsite();
  }, [websiteId]);

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setUpdating(true);
      try {
          const docRef = doc(db, "websites", websiteId);
          await updateDoc(docRef, {
              refreshInterval: Number(refreshInterval),
              adTitle,
              adDescription,
              widgetColor,
              widgetBgColor
          });
          // Optimistic update
          setWebsite((prev: any) => ({
              ...prev,
              refreshInterval: Number(refreshInterval),
              adTitle,
              adDescription,
              widgetColor,
              widgetBgColor
          }));
          alert("Settings updated!");
      } catch (error) {
          console.error("Error updating settings:", error);
          alert("Failed to update settings.");
      } finally {
          setUpdating(false);
      }
  };

  const toggleCampaign = async () => {
      try {
          const newState = !campaignActive;
          const docRef = doc(db, "websites", websiteId);
          await updateDoc(docRef, { active: newState });
          setCampaignActive(newState);
      } catch (error) {
          console.error("Error toggling campaign:", error);
          alert("Failed to update campaign status.");
      }
  };

  const toggleShowAds = async () => {
    try {
        const newState = !showAds;
        const docRef = doc(db, "websites", websiteId);
        await updateDoc(docRef, { showAds: newState });
        setShowAds(newState);
    } catch (error) {
        console.error("Error toggling ad display:", error);
        alert("Failed to update ad display status.");
    }
};

  const copyToClipboard = () => {
    const scriptTag = `<script src="${window.location.origin}/api/script?id=${websiteId}" async></script>`;
    navigator.clipboard.writeText(scriptTag);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!website) {
    return <div className="text-white">Website not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>
      
      <div className="grid lg:grid-cols-3 gap-8 mb-8">
        
        {/* LEFT COLUMN: Controls & Code */}
        <div className="lg:col-span-1 space-y-6">
            
            {/* Control Panel */}
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Control Panel</h2>
                <div className="space-y-4">
                    
                    {/* Campaign Status */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-white/5 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">Campaign Status</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${campaignActive ? 'bg-green-500/10 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                {campaignActive ? 'RUNNING' : 'PAUSED'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {campaignActive ? "Your website is currently being advertised on the network." : "Your website is NOT being advertised."}
                        </p>
                        <button 
                            onClick={toggleCampaign}
                            className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors ${
                                campaignActive 
                                ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' 
                                : 'bg-green-600 hover:bg-green-500 text-white'
                            }`}
                        >
                            {campaignActive ? <><Pause className="w-3 h-3" /> Stop Campaign</> : <><Play className="w-3 h-3" /> Start Campaign</>}
                        </button>
                    </div>

                    {/* Ad Display Status */}
                    <div className="p-4 bg-slate-950 rounded-xl border border-white/5 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-slate-300">Ad Display</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${showAds ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-700 text-slate-400'}`}>
                                {showAds ? 'ACTIVE' : 'DISABLED'}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">
                            {showAds ? "You are earning credits by showing ads on your site." : "Ads are hidden on your site. You are NOT earning credits."}
                        </p>
                        <button 
                            onClick={toggleShowAds}
                            className={`w-full py-2 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-colors ${
                                showAds 
                                ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-white/10' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            }`}
                        >
                            {showAds ? <><MonitorStop className="w-3 h-3" /> Stop Showing Ads</> : <><MonitorPlay className="w-3 h-3" /> Start Showing Ads</>}
                        </button>
                    </div>

                </div>
            </div>

             <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Integration</h2>
                <div className="relative group">
                    <div className="relative bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-300 break-all border border-white/10">
                        {`<script src="${typeof window !== 'undefined' ? window.location.origin : ''}/api/script?id=${websiteId}" async></script>`}
                    </div>
                    <button 
                        onClick={copyToClipboard}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-md transition-colors border border-white/10"
                        title="Copy code"
                    >
                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                </div>
            </div>

             <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Analytics</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 mb-1">Views</p>
                        <p className="text-xl font-bold text-white">{website.views || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-950 rounded-xl border border-white/5">
                        <p className="text-xs text-slate-500 mb-1">Clicks</p>
                        <p className="text-xl font-bold text-white">{website.clicks || 0}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Settings Form */}
        <div className="lg:col-span-2">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white mb-6">Website Settings</h2>
                
                <form onSubmit={handleUpdate} className="space-y-8">
                    {/* Basic Info (Read Only) */}
                    <div className="grid grid-cols-2 gap-6 pb-6 border-b border-white/5">
                         <div>
                            <label className="text-xs text-slate-500 uppercase font-semibold">Domain</label>
                            <p className="text-white font-medium">{website.domain}</p>
                        </div>
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-semibold">Category</label>
                            <p className="text-white font-medium">{website.category}</p>
                        </div>
                    </div>

                    {/* Ad Creative */}
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-white">Ad Creative</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                             <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Ad Title</label>
                                <input type="text" maxLength={50} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" value={adTitle} onChange={(e) => setAdTitle(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                                <input type="text" maxLength={100} className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" value={adDescription} onChange={(e) => setAdDescription(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Widget Customization */}
                    <div className="space-y-4">
                         <h3 className="text-base font-semibold text-white">Widget Appearance</h3>
                         <div className="grid md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Refresh Interval (s)</label>
                                    <input type="number" min="10" max="300" className="w-full px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white" value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Accent Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" className="h-10 w-10 bg-transparent border-0 cursor-pointer" value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)} />
                                        <input type="text" className="flex-1 px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white uppercase text-sm" value={widgetColor} onChange={(e) => setWidgetColor(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">Bg Color</label>
                                    <div className="flex gap-2">
                                        <input type="color" className="h-10 w-10 bg-transparent border-0 cursor-pointer" value={widgetBgColor} onChange={(e) => setWidgetBgColor(e.target.value)} />
                                        <input type="text" className="flex-1 px-4 py-2 bg-slate-950 border border-white/10 rounded-lg text-white uppercase text-sm" value={widgetBgColor} onChange={(e) => setWidgetBgColor(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview in Edit Mode */}
                            <div className="flex flex-col items-center justify-center p-4 bg-slate-800/30 rounded-xl border border-white/5">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-4">Live Preview</p>
                                <div className="w-full max-w-[280px] rounded-xl overflow-hidden shadow-2xl" style={{ backgroundColor: widgetBgColor }}>
                                    <div style={{ background: `linear-gradient(135deg, ${widgetColor}, ${widgetColor}dd)`, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div className="flex items-center gap-2">
                                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold text-white uppercase">Ad</span>
                                            <span className="text-white font-semibold text-xs">RunAds</span>
                                        </div>
                                        <div className="text-white/80 text-lg leading-none">&times;</div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-sm mb-1" style={{ color: widgetBgColor === '#ffffff' ? '#1e293b' : '#ffffff' }}>{adTitle || "Example Title"}</h3>
                                        <p className="text-xs leading-relaxed" style={{ color: widgetBgColor === '#ffffff' ? '#64748b' : '#94a3b8' }}>{adDescription || "Ad description here."}</p>
                                    </div>
                                    <div className="px-4 py-2 border-t flex justify-between items-center" style={{ borderColor: widgetBgColor === '#ffffff' ? '#e2e8f0' : 'rgba(255,255,255,0.1)', backgroundColor: widgetBgColor === '#ffffff' ? '#f8fafc' : 'rgba(0,0,0,0.1)' }}>
                                        <span className="text-[10px]" style={{ color: widgetBgColor === '#ffffff' ? '#94a3b8' : 'rgba(255,255,255,0.5)' }}>Powered by RunAds</span>
                                        <span className="text-[10px] font-bold" style={{ color: widgetColor }}>Visit Site &rarr;</span>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>

                    <button
                        type="submit"
                        disabled={updating}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {updating ? <Loader2 className="w-5 h-5 animate-spin" /> : <> <Save className="w-4 h-4" /> Save Changes </>}
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
}
