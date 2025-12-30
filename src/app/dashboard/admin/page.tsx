'use client';

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Loader2, CheckCircle, XCircle, Shield, Trash2, Ban } from "lucide-react";

interface Website {
  id: string;
  domain: string;
  userId: string;
  status?: "pending" | "approved" | "denied" | "suspended"; // Status can be undefined
  active: boolean;
}

export default function AdminPage() {
  const [websites, setWebsites] = useState<Website[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchWebsites() {
    setLoading(true);
    setError(null);
    try {
      const querySnapshot = await getDocs(collection(db, "websites"));
      const sites = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Website));
      setWebsites(sites);
    } catch (err) {
      console.error("Error fetching websites:", err);
      setError("Failed to load websites. Please check Firestore permissions and try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWebsites();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "approved" | "denied" | "suspended") => {
    try {
      const isActive = newStatus === "approved";
      const docRef = doc(db, "websites", id);
      await updateDoc(docRef, {
        status: newStatus,
        active: isActive
      });
      setWebsites(prevWebsites => 
        prevWebsites.map(site => 
          site.id === id ? { ...site, status: newStatus, active: isActive } : site
        )
      );
    } catch (err) {
      console.error(`Error updating website ${id}:`, err);
      alert(`Failed to update website status.`);
    }
  };
  
  const handleDeleteWebsite = async (id: string) => {
      if(!window.confirm("Are you sure you want to delete this site? This is irreversible.")) return;
      try {
          await deleteDoc(doc(db, "websites", id));
          setWebsites(prevWebsites => prevWebsites.filter(site => site.id !== id));
      } catch (err) {
          console.error(`Error deleting website ${id}:`, err);
          alert("Failed to delete website.");
      }
  }

  const getStatusText = (status?: string) => {
      if (!status) return 'Unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-slate-400">Website Moderation Queue</p>
            </div>
        </div>
      </div>
      
      <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
        {loading ? (
          <div className="p-16 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : error ? (
          <div className="p-16 text-center text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="p-4 text-sm font-semibold text-slate-300">Domain</th>
                  <th className="p-4 text-sm font-semibold text-slate-300">User ID</th>
                  <th className="p-4 text-sm font-semibold text-slate-300">Status</th>
                  <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {websites.map((site) => (
                  <tr key={site.id} className="border-b border-white/5 hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-white font-medium">{site.domain}</td>
                    <td className="p-4 text-slate-400 text-xs truncate max-w-xs">{site.userId}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        site.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50' :
                        site.status === 'approved' ? 'bg-green-900/50 text-green-300 border border-green-700/50' :
                        site.status === 'denied' ? 'bg-red-900/50 text-red-300 border border-red-700/50' :
                        site.status === 'suspended' ? 'bg-slate-800 text-slate-400 border border-slate-700' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {getStatusText(site.status)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                            {(site.status === 'pending' || site.status === 'denied' || !site.status) && (
                                <button onClick={() => handleUpdateStatus(site.id, 'approved')} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" /> Approve
                                </button>
                            )}
                            {site.status === 'approved' && (
                                <button onClick={() => handleUpdateStatus(site.id, 'suspended')} className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs flex items-center gap-1.5">
                                    <Ban className="w-4 h-4" /> Suspend
                                </button>
                            )}
                            {site.status === 'suspended' && (
                                <button onClick={() => handleUpdateStatus(site.id, 'approved')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs flex items-center gap-1.5">
                                    <CheckCircle className="w-4 h-4" /> Unsuspend
                                </button>
                            )}
                             <button onClick={() => handleDeleteWebsite(site.id)} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-3 rounded-lg transition-colors text-xs flex items-center gap-1.5">
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
