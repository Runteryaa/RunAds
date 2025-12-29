import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <p className="mb-4 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>
              Welcome to RunAds ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. 
              If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information, 
              please contact us.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect personal information that you voluntarily provide to us when you register on the website, express an interest in obtaining information about us or our products and services, when you participate in activities on the website, or otherwise when you contact us.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Personal Information Provided by You:</strong> We collect names; email addresses; passwords; and other similar information.</li>
              <li><strong>Website Data:</strong> When you register a website, we collect its domain name, category, and public metadata.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">3. Automatically Collected Information</h2>
            <p>
              We automatically collect certain information when you visit, use, or navigate the Website. This information does not reveal your specific identity (like your name or contact information) but may include device and usage information, such as your IP address, browser and device characteristics, operating system, language preferences, referring URLs, device name, country, location, information about how and when you use our Website, and other technical information.
            </p>
            <p className="mt-2">
              This information is primarily needed to maintain the security and operation of our Website, and for our internal analytics and reporting purposes (e.g., tracking ad views and clicks).
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">4. How We Use Your Information</h2>
            <p>We use personal information collected via our Website for a variety of business purposes described below:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>To facilitate account creation and logon process.</li>
              <li>To send you administrative information.</li>
              <li>To fulfill and manage your orders/credits.</li>
              <li>To protect our Services (e.g., fraud monitoring and prevention).</li>
              <li>To deliver targeted advertising (displaying your website to others).</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">5. Sharing Your Information</h2>
            <p>We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">6. Cookies and Tracking Technologies</h2>
            <p>
              We may use cookies and similar tracking technologies (like web beacons and pixels) to access or store information. Specific information about how we use such technologies and how you can refuse certain cookies is set out in our Cookie Notice.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">7. Third-Party Advertisers</h2>
            <p>
              We may use third-party advertising companies (such as Google AdSense) to serve ads when you visit the Website. These companies may use information about your visits to our Website and other websites that are contained in web cookies and other tracking technologies in order to provide advertisements about goods and services of interest to you.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">8. Contact Us</h2>
            <p>If you have questions or comments about this policy, you may email us at support@runads.com.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
