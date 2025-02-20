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
  }) as { data: WeNadsAvatar | undefined, isLoading: boolean, refetch: () => Promise<{ data: WeNadsAvatar | undefined }> };

  // Batch all component token template calls in one go
  const { data: componentTemplates } = useReadContracts({
    contracts: [
      avatar?.backgroundId,
      avatar?.headId,
      avatar?.eyesId,
      avatar?.mouthId,
      avatar?.accessoryId
    ].filter(Boolean).map(tokenId => ({
      address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
      abi: WeNadsComponentABI as Abi,
      functionName: 'getTokenTemplate',
      args: [tokenId],
    })),
    query: {
      enabled: !!avatar,
    }
  });

  // Batch all template info calls
  const { data: templateDetails } = useReadContracts({
    contracts: (componentTemplates?.map(result => 
      result.status === 'success' && result.result 
        ? {
            address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
            abi: WeNadsComponentABI as Abi,
            functionName: 'getTemplate',
            args: [result.result as bigint],
          }
        : undefined
    ).filter((contract): contract is NonNullable<typeof contract> => contract !== undefined)) || [],
    query: {
      enabled: !!componentTemplates?.length,
    }
  });

  // Batch all URI calls
  const { data: componentURIs } = useReadContracts({
    contracts: [
      avatar?.backgroundId,
      avatar?.headId,
      avatar?.eyesId,
      avatar?.mouthId,
      avatar?.accessoryId
    ].filter(Boolean).map(tokenId => ({
      address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
      abi: WeNadsComponentABI as Abi,
      functionName: 'uri',
      args: [tokenId],
    })),
    query: {
      enabled: !!avatar,
    }
  });

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

  // Organize component data
  const componentData = [
    { label: 'Background', tokenId: avatar?.backgroundId },
    { label: 'Hairstyle', tokenId: avatar?.headId },
    { label: 'Eyes', tokenId: avatar?.eyesId },
    { label: 'Mouth', tokenId: avatar?.mouthId },
    { label: 'Accessory', tokenId: avatar?.accessoryId }
  ].map((component, index) => ({
    ...component,
    uri: componentURIs?.[index]?.result as string | undefined,
    template: templateDetails?.[index]?.result as { name: string } | undefined
  }));

  // Get all templates of each type in one batch
  const { data: allTemplates } = useReadContracts({
    contracts: [0, 1, 2, 3, 4].map(type => ({
      address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
      abi: WeNadsComponentABI as Abi,
      functionName: 'getTemplatesOfType',
      args: [type],
    })),
  });

  // Get all owned tokens in one batch
  const { data: ownedTokens } = useReadContracts({
    contracts: allTemplates?.flatMap((result) => 
      result.status === 'success' 
        ? (result.result as bigint[]).map(templateId => ({
            address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
            abi: WeNadsComponentABI as Abi,
            functionName: 'getUserTemplateToken',
            args: [address, templateId] as [string, bigint],
          }))
        : []
    ) || [],
  });

  // Get URIs and template info for owned tokens in one batch
  const { data: ownedTokenData } = useReadContracts({
    contracts: ownedTokens?.flatMap(result => 
      result.status === 'success' && result.result 
        ? [
            {
              address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
              abi: WeNadsComponentABI as Abi,
              functionName: 'uri',
              args: [result.result as bigint],
            },
            {
              address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
              abi: WeNadsComponentABI as Abi,
              functionName: 'getTokenTemplate',
              args: [result.result as bigint],
            }
          ]
        : []
    ) || [],
  });

  // Get template details for owned tokens
  const { data: ownedTemplateDetails } = useReadContracts({
    contracts: (ownedTokenData?.filter((_, index) => index % 2 === 1)
      .map(result =>
        result.status === 'success' && result.result
          ? {
              address: CONTRACT_ADDRESSES.COMPONENT as `0x${string}`,
              abi: WeNadsComponentABI as Abi,
              functionName: 'getTemplate',
              args: [result.result as bigint],
            }
          : undefined
      )
      .filter((contract): contract is NonNullable<typeof contract> => contract !== undefined)) || [],
  });

  // Organize owned components data
  const ownedComponentsByType = ['Background', 'Hairstyle', 'Eyes', 'Mouth', 'Accessory'].reduce((acc, type) => {
    const typeIndex = ['Background', 'Hairstyle', 'Eyes', 'Mouth', 'Accessory'].indexOf(type);
    const templates = allTemplates?.[typeIndex]?.result as bigint[] | undefined;
    if (!templates) return acc;

    const startIndex = allTemplates?.slice(0, typeIndex).reduce((sum, result) => 
      sum + ((result.status === 'success' ? result.result as bigint[] : []).length), 0) || 0;

    const typeTokens = templates.map((_, i) => {
      const tokenResult = ownedTokens?.[startIndex + i];
      return tokenResult?.status === 'success' ? tokenResult.result as bigint : undefined;
    }).filter((token): token is bigint => token !== undefined);

    acc[type] = typeTokens.map(tokenId => {
      const dataIndex = Object.values(acc).flat().length * 2;
      const uri = ownedTokenData?.[dataIndex]?.result as string;
      const templateInfo = ownedTemplateDetails?.[Object.values(acc).flat().length]?.result as { name: string } | undefined;
      
      return {
        tokenId,
        uri,
        template: templateInfo,
      };
    });

    return acc;
  }, {} as Record<string, Array<{ tokenId: bigint, uri: string | undefined, template: { name: string } | undefined }>>);

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
        <div className="container max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
          <div className="text-2xl font-black text-purple-600">Loading...</div>
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
            <p className="text-gray-600">This address doesn&apos;t own a WeNads NFT</p>
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
                {componentData.map(({ label, uri, template }) => {
                  const imageUrl = getImageFromURI(uri);
                  
                  return (
                    <div key={label} className="flex flex-col items-center gap-2">
                      <div className="relative w-full aspect-square bg-white rounded-lg overflow-hidden border border-purple-200">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt={template?.name || label}
                            fill
                            className="object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-purple-800">{label}</div>
                        <div className="text-sm text-gray-600">{template?.name || 'Unknown'}</div>
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
              {Object.entries(ownedComponentsByType).map(([type, components]) => 
                components.map(({ tokenId, uri, template }) => {
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
                        {uri ? (
                          <>
                            <p className="text-sm text-purple-600 font-medium mb-1">
                              {template?.name || 'Unnamed'}
                            </p>
                            <p className="text-xs text-gray-600">
                              ID: {tokenId.toString()}
                              <br />
                              <span className={isEquipped ? "text-green-600 font-bold" : "text-purple-600"}>
                                {isEquipped ? '(Equipped)' : '(Not Equipped)'}
                              </span>
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-gray-600">Loading...</p>
                        )}
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