"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc, onSnapshot, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { BarChart3, Globe, LogOut, Plus, LayoutDashboard, Code, User as UserIcon, Loader2, CreditCard, Shield, Ban, Copy, Check, DollarSign } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [banUntil, setBanUntil] = useState<Timestamp | null>(null);
  const [permanentBan, setPermanentBan] = useState(false);
  const [banReason, setBanReason] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
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
                    setBanUntil(data.bannedUntil || null); // Note: Changed to bannedUntil to match server action
                    setPermanentBan(data.permanentBan === true);
                    setBanReason(data.banReason || null);
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

  const handleCopyId = () => {
      if (user) {
          navigator.clipboard.writeText(user.uid);
          setCopiedId(true);
          setTimeout(() => setCopiedId(false), 2000);
      }
  };

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
  if (permanentBan) {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
            <div className="bg-red-950/50 border border-red-500/30 p-8 rounded-2xl max-w-md text-center shadow-2xl shadow-red-900/20 backdrop-blur-sm">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-red-500/50">
                    <Ban className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-3xl font-bold text-red-400 mb-4">Account Permanently Banned</h3>
                <p className="text-slate-300 mb-6 leading-relaxed text-lg">
                    {banReason || "Your account has been permanently banned due to severe violations of our terms of service."}
                </p>
                <div className="text-sm text-slate-500 mb-8">
                    If you believe this is a mistake, please contact support.
                </div>
                <button 
                    onClick={() => auth.signOut()}
                    className="px-6 py-3.5 bg-slate-800 text-white font-bold hover:bg-slate-700 rounded-xl transition-colors w-full border border-white/10"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
  }

  if (banUntil) {
      const banDate = banUntil.toDate();
      if (banDate > new Date()) {
          return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
                <div className="bg-orange-950/50 border border-orange-500/30 p-8 rounded-2xl max-w-md text-center shadow-2xl shadow-orange-900/20 backdrop-blur-sm">
                    <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-orange-500/50">
                        <Shield className="w-8 h-8 text-orange-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-orange-400 mb-2">Account Suspended</h3>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        {banReason || "Your account has been temporarily suspended."}
                    </p>
                    <div className="bg-slate-900/50 p-4 rounded-xl mb-6 border border-white/5">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Suspension Lifted On</p>
                        <p className="text-white font-mono text-lg">{banDate.toLocaleString()}</p>
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
          <Link href="/dashboard/credits" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <CreditCard className="w-5 h-5" />
            Buy Credits
          </Link>
          <Link href="/dashboard/cashout" className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
            <DollarSign className="w-5 h-5" />
            Cashout
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

        <div className="p-4 border-t border-white/10 space-y-4">
          
          {/* Credits Box */}
          <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-1">Credits</p>
            <div className="flex justify-between items-end">
                <p className="text-2xl font-bold text-white">{credits !== null ? credits : '-'}</p>
                <Link href="/dashboard/credits" className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors" title="Buy More">
                    <Plus className="w-4 h-4" />
                </Link>
            </div>
          </div>

          {/* User Info & Sign Out */}
          <div className="pt-2">
              {user && (
                  <div className="px-1 mb-3">
                      <p className="text-sm font-medium text-white truncate mb-1" title={user.email || ""}>
                          {user.email}
                      </p>
                      <div className="flex items-center gap-2 group cursor-pointer" onClick={handleCopyId} title="Click to copy User ID">
                          <code className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-white/5 font-mono truncate max-w-[120px]">
                              {user.uid}
                          </code>
                          {copiedId ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-slate-600 group-hover:text-slate-400" />}
                      </div>
                  </div>
              )}
              
              <button 
                onClick={() => auth.signOut()}
                className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-12 h-full mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
