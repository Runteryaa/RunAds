'use client';

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase"; // Import auth
import { collection, getDocs, doc, updateDoc, deleteDoc, increment, Timestamp } from "firebase/firestore";
import { Loader2, CheckCircle, XCircle, Shield, Trash2, Ban, User, Globe, Plus, Minus, MoreVertical, Crown, UserCog } from "lucide-react";

interface Website {
  id: string;
  domain: string;
  userId: string;
  status?: "pending" | "approved" | "denied" | "suspended";
  active: boolean;
}

interface UserData {
  id: string;
  email: string;
  credits: number;
  isAdmin?: boolean;
  isOwner?: boolean;
  banUntil?: Timestamp;
}

export default function AdminPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const tabParam = searchParams.get("tab");
  const activeTab = (tabParam === "users" ? "users" : "websites") as "websites" | "users";

  const [websites, setWebsites] = useState<Website[]>([]);
  const [loadingWebsites, setLoadingWebsites] = useState(true);

  const [users, setUsers] = useState<UserData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const [openBanDropdownId, setOpenBanDropdownId] = useState<string | null>(null);
  const [openRoleDropdownId, setOpenRoleDropdownId] = useState<string | null>(null);

  const [currentUserData, setCurrentUserData] = useState<UserData | null>(null);

  const [error, setError] = useState<string | null>(null);

  const setTab = (tab: "websites" | "users") => {
      router.push(`/dashboard/admin?tab=${tab}`);
  };

  async function fetchWebsites() {
    setLoadingWebsites(true);
    try {
      const querySnapshot = await getDocs(collection(db, "websites"));
      const sites = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Website));
      setWebsites(sites);
    } catch (err) {
      console.error("Error fetching websites:", err);
      setError("Failed to load websites.");
    } finally {
      setLoadingWebsites(false);
    }
  }

  async function fetchUsers() {
    setLoadingUsers(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserData));
      setUsers(usersData);
      
      // Find current user's data to determine permissions
      if (auth.currentUser) {
          const me = usersData.find(u => u.id === auth.currentUser?.uid);
          if (me) setCurrentUserData(me);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users.");
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    if (activeTab === "websites") fetchWebsites();
    if (activeTab === "users") fetchUsers();
  }, [activeTab]);

  // --- PERMISSION HELPERS ---
  const canManageRole = (targetUser: UserData) => {
      if (!currentUserData) return false;
      if (currentUserData.isOwner) return true; // Owner can manage everyone
      
      // Admin Logic
      if (currentUserData.isAdmin) {
          if (targetUser.isOwner) return false; // Admin cannot touch Owner
          if (targetUser.isAdmin) return false; // Admin cannot touch other Admin (cannot revoke)
          return true; // Admin CAN touch normal users
      }
      return false;
  };

  // --- WEBSITE ACTIONS ---
  const handleUpdateStatus = async (id: string, newStatus: "approved" | "denied" | "suspended") => {
    try {
      const isActive = newStatus === "approved";
      const docRef = doc(db, "websites", id);
      await updateDoc(docRef, { status: newStatus, active: isActive });
      setWebsites(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, active: isActive } : s));
    } catch (err) {
      alert("Failed to update status.");
    }
  };
  
  const handleDeleteWebsite = async (id: string) => {
      if(!window.confirm("Delete this site irreversibly?")) return;
      try {
          await deleteDoc(doc(db, "websites", id));
          setWebsites(prev => prev.filter(s => s.id !== id));
      } catch (err) {
          alert("Failed to delete website.");
      }
  }

  // --- USER ACTIONS ---
  const handleModifyCredits = async (userId: string, amount: number) => {
      try {
          const userRef = doc(db, "users", userId);
          await updateDoc(userRef, { credits: increment(amount) });
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, credits: (u.credits || 0) + amount } : u));
      } catch (err) {
          alert("Failed to update credits.");
      }
  }

  const handleUpdateRole = async (targetUser: UserData, newRole: 'user' | 'admin' | 'owner') => {
      // --- PERMISSION CHECKS ---
      if (!currentUserData) {
          alert("Error: Identity not verified.");
          return;
      }

      // 1. Check if I am authorized to manage this specific user at all
      if (!canManageRole(targetUser)) {
          alert("You do not have permission to modify this user's role.");
          return;
      }

      // 2. Specific Action Checks for Admins (Owners bypass this)
      if (!currentUserData.isOwner) {
          
          // Cannot promote anyone to Owner
          if (newRole === 'owner') {
              alert("Only Owners can assign the Owner role.");
              return;
          }

          // Cannot demote an Admin (Take Role)
          // (Note: canManageRole already covers 'targetUser.isAdmin', but safe to double check logic)
          if (targetUser.isAdmin && newRole === 'user') {
              alert("Admins cannot remove Admin status from others.");
              return;
          }
      }

      try {
          const userRef = doc(db, "users", targetUser.id);
          let updates: any = {};
          
          if (newRole === 'user') {
              updates = { isAdmin: false, isOwner: false };
          } else if (newRole === 'admin') {
              updates = { isAdmin: true, isOwner: false };
          } else if (newRole === 'owner') {
              updates = { isAdmin: true, isOwner: true };
          }

          console.log(`Setting role for ${targetUser.id} to ${newRole}`);
          await updateDoc(userRef, updates);
          
          setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, ...updates } : u));
          setOpenRoleDropdownId(null);
      } catch (err: any) {
          console.error("Update Role Error:", err);
          alert(`Failed to update role: ${err.message}`);
      }
  }

  const handleBanUser = async (userId: string, duration: '1d' | '1w' | '1m' | '1y' | 'perma' | 'unban') => {
      const banDate = new Date();
      if (duration === '1d') banDate.setDate(banDate.getDate() + 1);
      if (duration === '1w') banDate.setDate(banDate.getDate() + 7);
      if (duration === '1m') banDate.setMonth(banDate.getMonth() + 1);
      if (duration === '1y') banDate.setFullYear(banDate.getFullYear() + 1);
      if (duration === 'perma') banDate.setFullYear(banDate.getFullYear() + 100);

      try {
          const userRef = doc(db, "users", userId);
          const timestamp = duration === 'unban' ? null : Timestamp.fromDate(banDate);
          await updateDoc(userRef, { banUntil: timestamp });
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, banUntil: timestamp || undefined } : u));
          setOpenBanDropdownId(null);
      } catch (err) {
          console.error(err);
          alert("Failed to ban user.");
      }
  }

  const getStatusText = (status?: string) => {
      if (!status) return 'Unknown';
      return status.charAt(0).toUpperCase() + status.slice(1);
  }

  const isBanned = (user: UserData) => {
      if (!user.banUntil) return false;
      return user.banUntil.toMillis() > Date.now();
  }

  return (
    <div className="max-w-7xl mx-auto pb-12" onClick={() => { setOpenBanDropdownId(null); setOpenRoleDropdownId(null); }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-indigo-400" />
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-slate-400">System Administration</p>
            </div>
        </div>

        <div className="flex bg-slate-900/50 p-1 rounded-lg border border-white/10">
          <button 
            onClick={() => setTab("websites")}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "websites" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
              <Globe className="w-4 h-4" /> Websites
          </button>
          <button 
            onClick={() => setTab("users")}
            className={`flex items-center gap-2 px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === "users" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
          >
              <User className="w-4 h-4" /> Users
          </button>
        </div>
      </div>
      
      {error && <div className="p-4 mb-6 bg-red-900/50 border border-red-500/50 text-red-300 rounded-xl">{error}</div>}

      {/* WEBSITES PANEL */}
      {activeTab === "websites" && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
            {loadingWebsites ? (
            <div className="p-16 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
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
                        <td className="p-4 text-slate-400 text-xs font-mono">{site.userId}</td>
                        <td className="p-4">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                            site.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50' :
                            site.status === 'approved' ? 'bg-green-900/50 text-green-300 border border-green-700/50' :
                            site.status === 'denied' ? 'bg-red-900/50 text-red-300 border border-red-700/50' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                            {getStatusText(site.status)}
                        </span>
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                                {(site.status === 'pending' || site.status === 'denied' || !site.status) && (
                                    <button onClick={() => handleUpdateStatus(site.id, 'approved')} className="bg-green-600 hover:bg-green-500 text-white p-2 rounded-lg" title="Approve">
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                                {site.status === 'approved' && (
                                    <button onClick={() => handleUpdateStatus(site.id, 'suspended')} className="bg-yellow-600 hover:bg-yellow-500 text-white p-2 rounded-lg" title="Suspend">
                                        <Ban className="w-4 h-4" />
                                    </button>
                                )}
                                {site.status === 'suspended' && (
                                    <button onClick={() => handleUpdateStatus(site.id, 'approved')} className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded-lg" title="Unsuspend">
                                        <CheckCircle className="w-4 h-4" />
                                    </button>
                                )}
                                <button onClick={() => handleDeleteWebsite(site.id)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg" title="Delete">
                                    <Trash2 className="w-4 h-4" />
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
      )}

      {/* USERS PANEL */}
      {activeTab === "users" && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
            {loadingUsers ? (
            <div className="p-16 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-400" /></div>
            ) : (
            <div className="overflow-x-auto" style={{ minHeight: '400px' }}>
                <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-white/10">
                    <th className="p-4 text-sm font-semibold text-slate-300">Email</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">User ID</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Credits</th>
                    <th className="p-4 text-sm font-semibold text-slate-300">Role</th>
                    <th className="p-4 text-sm font-semibold text-slate-300 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                    <tr key={user.id} className={`border-b border-white/5 transition-colors ${isBanned(user) ? 'bg-red-900/10' : 'hover:bg-slate-800/50'}`}>
                        <td className="p-4 text-white font-medium">
                            {user.email}
                            {isBanned(user) && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30 font-bold uppercase">Banned</span>}
                        </td>
                        <td className="p-4 text-slate-400 text-xs font-mono">{user.id}</td>
                        <td className="p-4 text-indigo-300 font-bold">{user.credits || 0}</td>
                        <td className="p-4 text-slate-400 text-xs">
                            {user.isOwner ? (
                                <span className="text-yellow-400 font-bold flex items-center gap-1"><Crown className="w-3 h-3 fill-current" /> Owner</span>
                            ) : user.isAdmin ? (
                                <span className="text-purple-400 font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>
                            ) : (
                                "User"
                            )}
                        </td>
                        <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end items-center relative">
                                <button 
                                    onClick={() => handleModifyCredits(user.id, 100)} 
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg flex items-center gap-1 text-xs"
                                    title="Add 100 Credits"
                                >
                                    <Plus className="w-3 h-3" /> 100
                                </button>
                                <button 
                                    onClick={() => handleModifyCredits(user.id, -100)} 
                                    className="bg-slate-700 hover:bg-slate-600 text-white p-2 rounded-lg flex items-center gap-1 text-xs"
                                    title="Remove 100 Credits"
                                >
                                    <Minus className="w-3 h-3" /> 100
                                </button>
                                
                                <div className="h-6 w-px bg-white/10 mx-1"></div>

                                {/* ROLE DROPDOWN */}
                                <div className="relative">
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            if (canManageRole(user)) {
                                                setOpenRoleDropdownId(openRoleDropdownId === user.id ? null : user.id); 
                                                setOpenBanDropdownId(null); 
                                            } else {
                                                alert("You do not have permission to manage this user's role.");
                                            }
                                        }}
                                        className={`p-2 rounded-lg transition-colors ${
                                            !canManageRole(user) ? 'opacity-50 cursor-not-allowed ' : ''
                                        }${
                                            user.isOwner ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : user.isAdmin ? 'bg-purple-600 hover:bg-purple-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                                        }`}
                                        title="Change Role"
                                    >
                                        <UserCog className="w-4 h-4" />
                                    </button>

                                    {openRoleDropdownId === user.id && (
                                        <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                            
                                            {/* Option: USER (Downgrade) */}
                                            {/* Only show if I am Owner OR (I am Admin AND target is NOT Admin/Owner - which is implicit by canManageRole) */}
                                            {/* Wait, canManageRole returns FALSE if Admin tries to touch Admin. So if menu opens, we can manage. */}
                                            {/* BUT we still need to hide 'User' if they are ALREADY 'User' (redundant) */}
                                            {(!user.isAdmin && !user.isOwner) ? null : (
                                                <button onClick={() => handleUpdateRole(user, 'user')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                                                    <User className="w-3 h-3" /> User
                                                </button>
                                            )}

                                            {/* Option: ADMIN */}
                                            {/* Show if target is NOT Admin (Promotion) OR if Owner wants to Demote Owner to Admin */}
                                            {/* If user is ALREADY Admin, hide option */}
                                            {(!user.isAdmin || user.isOwner) && (
                                                <button onClick={() => handleUpdateRole(user, 'admin')} className="w-full text-left px-4 py-2 text-sm text-purple-400 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                                                    <Shield className="w-3 h-3" /> Admin
                                                </button>
                                            )}

                                            {/* Option: OWNER */}
                                            {/* Only if I am Owner */}
                                            {currentUserData?.isOwner && !user.isOwner && (
                                                <button onClick={() => handleUpdateRole(user, 'owner')} className="w-full text-left px-4 py-2 text-sm text-yellow-400 hover:bg-slate-800 hover:text-white flex items-center gap-2">
                                                    <Crown className="w-3 h-3" /> Owner
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* BAN DROPDOWN */}
                                <div className="relative">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setOpenBanDropdownId(openBanDropdownId === user.id ? null : user.id); setOpenRoleDropdownId(null); }}
                                        className="bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-500/30 p-2 rounded-lg transition-colors"
                                        title="Ban User"
                                    >
                                        <Ban className="w-4 h-4" />
                                    </button>
                                    
                                    {openBanDropdownId === user.id && (
                                        <div className="absolute right-0 top-full mt-2 w-32 bg-slate-900 border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => handleBanUser(user.id, '1d')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">1 Day</button>
                                            <button onClick={() => handleBanUser(user.id, '1w')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">1 Week</button>
                                            <button onClick={() => handleBanUser(user.id, '1m')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">1 Month</button>
                                            <button onClick={() => handleBanUser(user.id, '1y')} className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white">1 Year</button>
                                            <button onClick={() => handleBanUser(user.id, 'perma')} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 font-bold">Permaban</button>
                                            <div className="border-t border-white/10 my-1"></div>
                                            <button onClick={() => handleBanUser(user.id, 'unban')} className="w-full text-left px-4 py-2 text-sm text-green-400 hover:bg-green-900/20 font-bold">Unban</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            )}
        </div>
      )}

    </div>
  );
}
