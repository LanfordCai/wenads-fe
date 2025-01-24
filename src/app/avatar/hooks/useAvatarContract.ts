import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { AvatarState, WeNadsAvatar } from '../types';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

export const useAvatarContract = (selectedComponents: AvatarState) => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Check if user has a WeNads NFT
  const { data: balance = BigInt(0) } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'balanceOf',
    args: [address],
    query: {
      enabled: !!address,
    }
  }) as { data: bigint };

  const hasNFT = balance > BigInt(0);

  // Get user's WeNads if they have one
  const { data: tokenId } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
    query: {
      enabled: !!address && hasNFT,
    }
  });

  console.log("tokenId", tokenId, "address", address)

  // Get WeNads components
  const { data: avatar } = useReadContract({
    address: CONTRACT_ADDRESSES.AVATAR,
    abi: WeNadsAvatarABI,
    functionName: 'getAvatar',
    args: [tokenId],
    query: {
      enabled: !!tokenId,
    }
  }) as { data: WeNadsAvatar };

  // Get template IDs for each component if we have an avatar
  const { data: backgroundTemplate } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getTokenTemplate',
    args: [avatar?.backgroundId],
    query: {
      enabled: !!avatar?.backgroundId,
    }
  }) as { data: bigint };

  const { data: hairstyleTemplate } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getTokenTemplate',
    args: [avatar?.headId],
    query: {
      enabled: !!avatar?.headId,
    }
  }) as { data: bigint };

  const { data: eyesTemplate } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getTokenTemplate',
    args: [avatar?.eyesId],
    query: {
      enabled: !!avatar?.eyesId,
    }
  }) as { data: bigint };

  const { data: mouthTemplate } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getTokenTemplate',
    args: [avatar?.mouthId],
    query: {
      enabled: !!avatar?.mouthId,
    }
  }) as { data: bigint };

  const { data: flowerTemplate } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getTokenTemplate',
    args: [avatar?.accessoryId],
    query: {
      enabled: !!avatar?.accessoryId,
    }
  }) as { data: bigint };

  const templates = {
    background: backgroundTemplate,
    hairstyle: hairstyleTemplate,
    eyes: eyesTemplate,
    mouth: mouthTemplate,
    flower: flowerTemplate
  };

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

    return hash;
  };

  const changeComponent = async (category: string, templateId: string): Promise<`0x${string}`> => {
    if (!hasNFT || !tokenId) {
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

    const componentType = categoryToEnum[category];
    if (componentType === undefined) {
      throw new Error('Invalid component category');
    }

    // First mint the component to get a token ID
    const mintHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.COMPONENT,
      abi: WeNadsComponentABI,
      functionName: 'mintComponent',
      args: [
        BigInt(templateId),
        address
      ],
      value: BigInt(0) // TODO: Handle component price
    });

    if (!mintHash) {
      throw new Error('Failed to mint component');
    }

    // Wait for the mint transaction to complete
    const provider = window.ethereum;
    if (!provider) throw new Error('No provider available');

    let tokenIdFromMint: bigint | undefined;
    while (!tokenIdFromMint) {
      const receipt = await provider.request({
        method: 'eth_getTransactionReceipt',
        params: [mintHash],
      });

      if (receipt) {
        // Find the TokenMinted event in the logs
        const tokenMintedEvent = receipt.logs.find((log: any) => {
          // This is the event signature for TokenMinted(uint256,uint256,address)
          return log.topics[0] === '0x5f7666f57f33340a03e0b476a5e11b26744b98c42a4aa15da06bea896a2f06e4';
        });

        if (tokenMintedEvent) {
          // The token ID is the first indexed parameter
          tokenIdFromMint = BigInt(tokenMintedEvent.topics[1]);
          break;
        }
      }

      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    if (!tokenIdFromMint) {
      throw new Error('Failed to get minted token ID');
    }

    // Now we can change the component with the new token ID
    const changeHash = await writeContractAsync({
      address: CONTRACT_ADDRESSES.AVATAR,
      abi: WeNadsAvatarABI,
      functionName: 'changeComponent',
      args: [
        tokenId,
        tokenIdFromMint,
        componentType
      ]
    });

    return changeHash;
  };

  return { 
    mint,
    changeComponent,
    hasNFT,
    avatar,
    isLoading: !!address && (hasNFT && !avatar && !!tokenId),
    templates
  };
}; 