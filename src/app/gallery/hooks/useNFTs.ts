import { useState, useEffect, useRef, useCallback } from 'react';
import { usePublicClient } from 'wagmi';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';

const AVATAR_CONTRACT = process.env.NEXT_PUBLIC_AVATAR_CONTRACT as `0x${string}`;
const ITEMS_PER_PAGE = 18;

export interface NFTMetadata {
  id: string;
  owner: string;
  imageUrl: string | null;
  isImageLoading: boolean;
}

interface CachedNFT {
  id: string;
  owner: string;
}

export function useNFTs() {
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const publicClient = usePublicClient();
  const currentIndexRef = useRef<number>(0);
  const totalSupplyRef = useRef<number>(0);
  const mountedRef = useRef<boolean>(false);
  const initialLoadStartedRef = useRef<boolean>(false);

  const loadImage = useCallback(async (tokenId: bigint, nftIndex: number) => {
    if (!mountedRef.current) return;
    
    try {
      const uri = await publicClient?.readContract({
        address: AVATAR_CONTRACT,
        abi: WeNadsAvatarABI,
        functionName: 'tokenURI',
        args: [tokenId],
      }) as string;

      const response = await fetch(uri);
      const metadata = await response.json();
      
      if (!mountedRef.current) return;

      setNfts(current => current.map((nft, index) => 
        index === nftIndex 
          ? { ...nft, imageUrl: metadata.image || null, isImageLoading: false }
          : nft
      ));
    } catch (error) {
      console.error('Error loading image:', error);
      if (!mountedRef.current) return;
      
      setNfts(current => current.map((nft, index) => 
        index === nftIndex 
          ? { ...nft, isImageLoading: false }
          : nft
      ));
    }
  }, [publicClient]);

  const loadMoreNFTs = useCallback(async () => {
    if (!publicClient || isLoading || !mountedRef.current) return;

    setIsLoading(true);

    try {
      // Get total supply if not already loaded
      if (totalSupplyRef.current === 0) {
        const totalSupply = await publicClient.readContract({
          address: AVATAR_CONTRACT,
          abi: WeNadsAvatarABI,
          functionName: 'totalSupply',
        }) as bigint;
        totalSupplyRef.current = Number(totalSupply);
      }

      const endIndex = Math.min(currentIndexRef.current + ITEMS_PER_PAGE, totalSupplyRef.current);
      
      // Don't proceed if we're at the end
      if (currentIndexRef.current >= endIndex) {
        setHasMore(false);
        return;
      }

      const newNFTs: NFTMetadata[] = [];

      // Fetch token IDs and owners in batches
      const tokenPromises: Promise<bigint>[] = [];
      const ownerPromises = [];

      for (let i = currentIndexRef.current; i < endIndex; i++) {
        tokenPromises.push(
          publicClient.readContract({
            address: AVATAR_CONTRACT,
            abi: WeNadsAvatarABI,
            functionName: 'tokenByIndex',
            args: [BigInt(i)],
          }) as Promise<bigint>
        );
      }

      const tokenIds = await Promise.all(tokenPromises);

      for (const tokenId of tokenIds) {
        ownerPromises.push(
          publicClient.readContract({
            address: AVATAR_CONTRACT,
            abi: WeNadsAvatarABI,
            functionName: 'ownerOf',
            args: [tokenId as bigint],
          })
        );
      }

      const owners = await Promise.all(ownerPromises);

      if (!mountedRef.current) return;

      // Create new NFT objects
      tokenIds.forEach((tokenId, index) => {
        newNFTs.push({
          id: tokenId.toString(),
          owner: owners[index] as string,
          imageUrl: null,
          isImageLoading: true,
        });
      });

      setNfts(current => {
        const updatedNFTs = [...current, ...newNFTs];
        // Load images for new NFTs
        newNFTs.forEach((nft, index) => {
          const globalIndex = current.length + index;
          loadImage(BigInt(nft.id), globalIndex);
        });
        return updatedNFTs;
      });
      
      currentIndexRef.current = endIndex;
      setHasMore(endIndex < totalSupplyRef.current);
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [publicClient, isLoading, loadImage]);

  // Handle initialization and cleanup
  useEffect(() => {
    mountedRef.current = true;

    if (publicClient && !initialLoadStartedRef.current) {
      initialLoadStartedRef.current = true;
      loadMoreNFTs();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [publicClient, loadMoreNFTs]);

  return { 
    nfts, 
    isLoading,
    hasMore,
    loadMoreNFTs,
    totalSupply: totalSupplyRef.current,
  };
} 
