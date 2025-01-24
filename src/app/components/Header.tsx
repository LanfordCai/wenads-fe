import { Permanent_Marker } from 'next/font/google';
import { ConnectBtn } from './connectButton';

const permanentMarker = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export default function Header() {
  return (
    <div className="sticky top-0 z-50 bg-[#8B5CF6] border-b-4 border-[#7C3AED] shadow-[0px_4px_0px_0px_#5B21B6]">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <h1 className={`text-4xl text-white tracking-tight ${permanentMarker.className}`}>
            WeNads 
          </h1>
          <ConnectBtn />
        </div>
      </div>
    </div>
  );
} 