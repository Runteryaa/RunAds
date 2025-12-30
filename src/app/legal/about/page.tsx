import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
      
      {/* Header/Nav */}
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

        <h1 className="text-4xl font-bold text-white mb-8">About RunAds</h1>
        
        <div className="space-y-8 text-lg leading-relaxed">
            <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
                <p>
                    RunAds was founded with a simple mission: to democratize online advertising for independent creators, developers, and small business owners. 
                    We believe that traffic exchange should be fair, transparent, and accessible to everyone, regardless of their budget.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-white mb-4">How It Works</h2>
                <p>
                    RunAds operates on a credit-based system. Publishers earn credits by displaying ads from other members on their websites. 
                    These credits can then be used to display their own ads across the network. It's a community-driven ecosystem where every view counts.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Quality & Trust</h2>
                <p>
                    We take the quality of our network seriously. Every website submitted to RunAds is manually reviewed by our team to ensure it meets our strict community guidelines. 
                    We do not allow adult content, illegal sites, or malicious software. Our anti-fraud systems work around the clock to ensure that the traffic you receive is genuine.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-semibold text-white mb-4">Join Us</h2>
                <p>
                    Whether you are a blogger looking for more readers, a developer launching a new tool, or a startup validating an idea, RunAds provides the platform you need to grow.
                </p>
            </section>
        </div>

      </main>
    </div>
  );
}
