'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/providers';

export default function Header() {
  const { session, loading, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
  };

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ToolUnity
            </div>
          </Link>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link href="/tools" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Browse Tools
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Pricing
            </Link>
            <Link href="/safety" className="text-gray-700 hover:text-blue-600 transition font-medium">
              Safety
            </Link>
            <Link href="/for-owners" className="text-gray-700 hover:text-blue-600 transition font-medium">
              For Owners
            </Link>

            {!loading && !session ? (
              <>
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Sign Up
                </Link>
              </>
            ) : !loading && session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  className="text-gray-700 hover:text-blue-600 transition font-medium"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-4 space-y-3">
            <Link href="/tools" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Browse Tools
            </Link>
            <Link href="/pricing" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Pricing
            </Link>
            <Link href="/safety" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              Safety
            </Link>
            <Link href="/for-owners" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
              For Owners
            </Link>
            
            <div className="border-t border-gray-200 pt-3 mt-3">
              {!loading && !session ? (
                <>
                  <Link href="/login" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
                    Sign In
                  </Link>
                  <Link href="/signup" onClick={closeMenu} className="block py-2 mt-2 text-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                    Sign Up
                  </Link>
                </>
              ) : !loading && session ? (
                <>
                  <Link href="/dashboard" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
                    Dashboard
                  </Link>
                  <Link href="/profile" onClick={closeMenu} className="block py-2 text-gray-700 hover:text-blue-600 font-medium">
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full mt-2 py-2 text-center bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
