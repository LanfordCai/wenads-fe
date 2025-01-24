import { FC, useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { AvatarState, ComponentCategory, ComponentInfo } from '../types';
import { useAccount } from 'wagmi';
import { useAvatarContract } from '../hooks/useAvatarContract';

// Include body in rendering order but not in UI
const renderingCategories: ComponentCategory[] = ['background', 'body', 'hairstyle', 'eyes', 'mouth', 'flower'];

interface AvatarEditorProps {
  selectedComponents: AvatarState;
  onSelect: (category: ComponentCategory, component: ComponentInfo) => void;
  hasNFT: boolean;
}

const AvatarEditor: FC<AvatarEditorProps> = ({
  selectedComponents,
  onSelect,
  hasNFT,
}) => {
  const { isConnected } = useAccount();
  const { mint, changeComponents, avatar, templates } = useAvatarContract(selectedComponents);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState(false);

  // Reset mintSuccess when selected components change
  useEffect(() => {
    setMintSuccess(false);
    setMintError(null);
  }, [selectedComponents]);

  // Check if there are any actual changes to apply
  const hasChanges = useMemo(() => {
    if (!hasNFT || !templates) return true;

    return Object.entries(selectedComponents).some(([category, component]) => {
      if (category === 'body') return false;
      if (!component) return false;

      const currentTemplateId = templates[category];
      return currentTemplateId?.toString() !== component.id;
    });
  }, [hasNFT, templates, selectedComponents]);

  const getMintButtonText = () => {
    if (!isConnected) return '🚀 CONNECT TO MINT';
    if (isMinting) {
      if (hasNFT) return '🔥 CHANGING...';
      return '🔥 MINTING...';
    }
    if (mintSuccess) {
      if (hasNFT) return '✨ CHANGED!';
      return '✨ MINTED!';
    }
    if (mintError) return '💀 FAILED';
    if (hasNFT) return hasChanges ? '🎨 CHANGE ITEMS' : '✨ NO CHANGES';
    return `🐸 MINT NOW`;
  };

  const calculateTotalPrice = () => {
    const componentsPrice = Object.values(selectedComponents).reduce((total, component) => {
      if (!component?.id) return total;
      return total + (Number(component.price || 0) / 1e18);
    }, 0);
    return componentsPrice.toFixed(2);
  };

  const renderPreview = () => {
    const getZIndex = (cat: ComponentCategory) => {
      switch (cat) {
        case 'background': return 0;
        case 'body': return 10;
        case 'hairstyle': return 20;
        case 'eyes': return 30;
        case 'mouth': return 40;
        case 'flower': return 50;
        default: return 0;
      }
    };

    return (
      <div className="relative w-full aspect-square">
        {renderingCategories.map((category) => {
          const component = selectedComponents[category];
          if (!component) return null;

          return (
            <Image
              key={category}
              src={component.image}
              alt={component.name || category}
              fill
              className="object-contain absolute inset-0"
              style={{ zIndex: getZIndex(category) }}
              priority={category === 'body'}
            />
          );
        })}
      </div>
    );
  }

  const handleMint = async () => {
    if (!mint || !changeComponents) return;
    
    try {
      setIsMinting(true);
      setMintError(null);
      setMintSuccess(false);
      
      if (hasNFT) {
        // Filter out components that haven't changed
        const changedComponents = Object.entries(selectedComponents)
          .filter(([category, component]) => {
            if (!component) return false;
            const currentTemplateId = templates[category];
            return currentTemplateId?.toString() !== component.id;
          })
          .reduce((acc, [category, component]) => {
            if (!component) return acc;
            acc[category] = { id: component.id };
            return acc;
          }, {} as Record<string, { id: string }>);

        if (Object.keys(changedComponents).length === 0) {
          setMintError('No changes to apply');
          setIsMinting(false);
          return;
        }

        const [hash] = await changeComponents(changedComponents, selectedComponents);
        // Wait for transaction confirmation
        const provider = window.ethereum;
        if (!provider) throw new Error('No provider available');

        while (true) {
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });

          if (receipt) {
            if (receipt.status === '0x1') {
              setMintSuccess(true);
            } else {
              throw new Error('Transaction failed');
            }
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } else {
        const hash = await mint();
        // Wait for transaction confirmation
        const provider = window.ethereum;
        if (!provider) throw new Error('No provider available');

        while (true) {
          const receipt = await provider.request({
            method: 'eth_getTransactionReceipt',
            params: [hash],
          });

          if (receipt) {
            if (receipt.status === '0x1') {
              setMintSuccess(true);
            } else {
              throw new Error('Transaction failed');
            }
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      setIsMinting(false);
    } catch (err) {
      console.error('Failed to mint:', err);
      setMintError(err instanceof Error ? err.message : 'Failed to mint avatar');
      setIsMinting(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="w-full aspect-square max-w-[400px] bg-white rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] overflow-hidden border-4 border-[#8B5CF6]">
        {renderPreview()}
      </div>

      <button
        onClick={handleMint}
        disabled={!isConnected || isMinting || mintSuccess || !mint || (hasNFT && !hasChanges)}
        className={`
          w-full max-w-[400px] py-3 px-4 rounded-xl font-black text-center uppercase transition-all
          border-4 
          ${!isConnected || !mint || (hasNFT && !hasChanges)
            ? 'bg-purple-200 text-purple-400 border-purple-300 cursor-not-allowed'
            : mintSuccess
              ? 'bg-green-500 text-white border-green-600 shadow-[4px_4px_0px_0px_#166534]'
              : mintError
                ? 'bg-red-500 text-white border-red-600 shadow-[4px_4px_0px_0px_#991B1B] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#991B1B]'
                : 'bg-[#8B5CF6] text-white border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6]'
          }
        `}
      >
        {getMintButtonText()}
      </button>

      <div className="text-center text-sm">
        <span className="text-purple-600 font-bold">Total Price: {calculateTotalPrice()} MON</span>
      </div>

      {mintError && (
        <p className="text-red-500 text-sm font-black uppercase">
          Error: {mintError}
        </p>
      )}
    </div>
  );
};

export default AvatarEditor; 