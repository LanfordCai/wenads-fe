import { useWriteContract } from 'wagmi';
import { AvatarState } from '../types';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';

// TODO: Replace with actual contract address
const CONTRACT_ADDRESS = '0xE387B6860067D97107122D2Dc90e546529484b27';

export const useAvatarContract = (selectedComponents: AvatarState) => {
  const { writeContract } = useWriteContract();

  const mint = async (): Promise<`0x${string}`> => {
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
    
    const hash = await writeContract({
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

  return { mint };
}; 