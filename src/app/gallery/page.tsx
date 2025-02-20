'use client';

import React, { useState } from 'react';
import { useNFTs } from './hooks/useNFTs';
import Image from 'next/image';
import Link from 'next/link';
import NFTDetailModal from './components/NFTDetailModal';

export default function NFTsPage() {
  const { nfts, isLoading, hasMore, loadMoreNFTs, totalSupply } = useNFTs();
  const [selectedNFT, setSelectedNFT] = useState<{ id: string; imageUrl: string | null } | null>(null);

  if (isLoading && nfts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-black text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pb-16">
      <div className="text-center mb-8">
        <div className="inline-block text-gray-700 px-2 pt-3 pb-1 mb-4 border-b-4 border-purple-400 mx-auto">
          <span className="text-2xl font-bold">✨ </span>
          <span className="text-xl font-bold">Already</span>
          <span className="text-3xl font-black text-purple-600 mx-2 tracking-wider">{totalSupply}</span>
          <span className="text-xl font-bold">WeNads in our collection! </span>
          <span className="text-2xl font-bold">🎨</span>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {nfts.map((nft) => (
          <div 
            key={nft.id}
            className="bg-white rounded-xl shadow-lg p-3 border-4 border-[#8B5CF6] cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all"
            onClick={() => setSelectedNFT({ id: nft.id, imageUrl: nft.imageUrl })}
          >
            <div className="relative aspect-square mb-3">
              {nft.isImageLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-purple-50 rounded-lg">
                  <p className="text-[#8B5CF6] font-bold">Loading image...</p>
                </div>
              ) : nft.imageUrl ? (
                <Image
                  src={nft.imageUrl}
                  alt={`WeNad #${nft.id}`}
                  fill
                  className="object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-50 rounded-lg">
                  <p className="text-[#8B5CF6] font-bold">Failed to load image</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-purple-600">WeNads #{nft.id}</p>
              </div>
              <div className="bg-purple-50 py-2 px-3 rounded-lg text-center">
                <p className="font-bold text-purple-800 text-sm break-all">
                  {nft.name || 'Unnamed WeNad'}
                </p>
              </div>
              <div className="text-xs text-gray-500 flex">
                <span className="min-w-0 truncate">Owner: {nft.owner.slice(0, -10)}</span>
                <span>{nft.owner.slice(-10)}</span>
              </div>
              <Link 
                href={`/address/${nft.owner}`}
                className="mt-2 w-full inline-flex items-center justify-center px-3 py-1.5 bg-white text-[#8B5CF6] text-sm font-bold rounded-lg border-2 border-[#7C3AED] hover:bg-purple-50 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMoreNFTs}
            disabled={isLoading}
            className={`px-6 py-2 bg-[#8B5CF6] text-white text-lg font-bold rounded-xl border-4 border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6] transition-all
              ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? '🎨 Loading...' : '🎨 Load More'}
          </button>
        </div>
      )}

      {/* NFT Detail Modal */}
      {selectedNFT && (
        <NFTDetailModal
          nftId={selectedNFT.id}
          imageUrl={selectedNFT.imageUrl}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </div>
  );
} 