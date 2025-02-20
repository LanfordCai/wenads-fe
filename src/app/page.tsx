"use client";

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-86px)] flex flex-col bg-gradient-to-br from-purple-50 to-white">
      <div className="flex-1 container max-w-7xl mx-auto px-4 pt-24">
        <div className="flex flex-col md:flex-row">
          {/* Video Section */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-4">
            <div className="w-full max-w-[600px] relative rounded-2xl border-4 border-[#8B5CF6] shadow-[8px_8px_0px_0px_#5B21B6] bg-black overflow-hidden">
              <div className="pb-[100%]">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-contain"
                >
                  <source src="/home.webm" type="video/webm" />
                </video>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-4">
            <div className="max-w-lg w-full space-y-6">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-purple-800 leading-tight">
                  Create Your Unique
                  <span className="block text-[#8B5CF6] mt-2">SBT Avatar</span>
                </h1>
                
                <p className="text-lg text-gray-600">
                  Express yourself with customizable SBT avatars. Mix and match components to create a truly unique digital identity.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6">
                  <div className="bg-white/50 p-3 rounded-xl border-2 border-purple-200">
                    <div className="text-lg font-bold text-purple-800 mb-1">🎭 One Avatar, Endless Possibilities</div>
                    <p className="text-sm text-gray-600">Each wallet gets one unique Soulbound Token that you can customize anytime.</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-xl border-2 border-purple-200">
                    <div className="text-lg font-bold text-purple-800 mb-1">💎 Tradeable Components</div>
                    <p className="text-sm text-gray-600">All avatar components are tradeable NFTs you can collect and trade.</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-xl border-2 border-purple-200">
                    <div className="text-lg font-bold text-purple-800 mb-1">🎨 Create & Earn</div>
                    <p className="text-sm text-gray-600">Design and sell your own component templates in our community marketplace.</p>
                  </div>
                  <div className="bg-white/50 p-3 rounded-xl border-2 border-purple-200">
                    <div className="text-lg font-bold text-purple-800 mb-1">⛓️ 100% On-chain</div>
                    <p className="text-sm text-gray-600">All assets are stored permanently on the blockchain for true ownership.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link 
                  href="/gallery"
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center px-6 py-3 bg-[#8B5CF6] text-white text-lg font-bold rounded-xl border-4 border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6] transition-all"
                >
                  🎨 Explore Gallery
                </Link>
                <Link 
                  href="/builder"
                  className="flex-1 min-w-[200px] inline-flex items-center justify-center px-6 py-3 bg-white text-[#8B5CF6] text-lg font-bold rounded-xl border-4 border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6] transition-all"
                >
                  🚀 Start Building
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="w-full py-6 text-center text-gray-600 mt-auto">
        <Link href="https://x.com/33_labs" className="hover:underline">
          Created by @33_labs with 💜
        </Link>
      </footer>
    </div>
  );
}