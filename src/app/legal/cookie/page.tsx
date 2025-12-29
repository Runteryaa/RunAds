import Link from "next/link";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans">
      <div className="container mx-auto px-6 py-20 max-w-4xl">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 mb-8 inline-block">&larr; Back to Home</Link>
        <h1 className="text-4xl font-bold text-white mb-8">Cookie Policy</h1>
        <p className="mb-4 text-sm text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">1. What are cookies?</h2>
            <p>
              Cookies are simple text files that are stored on your computer or mobile device by a website's server. Each cookie is unique to your web browser. It will contain some anonymous information such as a unique identifier, the website's domain name, and some digits and numbers.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">2. How do we use cookies?</h2>
            <p>We use cookies for several purposes:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Strictly Necessary Cookies:</strong> These are essential to enable you to move around the website and use its features, such as accessing secure areas of the website. Without these cookies, services you have asked for cannot be provided.</li>
              <li><strong>Performance Cookies:</strong> These collect information about how visitors use a website, for instance which pages visitors go to most often, and if they get error messages from web pages. These cookies don't collect information that identifies a visitor.</li>
              <li><strong>Functionality Cookies:</strong> These allow the website to remember choices you make (such as your user name, language or the region you are in) and provide enhanced, more personal features.</li>
              <li><strong>Targeting/Advertising Cookies:</strong> These are used to deliver adverts more relevant to you and your interests. They are also used to limit the number of times you see an advertisement as well as help measure the effectiveness of the advertising campaign.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">3. How to manage cookies</h2>
            <p>
              If you want to restrict or block the cookies that are set by our website, you can do so through your browser setting. Alternatively, you can visit www.internetcookies.org, which contains comprehensive information on how to do this on a wide variety of browsers and devices.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-white mb-3">4. Contact Us</h2>
            <p>If you have any questions about our use of cookies or other technologies, please email us at support@runads.com.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
