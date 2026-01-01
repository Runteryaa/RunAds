"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create User in Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log("User created in Auth:", user.uid);

      // 2. Create User Profile in Firestore
      try {
          await setDoc(doc(db, "users", user.uid), {
            email: user.email,
            credits: 50,
            createdAt: new Date(),
          });
          console.log("User profile created in Firestore");
      } catch (firestoreError: any) {
          console.error("Firestore Error:", firestoreError);
          // Even if firestore fails (e.g. permission or network), we should probably let them in 
          // or show a specific error. The auth is already done.
          // For now, let's treat it as a critical error but log it well.
          throw new Error("Account created but failed to initialize profile. Please contact support. " + firestoreError.message);
      }

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Registration Error:", err);
      // Map common codes to user friendly messages
      let msg = err.message;
      if (err.code === 'auth/email-already-in-use') {
          msg = "Email is already registered.";
      } else if (err.code === 'auth/operation-not-allowed') {
          msg = "Email/Password sign-up is not enabled in Firebase Console.";
      } else if (err.code === 'auth/weak-password') {
          msg = "Password is too weak.";
      }
      
      setError(msg || "Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="font-bold text-white text-xl">R</span>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-2">Join the ad network for smart growth.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign Up"}
          </button>
          <p className="mt-6 text-center text-slate-300 text-xs">By creating an account, you agree to our <Link href="/legal/terms" className="text-indigo-400">TermsOfService</Link>, <Link href="/legal/privacy" className="text-indigo-400">PrivacyPolicy</Link> and <Link href="/legal/cookie" className="text-indigo-400">CookiePolicy</Link>.</p>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
