import { useWriteContract, useReadContract, useAccount, usePublicClient } from 'wagmi';
import { AvatarState, WeNadsAvatar } from '../types';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';
import { CONTRACT_ADDRESSES } from '@/contracts/config';
import { useState, useEffect } from 'react';

export type NFTStatus = 'loading' | 'no_nft' | 'has_nft';

export const useAvatarContract = (selectedComponents: AvatarState) => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [currentTemplates, setCurrentTemplates] = useState<Record<string, bigint | undefined>>({});
  const [nftStatus, setNftStatus] = useState<NFTStatus>('loading');

  // Check if user has a WeNads NFT
  const { data: balance = BigInt(0), isLoading: isBalanceLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    }
  }) as { data: bigint; isLoading: boolean };

  // Update NFT status based on balance
  useEffect(() => {
    if (!address) {
      setNftStatus('no_nft');
    } else if (isBalanceLoading) {
      setNftStatus('loading');
    } else {
      setNftStatus(balance > BigInt(0) ? 'has_nft' : 'no_nft');
    }
  }, [address, balance, isBalanceLoading]);

  const hasNFT = nftStatus === 'has_nft';

  // Get user's WeNads if they have one
  const { data: tokenId, isLoading: isTokenIdLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
    query: {
      enabled: !!address && hasNFT,
    }
  }) as { data: bigint | undefined; isLoading: boolean };

  // Get WeNads components
  const { data: avatar, isLoading: isAvatarLoading } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'getAvatar',
    args: [tokenId],
    query: {
      enabled: !!tokenId,
    }
  }) as { data: WeNadsAvatar | undefined; isLoading: boolean };

  const fetchTemplates = async () => {
    if (!avatar || !publicClient) return;

    const [background, hairstyle, eyes, mouth, flower] = await Promise.all([
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.COMPONENT,
        abi: WeNadsComponentABI,
        functionName: 'getTokenTemplate',
        args: [avatar.backgroundId]
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.COMPONENT,
        abi: WeNadsComponentABI,
        functionName: 'getTokenTemplate',
        args: [avatar.headId]
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.COMPONENT,
        abi: WeNadsComponentABI,
        functionName: 'getTokenTemplate',
        args: [avatar.eyesId]
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.COMPONENT,
        abi: WeNadsComponentABI,
        functionName: 'getTokenTemplate',
        args: [avatar.mouthId]
      }),
      publicClient.readContract({
        address: CONTRACT_ADDRESSES.COMPONENT,
        abi: WeNadsComponentABI,
        functionName: 'getTokenTemplate',
        args: [avatar.accessoryId]
      })
    ]) as [bigint, bigint, bigint, bigint, bigint];

    setCurrentTemplates({
      background,
      hairstyle,
      eyes,
      mouth,
      flower
    });
  };

  const fetchAvatar = async () => {
    if (!tokenId || !publicClient) return;

    const newAvatar = await publicClient.readContract({
      address: CONTRACT_ADDRESSES.AVATAR,
      abi: WeNadsAvatarABI,
      functionName: 'getAvatar',
      args: [tokenId]
    }) as WeNadsAvatar;

    // After getting new avatar data, fetch its templates
    if (newAvatar) {
      const [background, hairstyle, eyes, mouth, flower] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.COMPONENT,
          abi: WeNadsComponentABI,
          functionName: 'getTokenTemplate',
          args: [newAvatar.backgroundId]
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.COMPONENT,
          abi: WeNadsComponentABI,
          functionName: 'getTokenTemplate',
          args: [newAvatar.headId]
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.COMPONENT,
          abi: WeNadsComponentABI,
          functionName: 'getTokenTemplate',
          args: [newAvatar.eyesId]
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.COMPONENT,
          abi: WeNadsComponentABI,
          functionName: 'getTokenTemplate',
          args: [newAvatar.mouthId]
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESSES.COMPONENT,
          abi: WeNadsComponentABI,
          functionName: 'getTokenTemplate',
          args: [newAvatar.accessoryId]
        })
      ]) as [bigint, bigint, bigint, bigint, bigint];

      setCurrentTemplates({
        background,
        hairstyle,
        eyes,
        mouth,
        flower
      });
    }
  };

  // Initial fetch of templates
  useEffect(() => {
    if (avatar) {
      fetchTemplates();
    }
  }, [avatar]);

  const mint = async (): Promise<`0x${string}`> => {
    if (hasNFT) {
      throw new Error('You already own a WeNads NFT');
    }

    const {
      background,
      hairstyle,
      eyes,
      mouth,
      flower
    } = selectedComponents;

    if (!background || !hairstyle || !eyes || !mouth || !flower) {
      throw new Error('Please select all components before minting');
    }

    const totalPrice = Object.values(selectedComponents).reduce(
      (sum, component) => sum + (component?.price || BigInt(0)),
      BigInt(0)
    );

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.AVATAR,
      abi: WeNadsAvatarABI,
      functionName: 'createAvatar',
      args: [
        BigInt(background.id),
        BigInt(hairstyle.id),
        BigInt(eyes.id),
        BigInt(mouth.id),
        BigInt(flower.id),
        'WeNads Avatar' // Default name
      ],
      value: totalPrice
    });

    if (!hash) {
      throw new Error('Failed to mint NFT');
    }

    // Wait for transaction confirmation
    await publicClient?.waitForTransactionReceipt({ 
      hash: hash
    });

    // Update NFT status
    setNftStatus('has_nft');

    return hash;
  };

  const changeComponents = async (selectedComponentsToChange: Record<string, { id: string }>, originalComponents: AvatarState): Promise<`0x${string}`[]> => {
    if (!hasNFT || !tokenId || !address || !publicClient) {
      throw new Error('You must own a WeNads NFT to change components');
    }

    // Map category to enum value
    const categoryToEnum: Record<string, number> = {
      background: 0,
      hairstyle: 1,
      eyes: 2,
      mouth: 3,
      flower: 4
    };

    // First check which templates we need to mint
    const templateChecks = await Promise.all(
      Object.entries(selectedComponentsToChange)
        .filter(([category]) => category !== 'body')
        .map(async ([category, component]) => {
          let existingTokenId: bigint | null = null;
          try {
            const result = await publicClient.readContract({
              address: CONTRACT_ADDRESSES.COMPONENT,
              abi: WeNadsComponentABI,
              functionName: 'getUserTemplateToken',
              args: [address, BigInt(component.id)]
            }) as bigint;
            existingTokenId = result && result !== BigInt(0) ? result : null;
          } catch (error) {
            // If the call reverts, it means the user doesn't own this template
            existingTokenId = null;
          }

          return {
            category,
            templateId: component.id,
            existingTokenId
          };
        })
    );

    // Collect templates that need minting
    const templatesNeedingMint = templateChecks
      .filter(check => !check.existingTokenId)
      .map(check => BigInt(check.templateId));

    let mintedTokenIds: Record<string, bigint> = {};

    // Mint missing templates if any
    if (templatesNeedingMint.length > 0) {
      // Calculate total price for components to mint
      const totalPrice = templateChecks
        .filter(check => !check.existingTokenId)
        .reduce((sum, check) => {
          const component = originalComponents[check.category as keyof AvatarState];
          return sum + (component?.price || BigInt(0));
        }, BigInt(0));

      const mintHash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.COMPONENT,
        abi: WeNadsComponentABI,
        functionName: 'mintComponents',
        args: [templatesNeedingMint, address],
        value: totalPrice
      });

      if (!mintHash) {
        throw new Error('Failed to mint components');
      }

      // Wait for the mint transaction to complete
      await publicClient.waitForTransactionReceipt({ 
        hash: mintHash
      });

      // After successful mint, get the token IDs for each template
      await Promise.all(templatesNeedingMint.map(async (templateId, index) => {
        const tokenId = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.COMPONENT,
          abi: WeNadsComponentABI,
          functionName: 'getUserTemplateToken',
          args: [address, templateId]
        }) as bigint;
        mintedTokenIds[templateId.toString()] = tokenId;
      }));
    }

    // Now change all components in one transaction
    const currentComponents = {
      backgroundId: avatar?.backgroundId || BigInt(0),
      headId: avatar?.headId || BigInt(0),
      eyesId: avatar?.eyesId || BigInt(0),
      mouthId: avatar?.mouthId || BigInt(0),
      accessoryId: avatar?.accessoryId || BigInt(0)
    };

    // Map categories to their respective IDs, using either new token IDs or current ones
    const backgroundId = templateChecks.find(c => c.category === 'background')
      ? (mintedTokenIds[templateChecks.find(c => c.category === 'background')!.templateId] || templateChecks.find(c => c.category === 'background')!.existingTokenId!)
      : currentComponents.backgroundId;

    const headId = templateChecks.find(c => c.category === 'hairstyle')
      ? (mintedTokenIds[templateChecks.find(c => c.category === 'hairstyle')!.templateId] || templateChecks.find(c => c.category === 'hairstyle')!.existingTokenId!)
      : currentComponents.headId;

    const eyesId = templateChecks.find(c => c.category === 'eyes')
      ? (mintedTokenIds[templateChecks.find(c => c.category === 'eyes')!.templateId] || templateChecks.find(c => c.category === 'eyes')!.existingTokenId!)
      : currentComponents.eyesId;

    const mouthId = templateChecks.find(c => c.category === 'mouth')
      ? (mintedTokenIds[templateChecks.find(c => c.category === 'mouth')!.templateId] || templateChecks.find(c => c.category === 'mouth')!.existingTokenId!)
      : currentComponents.mouthId;

    const accessoryId = templateChecks.find(c => c.category === 'flower')
      ? (mintedTokenIds[templateChecks.find(c => c.category === 'flower')!.templateId] || templateChecks.find(c => c.category === 'flower')!.existingTokenId!)
      : currentComponents.accessoryId;

    const changeHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.AVATAR,
      abi: WeNadsAvatarABI,
      functionName: 'changeComponents',
      args: [
        tokenId,
        backgroundId,
        headId,
        eyesId,
        mouthId,
        accessoryId
      ]
    });

    if (!changeHash) {
      throw new Error('Failed to change components');
    }

    // Wait for transaction confirmation
    await publicClient?.waitForTransactionReceipt({ 
      hash: changeHash
    });

    // Fetch updated avatar and templates
    await fetchAvatar();

    return [changeHash as `0x${string}`];
  };

  const burn = async (): Promise<`0x${string}`> => {
    if (!hasNFT || !tokenId) {
      throw new Error('You must own a WeNads NFT to burn it');
    }

    const hash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.AVATAR,
      abi: WeNadsAvatarABI,
      functionName: 'burn',
      args: [tokenId]
    });

    if (!hash) {
      throw new Error('Failed to burn NFT');
    }

    // Wait for transaction confirmation
    await publicClient?.waitForTransactionReceipt({ 
      hash: hash
    });

    // Reset NFT status
    setNftStatus('no_nft');

    return hash;
  };

  return { 
    mint,
    changeComponents,
    burn,
    hasNFT,
    avatar,
    nftStatus,
    isLoading: nftStatus === 'loading' || (hasNFT && (isTokenIdLoading || isAvatarLoading)),
    templates: currentTemplates
  };
}; 