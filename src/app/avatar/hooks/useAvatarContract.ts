import { useWriteContract } from 'wagmi';
import { AvatarState } from '../types';
import WeNadsAvatarABI from '@/contracts/abis/WeNadsAvatar.json';

// TODO: Replace with actual contract address
const CONTRACT_ADDRESS = '0xE387B6860067D97107122D2Dc90e546529484b27';

export const useAvatarContract = (selectedComponents: AvatarState) => {
  const { writeContract } = useWriteContract();

  const mint = async () => {
    const componentArray = Object.entries(selectedComponents).map(
      ([category, id]) => `${category}:${id}`
    );
    
    return writeContract({
      address: CONTRACT_ADDRESS,
      abi: WeNadsAvatarABI,
      functionName: 'mintAvatar',
      args: [componentArray],
    });
  };

  return { mint };
}; 