'use client';

import React, { useState } from 'react';
import { useNFTs } from './hooks/useNFTs';
import Image from 'next/image';
import NFTDetailModal from './components/NFTDetailModal';

function PageNumbers({ currentPage, totalPages, setCurrentPage, isLoading }: {
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  isLoading: boolean;
}) {
  const pages: (number | string)[] = [];
  
  // Always show first page
  pages.push(1);
  
  // Calculate range around current page
  const start = Math.max(2, currentPage - 2);
  const end = Math.min(totalPages - 1, currentPage + 2);
  
  // Add ellipsis after first page if needed
  if (start > 2) {
    pages.push('...');
  }
  
  // Add pages around current page
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  
  // Add ellipsis before last page if needed
  if (end < totalPages - 1) {
    pages.push('...');
  }
  
  // Always show last page if more than one page
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center space-x-2">
      {pages.map((page, index) => (
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => setCurrentPage(page)}
            disabled={page === currentPage || isLoading}
            className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm
              ${page === currentPage
                ? 'bg-purple-600 text-white'
                : isLoading
                  ? 'text-purple-300 cursor-not-allowed'
                  : 'text-purple-600 hover:bg-purple-100'
              }`}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="text-purple-600">...</span>
        )
      ))}
    </div>
  );
}

export default function NFTsPage() {
  const { nfts, isLoading, currentPage, totalPages, setCurrentPage, totalSupply } = useNFTs();
  const [selectedNFT, setSelectedNFT] = useState<{ id: string; imageUrl: string | null } | null>(null);

  if (isLoading && currentPage === 1) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-black text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-block text-gray-700 px-2 pt-3 pb-1 mb-4 border-b-4 border-purple-400 mx-auto">
          <span className="text-2xl font-bold">✨ </span>
          <span className="text-xl font-bold">Already</span>
          <span className="text-3xl font-black text-purple-600 mx-2 tracking-wider">{totalSupply}</span>
          <span className="text-xl font-bold">WeNads in our collection! </span>
          <span className="text-2xl font-bold">🎨</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {nfts.map((nft) => (
          <div 
            key={nft.id}
            className="bg-white rounded-xl shadow-lg p-3 border-4 border-purple-400 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all"
            onClick={() => setSelectedNFT({ id: nft.id, imageUrl: nft.imageUrl })}
          >
            <div className="relative aspect-square mb-3">
              {nft.isImageLoading ? (
                <div className="w-full h-full flex items-center justify-center bg-purple-100 rounded-lg">
                  <p className="text-purple-600 font-bold">Loading image...</p>
                </div>
              ) : nft.imageUrl ? (
                <Image
                  src={nft.imageUrl}
                  alt={`WeNad #${nft.id}`}
                  fill
                  className="object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-100 rounded-lg">
                  <p className="text-purple-600 font-bold">Failed to load image</p>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="font-bold text-purple-900 text-sm">WeNads #{nft.id}</p>
              <p className="text-xs text-gray-500 flex">
                <span className="min-w-0 truncate">Owner: {nft.owner.slice(0, -10)}</span>
                <span>{nft.owner.slice(-10)}</span>
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center space-x-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1 || isLoading}
            className={`px-4 py-2 rounded-lg font-bold text-lg ${
              currentPage === 1 || isLoading
                ? 'text-purple-300 cursor-not-allowed'
                : 'text-purple-600 hover:text-purple-700'
            }`}
          >
            ≪
          </button>
          <PageNumbers 
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            isLoading={isLoading}
          />
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || isLoading}
            className={`px-4 py-2 rounded-lg font-bold text-lg ${
              currentPage === totalPages || isLoading
                ? 'text-purple-300 cursor-not-allowed'
                : 'text-purple-600 hover:text-purple-700'
            }`}
          >
            ≫
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