import { useReadContract, useWriteContract } from 'wagmi';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';
import { ComponentCategory, Template } from '../types';
import { CONTRACT_ADDRESSES } from '@/contracts/config';

// Map our UI categories to contract enum values
const categoryToEnum: Record<ComponentCategory, number> = {
  background: 0, // BACKGROUND
  hairstyle: 1, // HAIRSTYLE
  eyes: 2,      // EYES
  mouth: 3,     // MOUTH
  flower: 4,   // FLOWER
  body: 5
};

export const useComponentContract = (category: ComponentCategory) => {
  const { writeContractAsync } = useWriteContract();

  const { data: templateIdsData = [] } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getTemplatesOfType',
    args: [categoryToEnum[category]],
  }) as { data: bigint[] | undefined };

  const { data: templatesData = [] } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getTemplates',
    args: [templateIdsData],
    query: {
      enabled: templateIdsData.length > 0,
    },
  }) as { data: Omit<Template, 'id' | 'image'>[] };

  const fullTemplates = templatesData.map((template, index) => ({
    ...template,
    id: templateIdsData[index],
    image: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA${template.imageData}`
  })).filter(template => template.isActive);

  const createTemplate = async ({
    _name,
    _maxSupply,
    _price,
    _image,
    value
  }: {
    _name: string;
    _maxSupply: bigint;
    _price: bigint;
    _image: string;
    value: bigint;
  }) => {
    return writeContractAsync({
      address: CONTRACT_ADDRESSES.COMPONENT,
      abi: WeNadsComponentABI,
      functionName: 'createTemplate',
      args: [_name, _maxSupply, _price, _image, categoryToEnum[category]],
      value
    });
  };

  return {
    templates: fullTemplates,
    templateIds: templateIdsData,
    createTemplate,
  };
}; 