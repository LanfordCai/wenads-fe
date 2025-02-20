'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useReadContract, useWriteContract, useReadContracts, usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/contracts/config';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';
import { WeNadsAvatar } from '@/app/builder/types';
import { useNotification } from '@/app/contexts/NotificationContext';
import { useAccount } from 'wagmi';
import { Abi } from 'viem';
import NameEditModal from './components/NameEditModal';

type ComponentType = 'background' | 'head' | 'eyes' | 'mouth' | 'accessory';

const COMPONENT_MAPPING: Record<string, ComponentType> = {
  'Background': 'background',
  'Hairstyle': 'head',
  'Eyes': 'eyes',
  'Mouth': 'mouth',
  'Accessory': 'accessory'
};

const AddressDetail: FC = () => {
  const params = useParams();
  const address = params.address as string;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const { showNotification } = useNotification();
  const { address: currentAddress } = useAccount();
  const isOwner = currentAddress?.toLowerCase() === address.toLowerCase();
  const publicClient = usePublicClient();

  // Get balance first
  const { data: balance, isLoading: isLoadingBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'balanceOf',
    args: [address],
  }) as { data: bigint | undefined, isLoading: boolean };

  console.log('Balance:', balance?.toString(), 'Loading:', isLoadingBalance);

  // Get NFT ID for address using tokenOfOwnerByIndex
  const { data: nftId, isLoading: isLoadingNftId } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, BigInt(0)],
    query: {
      enabled: !!balance && balance > BigInt(0),
    }
  }) as { data: bigint | undefined, isLoading: boolean };

  // Get NFT components if we have an ID
  const { data: avatar, isLoading: isLoadingAvatar, refetch: refetchAvatar } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'getAvatar',
    args: [nftId],
    query: {
      enabled: !!nftId,
    }
  }) as { data: WeNadsAvatar | undefined, isLoading: boolean, refetch: () => Promise<any> };

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

  // Construct avatar image URL
  useEffect(() => {
    if (!avatar || !publicClient || !nftId) return;

    // Get the tokenURI for the NFT
    const fetchTokenURI = async () => {
      try {
        const uri = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.AVATAR,
          abi: WeNadsAvatarABI,
          functionName: 'tokenURI',
          args: [nftId],
        }) as string;

        const response = await fetch(uri);
        const metadata = await response.json();
        setImageUrl(metadata.image || null);
      } catch (error) {
        console.error('Error loading avatar image:', error);
        setImageUrl(null);
      }
    };

    fetchTokenURI();
  }, [avatar, nftId, publicClient]);

  const getComponentId = (avatar: WeNadsAvatar | undefined, label: string) => {
    if (!avatar) return '';
    switch (label) {
      case 'Background':
        return avatar.backgroundId?.toString();
      case 'Hairstyle':
        return avatar.headId?.toString();
      case 'Eyes':
        return avatar.eyesId?.toString();
      case 'Mouth':
        return avatar.mouthId?.toString();
      case 'Accessory':
        return avatar.accessoryId?.toString();
      default:
        return '';
    }
  };

  // Get all templates of each type
  const { data: backgroundTemplates } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
    abi: WeNadsComponentABI as Abi,
    functionName: 'getTemplatesOfType',
    args: [0], // Background type
  }) as { data: bigint[] | undefined };

  const { data: hairstyleTemplates } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
    abi: WeNadsComponentABI as Abi,
    functionName: 'getTemplatesOfType',
    args: [1], // Hairstyle type
  }) as { data: bigint[] | undefined };

  const { data: eyesTemplates } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
    abi: WeNadsComponentABI as Abi,
    functionName: 'getTemplatesOfType',
    args: [2], // Eyes type
  }) as { data: bigint[] | undefined };

  const { data: mouthTemplates } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
    abi: WeNadsComponentABI as Abi,
    functionName: 'getTemplatesOfType',
    args: [3], // Mouth type
  }) as { data: bigint[] | undefined };

  const { data: accessoryTemplates } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
    abi: WeNadsComponentABI as Abi,
    functionName: 'getTemplatesOfType',
    args: [4], // Accessory type
  }) as { data: bigint[] | undefined };

  // Get all owned tokens for each template
  const templatesByType = {
    'Background': backgroundTemplates,
    'Hairstyle': hairstyleTemplates,
    'Eyes': eyesTemplates,
    'Mouth': mouthTemplates,
    'Accessory': accessoryTemplates,
  };

  // Get token IDs for all templates
  const { data: ownedTokens } = useReadContracts({
    contracts: Object.entries(templatesByType).flatMap(([type, templates]) => 
      (templates || []).map(templateId => ({
        address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
        abi: WeNadsComponentABI as Abi,
        functionName: 'getUserTemplateToken',
        args: [address, templateId] as [string, bigint],
      }))
    ),
  });

  // Get URIs for all owned tokens
  const { data: tokenURIs } = useReadContracts({
    contracts: ownedTokens?.flatMap(result => 
      result.status === 'success' && result.result ? [{
        address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
        abi: WeNadsComponentABI as Abi,
        functionName: 'uri',
        args: [result.result as bigint],
      }] : []
    ) || [],
  });

  // Organize owned components by type
  const ownedComponents = Object.entries(templatesByType).reduce((acc, [type, templates]) => {
    const startIndex = Object.entries(templatesByType)
      .slice(0, Object.keys(templatesByType).indexOf(type))
      .reduce((sum, [_, templates]) => sum + (templates?.length || 0), 0);
    
    const typeTokens = (templates || []).map((_, index) => {
      const result = ownedTokens?.[startIndex + index];
      return result?.status === 'success' ? result.result as bigint : undefined;
    }).filter((token): token is bigint => token !== undefined);

    acc[type] = typeTokens;
    return acc;
  }, {} as Record<string, bigint[]>);

  // Write contract for name update
  const { writeContractAsync: updateName } = useWriteContract();

  const handleUpdateName = async (newName: string) => {
    if (!nftId || !newName.trim()) return;

    try {
      showNotification('Updating avatar name...', 'info');
      await updateName({
        address: CONTRACT_ADDRESSES.AVATAR,
        abi: WeNadsAvatarABI,
        functionName: 'updateAvatarName',
        args: [nftId, newName.trim()],
      });
      
      // Wait for a short delay to allow the blockchain to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch the avatar data to get the updated name
      await refetchAvatar();
      
      showNotification('Avatar name updated successfully!', 'success');
      setIsEditingName(false);
    } catch (error) {
      showNotification(
        error instanceof Error ? error.message : 'Failed to update name',
        'error'
      );
    }
  };

  // Loading state
  if (isLoadingBalance || isLoadingNftId || (nftId && isLoadingAvatar)) {
    return (
      <div className="min-h-[calc(100vh-86px)] bg-gradient-to-br from-purple-50 to-white">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-black text-purple-800 mb-2">Address Details</h1>
            <p className="text-purple-600 font-bold">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // No NFT state
  if (!isLoadingBalance && (!balance || balance === BigInt(0))) {
    return (
      <div className="min-h-[calc(100vh-86px)] bg-gradient-to-br from-purple-50 to-white">
        <div className="container max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-black text-purple-800 mb-2">Address Details</h1>
            <p className="text-gray-600">This address doesn't own a WeNads NFT</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-86px)] bg-gradient-to-br from-purple-50 to-white">
      <div className="container max-w-7xl mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1fr] gap-8">
            {/* Left Column - Avatar Preview */}
            <div className="bg-white rounded-xl p-6 border-4 border-[#8B5CF6] shadow-[8px_8px_0px_0px_#5B21B6] flex flex-col">
              <div className="flex-1 flex flex-col">
                {/* NFT Preview */}
                <div className="flex items-center justify-center flex-1">
                  <div className="relative w-full max-w-[440px] mx-auto aspect-square bg-purple-50 rounded-lg overflow-hidden border-2 border-purple-200">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={`WeNad #${nftId?.toString() || ''}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <p className="text-purple-600 font-bold">Loading avatar...</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Avatar Info */}
                <div className="space-y-4 mt-6 max-w-[440px] mx-auto w-full">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-medium text-purple-600">WeNads #{nftId?.toString() || ''}</h2>
                    {isOwner && (
                      <button
                        onClick={() => setIsEditingName(true)}
                        className="text-sm font-bold text-purple-600 hover:text-purple-800"
                      >
                        ✏️ Edit Name
                      </button>
                    )}
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-2xl font-black text-purple-800 break-all">
                      {avatar?.name || 'Unnamed WeNad'}
                    </p>
                  </div>

                  {/* Additional Info */}
                  <div className="space-y-3">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-purple-600 font-bold mb-1">Owner</p>
                      <p className="text-gray-600 break-all">{address}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-purple-600 font-bold">Token ID</p>
                        <p className="text-gray-600">{nftId?.toString()}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-purple-600 font-bold">Contract</p>
                        <p className="text-gray-600 truncate">{CONTRACT_ADDRESSES.AVATAR}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Components */}
            <div className="bg-white rounded-xl p-6 border-4 border-[#8B5CF6] shadow-[8px_8px_0px_0px_#5B21B6] flex flex-col">
              <h2 className="text-xl font-bold text-purple-800 mb-6">Avatar Components</h2>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4 content-start">
                {componentURIs.map(({ uri, label }, index) => {
                  const imageUrl = getImageFromURI(uri);
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-purple-200">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`${label} Component`}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-xs text-purple-400 font-medium text-center px-1">No {label}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-purple-800 text-sm">{label}</p>
                        <p className="text-xs text-gray-600">
                          {uri ? `ID: ${getComponentId(avatar, label)}` : 'Not Set'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Owned Components Section */}
          <div className="bg-white rounded-xl p-6 border-4 border-[#8B5CF6] shadow-[8px_8px_0px_0px_#5B21B6]">
            <h2 className="text-xl font-bold text-purple-800 mb-6">All Owned Components</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {Object.entries(ownedComponents).map(([type, tokens]) => 
                tokens.map((tokenId, tokenIndex) => {
                  const uriIndex = Object.entries(ownedComponents)
                    .slice(0, Object.keys(ownedComponents).indexOf(type))
                    .reduce((sum, [_, tokens]) => sum + tokens.length, 0) + tokenIndex;
                  
                  const uri = tokenURIs?.[uriIndex]?.result as string | undefined;
                  const imageUrl = getImageFromURI(uri);
                  const isEquipped = avatar?.[`${COMPONENT_MAPPING[type]}Id`]?.toString() === tokenId.toString();
                  
                  return (
                    <div key={`${type}-${tokenId}`} className="flex flex-col items-center gap-2">
                      <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-purple-200">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={`${type} Component`}
                            fill
                            className="object-contain p-1"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <p className="text-xs text-purple-400 font-medium text-center px-1">Loading...</p>
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-purple-800 text-sm">{type}</p>
                        <p className="text-xs text-gray-600">
                          ID: {tokenId.toString()}
                          <br />
                          <span className={isEquipped ? "text-green-600 font-bold" : "text-purple-600"}>
                            {isEquipped ? '(Equipped)' : '(Not Equipped)'}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Name Edit Modal */}
      {isEditingName && isOwner && (
        <NameEditModal
          onClose={() => setIsEditingName(false)}
          onSave={handleUpdateName}
          currentName={avatar?.name || ''}
        />
      )}
    </div>
  );
};

export default AddressDetail; 