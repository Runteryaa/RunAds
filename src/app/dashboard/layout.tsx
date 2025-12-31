"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { BarChart3, Globe, LogOut, Plus, LayoutDashboard, Code, User as UserIcon, Loader2, CreditCard, Shield, Ban } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [banUntil, setBanUntil] = useState<Timestamp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);
        
        // Use onSnapshot for real-time credit updates
        const userRef = doc(db, "users", currentUser.uid);
        
        try {
            // First check if it exists
            let userDoc = await getDoc(userRef);
            
            if (!userDoc.exists()) {
                 console.log("User doc missing, attempting to recreate...");
                 try {
                      await setDoc(userRef, {
                          email: currentUser.email,
                          credits: 10,
                          createdAt: new Date(),
                      });
                 } catch (createErr: any) {
                      console.error("Auto-creation failed:", createErr);
                 }
            }

            // Listen for changes
            const unsubscribeSnapshot = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setCredits(data.credits || 0);
                    setIsAdmin(data.isAdmin === true);
                    setBanUntil(data.banUntil || null);
                }
                setLoading(false);
            }, (err) => {
                console.error("Snapshot Error:", err);
                setError("Failed to sync data.");
                setLoading(false);
            });

            return () => unsubscribeSnapshot(); // Cleanup listener

        } catch (err: any) {
             console.error("Dashboard Init Error:", err);
             setLoading(false);
        }
      });
      
      return () => unsubscribeAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // --- BAN ENFORCEMENT ---
  if (banUntil) {
      const banDate = banUntil.toDate();
      if (banDate > new Date()) {
          return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
                <div className="bg-red-900/20 border border-red-500/30 p-8 rounded-2xl max-w-md text-center shadow-2xl shadow-red-900/20">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Ban className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-red-400 mb-2">Account Suspended</h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        Your account has been suspended for violating our terms of service. You cannot access the dashboard until the suspension is lifted.
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-lg mb-6 border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Suspension Lifted On</p>
                        <p className="text-white font-mono">{banDate.toLocaleString()}</p>
                    </div>
                    <button 
                        onClick={() => auth.signOut()}
                        className="px-6 py-3 bg-white text-slate-900 font-bold hover:bg-slate-200 rounded-lg transition-colors w-full"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
          );
      }
  }

  if (error) {
     return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md text-center">
                <h3 className="text-xl font-bold text-red-400 mb-2">Error Loading Dashboard</h3>
                <p className="text-slate-300 mb-4">{error}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                >
                    Retry
                </button>
            </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 hidden md:flex flex-col bg-slate-950/50">
        <div className="p-6">
           <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">R</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
              RunAds
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link href="/dashboard/websites" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <Globe className="w-5 h-5" />
            My Websites
          </Link>
          <Link href="/dashboard/credits" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <CreditCard className="w-5 h-5" />
            Buy Credits
          </Link>

          {isAdmin && (
            <>
              <div className="my-4 border-t border-white/5"></div>
              <p className="px-4 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">Admin</p>
              
              <Link href="/dashboard/admin?tab=websites" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-indigo-500/10 hover:text-indigo-300 rounded-lg transition-colors">
                <Globe className="w-5 h-5" />
                Websites
              </Link>
              
              <Link href="/dashboard/admin?tab=users" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-indigo-500/10 hover:text-indigo-300 rounded-lg transition-colors">
                <UserIcon className="w-5 h-5" />
                Users
              </Link>
            </>
          )}

        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-4">
            <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-1">Balance</p>
            <div className="flex justify-between items-end">
                <p className="text-2xl font-bold text-white">{credits !== null ? credits : '-'} <span className="text-sm font-normal text-slate-400">Cr</span></p>
                <Link href="/dashboard/credits" className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors" title="Buy More">
                    <Plus className="w-4 h-4" />
                </Link>
            </div>
          </div>
          <button 
            onClick={() => auth.signOut()}
            className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="md:hidden p-4 border-b border-white/10 flex justify-between items-center bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
          <Link href="/" className="font-bold text-xl">RunAds</Link>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
                <span className="text-sm font-bold text-white">{credits !== null ? credits : '-'}</span>
                <Link href="/dashboard/credits"><Plus className="w-4 h-4 text-indigo-400" /></Link>
             </div>
             <button onClick={() => auth.signOut()}><LogOut className="w-5 h-5" /></button>
          </div>
        </header>
        <div className="p-6 md:p-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
