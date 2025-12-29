"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Plus, Globe, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebsites = async () => {
      if (!auth.currentUser) return;
      
      try {
        const q = query(
          collection(db, "websites"),
          where("userId", "==", auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const sites = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWebsites(sites);
      } catch (error) {
        console.error("Error fetching websites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Overview</h1>
          <p className="text-slate-400">Welcome back to your dashboard.</p>
        </div>
        <Link 
          href="/dashboard/websites/new" 
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Website
        </Link>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-slate-900 border border-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : websites.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {websites.map((site) => (
            <Link 
              href={`/dashboard/websites/${site.id}`} 
              key={site.id}
              className="group block p-6 bg-slate-900 border border-white/5 hover:border-indigo-500/50 rounded-xl transition-all hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-slate-950 rounded-lg border border-white/10 group-hover:scale-105 transition-transform">
                  <Globe className="w-6 h-6 text-indigo-400" />
                </div>
                <div className={`px-2 py-1 text-xs font-medium rounded-full border ${site.active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                  {site.active ? 'Active' : 'Pending'}
                </div>
              </div>
              <h3 className="text-lg font-bold text-white mb-1 truncate">{site.domain}</h3>
              <p className="text-sm text-slate-400 mb-4">{site.category}</p>
              
              <div className="flex items-center text-sm text-indigo-400 font-medium group-hover:translate-x-1 transition-transform">
                View Details <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-900/50 border border-white/5 rounded-2xl border-dashed">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No websites yet</h3>
          <p className="text-slate-400 max-w-sm mx-auto mb-6">Add your first website to start earning credits and displaying ads.</p>
          <Link 
            href="/dashboard/websites/new" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Website
          </Link>
        </div>
      )}
    </div>
  );
}
