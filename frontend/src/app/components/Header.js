'use client';

import Link from 'next/link';
import { useAuth } from '../auth/AuthContext';
import { useState, useEffect } from 'react';
import { FaHome, FaUserPlus, FaSignInAlt, FaSignOutAlt, FaPlus, FaBars } from 'react-icons/fa';

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
    <header className={`fixed w-full transition-all duration-300 z-50 ${isScrolled ? 'bg-blue-600 shadow-lg' : 'bg-transparent'}`}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-yellow-300 hover:text-yellow-600 transition-colors duration-300">
            <FaHome className="inline-block mr-2" />
            LearnHub
          </Link>
          
          {/* Mobile menu button */}
          <button onClick={toggleMobileMenu} className="sm:hidden text-yellow-300 hover:text-yellow-600">
            <FaBars className="h-6 w-6" />
          </button>

          {/* Desktop menu */}
          <div className="hidden sm:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <span className="text-gray-900 font-medium">Welcome, {user.username}</span>
                {user.role === 'admin' && (
                  <Link href="/admin/add-courses" className="bg-yellow-400 text-blue-800 px-4 py-2 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300">
                    <FaPlus className="inline-block mr-2" />
                    Add Course
                  </Link>
                )}
                <button
                  onClick={logout}
                  className="bg-blue-700 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-800 transition-colors duration-300"
                >
                  <FaSignOutAlt className="inline-block mr-2" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-900 hover:text-yellow-300 transition-colors duration-300">
                  <FaSignInAlt className="inline-block mr-2" />
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-yellow-400 text-blue-800 px-4 py-2 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300"
                >
                  <FaUserPlus className="inline-block mr-2" />
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-blue-600 py-4 transition-all duration-300">
            <div className="container mx-auto px-4">
              {isAuthenticated && user ? (
                <div className="flex flex-col items-center space-y-4">
                  <span className="text-gray-900 font-medium">Welcome, {user.username}</span>
                  {user.role === 'admin' && (
                    <Link href="/admin/add-courses" className="bg-yellow-400 text-blue-800 px-4 py-2 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300 w-full text-center">
                      <FaPlus className="inline-block mr-2" />
                      Add Course
                    </Link>
                  )}
                  <button
                    onClick={logout}
                    className="bg-blue-700 text-white px-4 py-2 rounded-full font-medium hover:bg-blue-800 transition-colors duration-300 w-full"
                  >
                    <FaSignOutAlt className="inline-block mr-2" />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-4">
                  <Link href="/login" className="text-gray-200 hover:text-yellow-300 transition-colors duration-300 w-full text-center">
                    <FaSignInAlt className="inline-block mr-2" />
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-yellow-400 text-blue-800 px-4 py-2 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300 w-full text-center"
                  >
                    <FaUserPlus className="inline-block mr-2" />
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
