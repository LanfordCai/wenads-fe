import { useWriteContract, useReadContract, useAccount } from 'wagmi';
import { AvatarState, WeNadsAvatar } from '../types';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';
import { monadDevnet } from '@/lib/config';

// TODO: Replace with actual contract address
const CONTRACT_ADDRESS = '0xE387B6860067D97107122D2Dc90e546529484b27';
const COMPONENT_CONTRACT = '0xE3086f80e93E2e602Cb7Ab092eF1599F82c56FBB';

export const useAvatarContract = (selectedComponents: AvatarState) => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Check if user has a WeNads NFT
  const { data: balance = BigInt(0) } = useReadContract({
    address: CONTRACT_ADDRESS,
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
    address: CONTRACT_ADDRESS,
    abi: WeNadsAvatarABI,
    functionName: 'tokenOfOwnerByIndex',
    args: [address, 0],
    chainId: monadDevnet.id,
    query: {
      enabled: !!address && hasNFT,
    }
  });

  console.log("tokenId", tokenId, "address", address)

  // Get WeNads components
  const { data: avatar } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WeNadsAvatarABI,
    functionName: 'avatars',
    args: [tokenId],
    chainId: monadDevnet.id,
    query: {
      enabled: !!tokenId,
    }
  }) as { data: WeNadsAvatar };

  // Get template IDs for each component if we have an avatar
  const { data: backgroundTemplate } = useReadContract({
    address: COMPONENT_CONTRACT,
    abi: WeNadsComponentABI,
    functionName: 'tokenTemplate',
    args: [avatar?.backgroundId],
    chainId: monadDevnet.id,
    query: {
      enabled: !!avatar?.backgroundId,
    }
  }) as { data: bigint };

  const { data: hairstyleTemplate } = useReadContract({
    address: COMPONENT_CONTRACT,
    abi: WeNadsComponentABI,
    functionName: 'tokenTemplate',
    args: [avatar?.headId],
    query: {
      enabled: !!avatar?.headId,
    }
  }) as { data: bigint };

  const { data: eyesTemplate } = useReadContract({
    address: COMPONENT_CONTRACT,
    abi: WeNadsComponentABI,
    functionName: 'tokenTemplate',
    args: [avatar?.eyesId],
    query: {
      enabled: !!avatar?.eyesId,
    }
  }) as { data: bigint };

  const { data: mouthTemplate } = useReadContract({
    address: COMPONENT_CONTRACT,
    abi: WeNadsComponentABI,
    functionName: 'tokenTemplate',
    args: [avatar?.mouthId],
    query: {
      enabled: !!avatar?.mouthId,
    }
  }) as { data: bigint };

  const { data: flowerTemplate } = useReadContract({
    address: COMPONENT_CONTRACT,
    abi: WeNadsComponentABI,
    functionName: 'tokenTemplate',
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
      address: CONTRACT_ADDRESS,
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

  return { 
    mint,
    hasNFT,
    avatar,
    isLoading: !address || (hasNFT && !avatar && !!tokenId),
    templates
  };
}; 