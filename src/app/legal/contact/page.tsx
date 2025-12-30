import Link from "next/link";
import { ArrowLeft, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
      
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            RunAds
          </Link>
          <div className="flex gap-6 text-sm font-medium">
             <Link href="/" className="hover:text-white transition-colors">Home</Link>
             <Link href="/login" className="hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors text-sm font-medium">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8">Contact Us</h1>
        
        <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
                <p className="text-lg">
                    Have questions, feedback, or need support? We're here to help. Reach out to us using the information below or fill out the form.
                </p>
                
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-1">Email</h3>
                        <p className="text-slate-400">support@runads.onrender.com</p>
                        <p className="text-slate-500 text-xs mt-1">We typically reply within 24 hours.</p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400">
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-white font-semibold mb-1">Location</h3>
                        <p className="text-slate-400">Istanbul, Turkey</p>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border border-white/10 rounded-2xl p-8">
                <form className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                        <input type="text" className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="Your name" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                        <input type="email" className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="your@email.com" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Message</label>
                        <textarea rows={4} className="w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" placeholder="How can we help?" />
                    </div>
                    <button type="button" className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold transition-colors">
                        Send Message
                    </button>
                    <p className="text-xs text-center text-slate-500 mt-4">
                        Note: This form is currently a demo placeholder. Please email us directly.
                    </p>
                </form>
            </div>
        </div>

      </main>
    </div>
  );
}
