import { FC, useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { AvatarState, ComponentCategory, ComponentInfo } from '../types';
import { useAccount } from 'wagmi';
import { useAvatarContract } from '../hooks/useAvatarContract';
import { useNotification } from '../../contexts/NotificationContext';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const { mint, changeComponents, templates } = useAvatarContract(selectedComponents);
  const { showNotification } = useNotification();
  const { isConnected } = useAccount();

  const getMintButtonText = () => {
    if (!isConnected) return '🚀 CONNECT TO MINT';
    if (isProcessing) {
      if (hasNFT) return '🔥 CHANGING...';
      return '🔥 MINTING...';
    }
    if (hasNFT) {
      // Check if there are any changes to apply
      const hasChanges = Object.entries(selectedComponents).some(([category, component]) => {
        if (category === 'body') return false;
        const currentTemplateId = templates[category as keyof typeof templates];
        return currentTemplateId?.toString() !== component?.id;
      });
      return hasChanges ? '🔥 CHANGE ITEMS' : '✨ NO CHANGES';
    }
    return '🔥 MINT';
  };

  const handleMint = async () => {
    try {
      setIsProcessing(true);
      if (hasNFT) {
        // Check if any components are different from current
        const hasChanges = Object.entries(selectedComponents).some(([category, component]) => {
          if (category === 'body') return false;
          const currentTemplateId = templates[category as keyof typeof templates];
          return currentTemplateId?.toString() !== component?.id;
        });

        if (!hasChanges) {
          showNotification('No changes to apply', 'info');
          return;
        }

        // Convert selectedComponents to the format expected by changeComponents
        const changedComponents = Object.entries(selectedComponents).reduce((acc, [category, component]) => {
          if (category !== 'body' && component) {
            acc[category] = { id: component.id };
          }
          return acc;
        }, {} as Record<string, { id: string }>);

        showNotification('Changing components...', 'info');
        const hash = await changeComponents(changedComponents, selectedComponents);
        showNotification('Components changed successfully!', 'success');
      } else {
        showNotification('Minting avatar...', 'info');
        const hash = await mint();
        showNotification('Avatar minted successfully!', 'success');
      }
    } catch (err: any) {
      showNotification(
        err.message.includes('rejected') ? 'Transaction rejected by user' : err.message,
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateTotalPrice = () => {
    const total = Object.values(selectedComponents).reduce(
      (sum, component) => sum + (component?.price || BigInt(0)),
      BigInt(0)
    );
    // Convert from wei to MON and format with 2 decimal places
    return (Number(total) / 1e18).toFixed(2);
  };

  const renderPreview = () => {
    // If we have an NFT but no components selected, return null
    if (hasNFT && Object.keys(selectedComponents).length === 0) {
      return null;
    }

    // Show components
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
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      <div className="w-full aspect-square max-w-[400px] bg-white rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] overflow-hidden border-4 border-[#8B5CF6]">
        {renderPreview()}
      </div>

      <button
        onClick={handleMint}
        disabled={!isConnected || isProcessing}
        className={`
          w-full max-w-[400px] py-3 px-4 rounded-xl font-black text-center uppercase transition-all
          border-4 
          ${!isConnected
            ? 'bg-purple-200 text-purple-400 border-purple-300 cursor-not-allowed'
            : 'bg-[#8B5CF6] text-white border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6]'
          }
        `}
      >
        {getMintButtonText()}
      </button>

      <div className="text-center text-sm">
        <span className="text-purple-600 font-bold">Total Price: {calculateTotalPrice()} MON</span>
      </div>

      <div className="max-w-[400px] text-sm text-purple-700 bg-purple-50 p-4 rounded-xl border-2 border-purple-200">
        <p>
          WeNads is a unique Soulbound Token (SBT) collection where each address can own exactly one NFT. 
          While your WeNads NFT is bound to you, its components are ERC1155 tokens that can be freely traded. 
          Mix and match different components to create your perfect avatar - all powered by fully on-chain assets!
        </p>
      </div>
    </div>
  );
};

export default AvatarEditor; 