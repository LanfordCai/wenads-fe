import { useState, useEffect, useRef } from 'react';
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
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const publicClient = usePublicClient();
  const cachedNFTs = useRef<CachedNFT[]>([]);
  const totalSupplyRef = useRef<number>(0);

  const loadImage = async (tokenId: bigint, nftIndex: number) => {
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
  };

  const loadBasicNFTs = async () => {
    if (!publicClient) return;

    try {
      const totalSupply = await publicClient.readContract({
        address: AVATAR_CONTRACT,
        abi: WeNadsAvatarABI,
        functionName: 'totalSupply',
      }) as bigint;

      const total = Number(totalSupply);
      totalSupplyRef.current = total;
      setTotalPages(Math.ceil(total / ITEMS_PER_PAGE));

      const indices = Array.from({ length: total }, (_, i) => i);
      
      // Fetch all token IDs concurrently
      const tokenIds = await Promise.all(
        indices.map(i => 
          publicClient.readContract({
            address: AVATAR_CONTRACT,
            abi: WeNadsAvatarABI,
            functionName: 'tokenByIndex',
            args: [BigInt(i)],
          }) as Promise<bigint>
        )
      );

      // Fetch all owners concurrently
      const owners = await Promise.all(
        tokenIds.map(tokenId =>
          publicClient.readContract({
            address: AVATAR_CONTRACT,
            abi: WeNadsAvatarABI,
            functionName: 'ownerOf',
            args: [tokenId],
          }) as Promise<string>
        )
      );

      cachedNFTs.current = tokenIds.map((tokenId, index) => ({
        id: tokenId.toString(),
        owner: owners[index],
      }));
    } catch (error) {
      console.error('Error fetching basic NFTs:', error);
    }
  };

  const loadPage = async (page: number) => {
    setIsLoading(true);

    try {
      // Load basic NFTs if not cached
      if (cachedNFTs.current.length === 0) {
        await loadBasicNFTs();
      }

      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalSupplyRef.current);
      
      const pageNFTs = cachedNFTs.current.slice(startIndex, endIndex).map(nft => ({
        ...nft,
        imageUrl: null,
        isImageLoading: true,
      }));

      setNfts(pageNFTs);
      setIsLoading(false);

      // Load images for the current page
      await Promise.all(
        pageNFTs.map((nft, index) => loadImage(BigInt(nft.id), index))
      );
    } catch (error) {
      console.error('Error loading page:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPage(currentPage);
  }, [publicClient, currentPage]);

  return { 
    nfts, 
    isLoading, 
    currentPage, 
    totalPages,
    setCurrentPage,
  };
} 
