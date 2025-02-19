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
  const isInitialLoad = useRef<boolean>(true);

  const loadImage = useCallback(async (tokenId: bigint, nftIndex: number) => {
    try {
      const uri = await publicClient?.readContract({
        address: AVATAR_CONTRACT,
        abi: WeNadsAvatarABI,
        functionName: 'tokenURI',
        args: [tokenId],
      }) as string;

      const response = await fetch(uri);
      const metadata = await response.json();
      
      setNfts(current => current.map((nft, index) => 
        index === nftIndex 
          ? { ...nft, imageUrl: metadata.image || null, isImageLoading: false }
          : nft
      ));
    } catch (error) {
      console.error('Error loading image:', error);
      setNfts(current => current.map((nft, index) => 
        index === nftIndex 
          ? { ...nft, isImageLoading: false }
          : nft
      ));
    }
  }, [publicClient]);

  const loadMoreNFTs = useCallback(async () => {
    if (!publicClient || isLoading) return;

    setIsLoading(true);

    try {
      // Get total supply on first load
      if (isInitialLoad.current) {
        const totalSupply = await publicClient.readContract({
          address: AVATAR_CONTRACT,
          abi: WeNadsAvatarABI,
          functionName: 'totalSupply',
        }) as bigint;
        totalSupplyRef.current = Number(totalSupply);
        isInitialLoad.current = false;
      }

      const endIndex = Math.min(currentIndexRef.current + ITEMS_PER_PAGE, totalSupplyRef.current);
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

      // Create new NFT objects
      tokenIds.forEach((tokenId, index) => {
        newNFTs.push({
          id: tokenId.toString(),
          owner: owners[index] as string,
          imageUrl: null,
          isImageLoading: true,
        });
      });

      setNfts(current => [...current, ...newNFTs]);
      currentIndexRef.current = endIndex;
      setHasMore(endIndex < totalSupplyRef.current);

      // Load images for new NFTs
      newNFTs.forEach((nft, index) => {
        const globalIndex = nfts.length + index;
        loadImage(BigInt(nft.id), globalIndex);
      });
    } catch (error) {
      console.error('Error loading NFTs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, isLoading, loadImage, nfts.length]);

  // Load initial NFTs
  useEffect(() => {
    if (isInitialLoad.current && publicClient) {
      loadMoreNFTs();
    }
  }, [publicClient, loadMoreNFTs]);

  return { 
    nfts, 
    isLoading,
    hasMore,
    loadMoreNFTs,
    totalSupply: totalSupplyRef.current,
  };
} 
