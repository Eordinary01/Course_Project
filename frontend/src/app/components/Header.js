'use client';

import Link from 'next/link';
import { useAuth } from '../auth/AuthContext';
import { useState, useEffect } from 'react';
import { FaHome, FaUserPlus, FaSignInAlt, FaSignOutAlt, FaPlus, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className={`fixed w-full transition-all duration-300 z-50 ${
      isScrolled 
        ? 'bg-white border-b border-gray-100 shadow-sm' 
        : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center group-hover:bg-yellow-500 transition-colors duration-300">
              <FaHome className="text-gray-900 text-lg" />
            </div>
            <span className="text-xl sm:text-2xl font-light text-gray-900 tracking-tight">
              Learn<span className="font-medium">Hub</span>
            </span>
          </Link>
          
          {/* Mobile menu button */}
          <button 
            onClick={toggleMobileMenu} 
            className="sm:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors duration-300"
          >
            {isMobileMenuOpen ? (
              <FaTimes className="h-6 w-6 text-gray-600" />
            ) : (
              <FaBars className="h-6 w-6 text-gray-600" />
            )}
          </button>

          {/* Desktop menu */}
          <div className="hidden sm:flex items-center space-x-3">
            {isAuthenticated && user ? (
              <>
                <span className="text-gray-600 font-light px-3">
                  Hello, <span className="font-medium text-gray-900">{user.username}</span>
                </span>
                {user.role === 'admin' && (
                  <Link 
                    href="/admin/add-courses" 
                    className="flex items-center bg-yellow-400 text-gray-900 px-5 py-2.5 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300 shadow-sm hover:shadow"
                  >
                    <FaPlus className="inline-block mr-2 text-sm" />
                    Add Course
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="flex items-center bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300"
                >
                  <FaSignOutAlt className="inline-block mr-2 text-sm" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="text-gray-600 hover:text-gray-900 px-4 py-2.5 font-medium transition-colors duration-300"
                >
                  <FaSignInAlt className="inline-block mr-2" />
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex items-center bg-yellow-400 text-gray-900 px-5 py-2.5 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300 shadow-sm hover:shadow"
                >
                  <FaUserPlus className="inline-block mr-2" />
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu */}
        <div className={`sm:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="py-6 space-y-3 border-t border-gray-100">
            {isAuthenticated && user ? (
              <>
                <div className="px-4 py-2 text-gray-600 font-light text-center">
                  Hello, <span className="font-medium text-gray-900">{user.username}</span>
                </div>
                {user.role === 'admin' && (
                  <Link 
                    href="/admin/add-courses" 
                    className="flex items-center justify-center bg-yellow-400 text-gray-900 px-5 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaPlus className="inline-block mr-2" />
                    Add Course
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center justify-center w-full bg-gray-100 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300"
                >
                  <FaSignOutAlt className="inline-block mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  href="/login" 
                  className="flex items-center justify-center text-gray-600 hover:text-gray-900 py-3 font-medium transition-colors duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaSignInAlt className="inline-block mr-2" />
                  Login
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center bg-yellow-400 text-gray-900 px-5 py-3 rounded-lg font-medium hover:bg-yellow-500 transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FaUserPlus className="inline-block mr-2" />
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}