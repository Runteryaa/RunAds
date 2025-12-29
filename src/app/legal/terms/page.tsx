import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
        <p className="mb-4 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
            <p>
              These Terms of Service constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and RunAds ("we," "us," or "our"), 
              concerning your access to and use of the RunAds website as well as any other media form, media channel, mobile website or mobile application related, linked, or otherwise connected thereto (collectively, the "Site").
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Intellectual Property Rights</h2>
            <p>
              Unless otherwise indicated, the Site is our proprietary property and all source code, databases, functionality, software, website designs, audio, video, text, photographs, and graphics on the Site (collectively, the "Content") and the trademarks, service marks, and logos contained therein (the "Marks") are owned or controlled by us or licensed to us, and are protected by copyright and trademark laws.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">3. User Representations</h2>
            <p>
              By using the Site, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information and promptly update such registration information as necessary; (3) you have the legal capacity and you agree to comply with these Terms of Service.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Prohibited Activities</h2>
            <p>You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us. Prohibited activities include, but are not limited to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Systematic retrieval of data or other content from the Site to create or compile, directly or indirectly, a collection, compilation, database, or directory without written permission from us.</li>
              <li>Trick, defraud, or mislead us and other users, especially in any attempt to learn sensitive account information such as user passwords.</li>
              <li>Use any information obtained from the Site in order to harass, abuse, or harm another person.</li>
              <li>Use the Site in a manner inconsistent with any applicable laws or regulations.</li>
              <li>Click fraud or using bots to artificially inflate ad views or clicks.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">5. User Generated Content</h2>
            <p>
               The Site may invite you to chat, contribute to, or participate in blogs, message boards, online forums, and other functionality, and may provide you with the opportunity to create, submit, post, display, transmit, perform, publish, distribute, or broadcast content and materials to us or on the Site.
               Any content you upload (including website metadata for ads) must not be illegal, harassing, hateful, harmful, defamatory, obscene, bullying, abusive, discriminatory, threatening to any person or group, sexually explicit, false, inaccurate, deceitful, or misleading.
            </p>
          </div>

           <div>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Contact Us</h2>
            <p>In order to resolve a complaint regarding the Site or to receive further information regarding use of the Site, please contact us at support@runads.com.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
