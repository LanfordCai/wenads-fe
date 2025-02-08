'use client';

import { Permanent_Marker } from 'next/font/google';
import { ConnectBtn } from './connectButton';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (!pathname) return false;
    
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    
    return false;
  };

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
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/builder" 
                className={`text-white font-medium px-4 py-2 rounded-lg transition-colors ${
                  isActive('/builder') 
                    ? 'bg-purple-700 shadow-inner' 
                    : 'hover:bg-purple-700/30'
                }`}
              >
                Builder
              </Link>
              <Link 
                href="/gallery" 
                className={`text-white font-medium px-4 py-2 rounded-lg transition-colors ${
                  isActive('/gallery') 
                    ? 'bg-purple-700 shadow-inner' 
                    : 'hover:bg-purple-700/30'
                }`}
              >
                Gallery
              </Link>
            </nav>
          </div>
          <ConnectBtn />
        </div>
      </div>
    </div>
  );
} 