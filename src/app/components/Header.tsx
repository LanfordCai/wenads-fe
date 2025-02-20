'use client';

import { Permanent_Marker } from 'next/font/google';
import { ConnectBtn } from './connectButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (!pathname) return false;
    
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    
    return false;
  };

  const NavLinks = () => (
    <>
      <Link 
        href="/builder" 
        className={`text-white font-bold px-4 py-2 rounded-lg transition-colors ${
          isActive('/builder') 
            ? 'bg-[#7C3AED] shadow-inner' 
            : 'hover:bg-[#7C3AED]/30'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        Builder
      </Link>
      <Link 
        href="/gallery" 
        className={`text-white font-bold px-4 py-2 rounded-lg transition-colors ${
          isActive('/gallery') 
            ? 'bg-[#7C3AED] shadow-inner' 
            : 'hover:bg-[#7C3AED]/30'
        }`}
        onClick={() => setIsMenuOpen(false)}
      >
        Gallery
      </Link>
    </>
  );

  return (
    <div className="sticky top-0 z-50 bg-[#8B5CF6] border-b-4 border-[#7C3AED] shadow-[0px_4px_0px_0px_#5B21B6]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <Link href="/">
              <h1 className={`text-4xl text-white tracking-tight ${permanentMarker.className}`}>
                WeNads
              </h1>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6">
              <NavLinks />
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <ConnectBtn />
            {/* Mobile Menu Button */}
            <button
              className="md:hidden text-white p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 flex flex-col space-y-2">
            <NavLinks />
          </nav>
        )}
      </div>
    </div>
  );
} 