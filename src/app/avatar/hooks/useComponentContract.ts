import { useReadContract } from 'wagmi';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';
import { ComponentCategory } from '../types';

// TODO: Replace with actual contract address
const CONTRACT_ADDRESS = '0xE3086f80e93E2e602Cb7Ab092eF1599F82c56FBB';

// Map our UI categories to contract enum values
const categoryToEnum: Record<ComponentCategory, number> = {
  background: 0, // BACKGROUND
  hairstyle: 1, // HAIRSTYLE
  eyes: 2,      // EYES
  mouth: 3,     // MOUTH
  flower: 4,   // FLOWER
  body: 5
};

interface Template {
  id: bigint,
  name: string;
  creator: string;
  maxSupply: bigint;
  currentSupply: bigint;
  price: bigint;
  imageData: string;
  isActive: boolean;
  componentType: number;
  image: string;
}

export const useComponentContract = (category: ComponentCategory) => {
  const { data: templateIds = [] } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WeNadsComponentABI,
    functionName: 'getTemplatesOfType',
    args: [categoryToEnum[category]],
  }) as { data: bigint[] | undefined };

  const { data: templates = [] } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: WeNadsComponentABI,
    functionName: 'getTemplates',
    args: [templateIds],
    query: {
      enabled: templateIds.length > 0,
    },
  }) as { data: Omit<Template, 'id' | 'image'>[] };

  const fullTemplates= templates.map((template, index) => ({
    ...template,
    id: templateIds[index],
    image: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA${template.imageData}`
  })).filter(template => template.isActive);

  return {
    templates: fullTemplates,
    templateIds,
  };
}; 