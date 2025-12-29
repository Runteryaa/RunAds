"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { BarChart3, Globe, LogOut, Plus, LayoutDashboard, Code, User as UserIcon, Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);
        
        try {
          // Attempt to read user document
          const userRef = doc(db, "users", currentUser.uid);
          let userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
              // If it doesn't exist, try to create it (Auto-healing)
              // This handles cases where Auth succeeded but Firestore failed during registration
              console.log("User doc missing, attempting to recreate...");
              try {
                  await setDoc(userRef, {
                      email: currentUser.email,
                      credits: 10,
                      createdAt: new Date(),
                  });
                  userDoc = await getDoc(userRef); // Retry fetch
                  console.log("User doc recreated.");
              } catch (createErr: any) {
                  // If creation fails, it's likely a permission issue
                  console.error("Auto-creation failed:", createErr);
                  throw createErr;
              }
          }

          if (userDoc.exists()) {
            setCredits(userDoc.data().credits || 0);
          } else {
             // Still missing
             setCredits(0);
          }
          setLoading(false);
        } catch (err: any) {
          console.error("Dashboard Layout Error:", err);
          
          if (err.code === 'permission-denied') {
              setError("Permission denied. Please check your Firestore Security Rules.");
          } else if (err.code === 'unavailable') {
             setError("Connection to database failed. Please check your internet connection.");
          } else {
             setError("Failed to load user data. " + err.message);
          }
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
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-4">
            <p className="text-xs text-indigo-300 uppercase font-bold tracking-wider mb-1">Balance</p>
            <p className="text-2xl font-bold text-white">{credits !== null ? credits : '-'} <span className="text-sm font-normal text-slate-400">Credits</span></p>
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
          <button onClick={() => auth.signOut()}><LogOut className="w-5 h-5" /></button>
        </header>
        <div className="p-6 md:p-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
