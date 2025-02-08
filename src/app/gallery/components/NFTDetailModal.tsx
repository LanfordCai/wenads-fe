import { FC, useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/contracts/config';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';
import { WeNadsAvatar } from '@/app/builder/types';

interface NFTDetailModalProps {
  nftId: string;
  imageUrl: string | null;
  onClose: () => void;
}

const NFTDetailModal: FC<NFTDetailModalProps> = ({ nftId, imageUrl, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const componentRowRef = useRef<HTMLDivElement>(null);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
    
    // Only allow pointer events on modal
    const modal = document.getElementById('nft-detail-modal');
    if (modal) {
      modal.style.pointerEvents = 'auto';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
    };
  }, []);

  // Get NFT components
  const { data: avatar } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'getAvatar',
    args: [BigInt(nftId)],
  }) as { data: WeNadsAvatar | undefined };

  console.log(avatar);

  // Get component URIs
  const { data: backgroundURI } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'uri',
    args: [avatar?.backgroundId],
    query: {
      enabled: !!avatar?.backgroundId,
    }
  }) as { data: string | undefined };

  console.log(backgroundURI);

  const { data: hairstyleURI } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'uri',
    args: [avatar?.headId],
    query: {
      enabled: !!avatar?.headId,
    }
  }) as { data: string | undefined };

  const { data: eyesURI } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'uri',
    args: [avatar?.eyesId],
    query: {
      enabled: !!avatar?.eyesId,
    }
  }) as { data: string | undefined };

  const { data: mouthURI } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'uri',
    args: [avatar?.mouthId],
    query: {
      enabled: !!avatar?.mouthId,
    }
  }) as { data: string | undefined };

  const { data: flowerURI } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'uri',
    args: [avatar?.accessoryId],
    query: {
      enabled: !!avatar?.accessoryId,
    }
  }) as { data: string | undefined };

  // Extract image URLs from base64 URIs
  const getImageFromURI = (uri: string | undefined) => {
    if (!uri) return null;
    try {
      // Handle data:application/json prefix
      const jsonStr = uri.startsWith('data:application/json,') 
        ? uri.slice('data:application/json,'.length)
        : uri.split(',')[1];
      const json = JSON.parse(jsonStr);
      return json.image;
    } catch {
      return null;
    }
  };

  // Get component metadata
  const componentURIs = [
    { uri: backgroundURI, label: 'Background' },
    { uri: hairstyleURI, label: 'Hairstyle' },
    { uri: eyesURI, label: 'Eyes' },
    { uri: mouthURI, label: 'Mouth' },
    { uri: flowerURI, label: 'Accessory' }
  ];

  // Get owner address
  const { data: owner } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'ownerOf',
    args: [BigInt(nftId)],
  }) as { data: string | undefined };

  const handleCopyAddress = async () => {
    if (owner) {
      await navigator.clipboard.writeText(owner);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!componentRowRef.current) return;
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollLeft(componentRowRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !componentRowRef.current) return;
    e.preventDefault();
    
    const dx = e.clientX - startX;
    componentRowRef.current.scrollLeft = scrollLeft - dx;
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        style={{ 
          pointerEvents: 'all',
          touchAction: 'none',
          userSelect: 'none',
        }} 
      />
      
      <div 
        id="nft-detail-modal"
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
        style={{ touchAction: 'none' }}
      >
        <div 
          className="w-screen max-w-[400px] bg-white rounded-xl p-6 relative border-4 border-[#8B5CF6] shadow-[8px_8px_0px_0px_#5B21B6]" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-purple-400 hover:text-purple-600 text-xl font-bold"
          >
            ×
          </button>
          
          <div className="flex flex-col h-full">
            <h2 className="text-2xl font-black text-purple-800 mb-4">WeNads #{nftId}</h2>
            
            <div className="flex flex-col gap-4">
              {/* Main NFT Image */}
              <div className="flex items-center justify-center">
                <div className="relative w-full max-w-[300px] aspect-square bg-purple-50 rounded-lg overflow-hidden border-2 border-purple-200">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={`WeNad #${nftId}`}
                      fill
                      className="object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-purple-600 font-bold">Failed to load image</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Component Images Row */}
              <div className="w-full max-w-[300px] mx-auto overflow-hidden">
                <div 
                  ref={componentRowRef}
                  className="flex flex-nowrap gap-4 overflow-x-auto pb-2 scrollbar-none cursor-grab active:cursor-grabbing"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{ 
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    MozUserSelect: 'none',
                    msUserSelect: 'none',
                    cursor: isDragging ? 'grabbing' : 'grab'
                  }}
                >
                  {componentURIs.map(({ uri, label }, index) => {
                    const imageUrl = getImageFromURI(uri);
                    
                    return (
                      <div 
                        key={index}
                        className="flex-shrink-0 flex flex-col items-center gap-1.5 pointer-events-none"
                      >
                        <div className="relative w-16 h-16 bg-white rounded-lg overflow-hidden border-2 border-purple-200">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={`${label} Component`}
                              fill
                              className="object-contain p-1"
                              draggable={false}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-xs text-purple-400 font-medium text-center px-1">No {label}</p>
                            </div>
                          )}
                        </div>
                        <p className="text-xs font-medium text-gray-600">{label}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Owner section - now shows even without owner data */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-sm py-1.5 text-gray-600 shrink-0">Owner:</span>
              <div className="flex-1 min-w-0">
                {owner ? (
                  <button
                    onClick={handleCopyAddress}
                    className="w-full px-3 py-1.5 text-sm bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <span className="truncate">{owner}</span>
                    {copied ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 shrink-0">
                        <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0118 9.375v9.375a3 3 0 003-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 00-.673-.05A3 3 0 0015 1.5h-1.5a3 3 0 00-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6zM13.5 3A1.5 1.5 0 0012 4.5h4.5A1.5 1.5 0 0015 3h-1.5z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V9.375zM6 12a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V12zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 15a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V15zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75zM6 18a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75H6.75a.75.75 0 01-.75-.75V18zm2.25 0a.75.75 0 01.75-.75h3.75a.75.75 0 010 1.5H9a.75.75 0 01-.75-.75z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ) : (
                  <div className="w-full px-3 py-1.5 text-sm bg-purple-50 text-purple-400 rounded-lg">
                    Loading owner...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NFTDetailModal; 
