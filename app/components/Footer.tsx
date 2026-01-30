'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ToolUnity
            </Link>
            <p className="mt-4 text-gray-400 max-w-md">
              Borrow tools from your neighbours. Save money, reduce waste, and build community connections.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/tools" className="hover:text-white transition">
                  Browse Tools
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/for-owners" className="hover:text-white transition">
                  For Tool Owners
                </Link>
              </li>
              <li>
                <Link href="/safety" className="hover:text-white transition">
                  Safety & Trust
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/safety" className="hover:text-white transition">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link href="/pricing#faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-6 text-sm">
              <a href="mailto:support@toolunity.co.uk" className="text-gray-400 hover:text-gray-200 transition">
                support@toolunity.co.uk
              </a>
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="text-gray-500 hover:text-gray-300 transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-gray-300 transition">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-500 hover:text-gray-300 transition">
                Cookie Policy
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm border-t border-gray-800 pt-6">
            © {currentYear} ToolUnity. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
