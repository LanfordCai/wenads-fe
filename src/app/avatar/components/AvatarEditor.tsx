import { FC, useState } from 'react';
import Image from 'next/image';
import { AvatarState, ComponentCategory } from '../types';
import { componentsByCategory } from './avatarComponents';
import { useAccount } from 'wagmi';
import { useAvatarContract } from '../hooks/useAvatarContract';

// Include body in rendering order but not in UI
const renderingCategories: ComponentCategory[] = ['background', 'body', 'hairstyle', 'eyes', 'mouth', 'flower'];

interface AvatarEditorProps {
  selectedComponents: AvatarState;
  onSelect: (category: ComponentCategory, componentId: string) => void;
}

const AvatarEditor: FC<AvatarEditorProps> = ({ selectedComponents, onSelect }) => {
  const { isConnected } = useAccount();
  const { mint } = useAvatarContract(selectedComponents);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
  const [mintSuccess, setMintSuccess] = useState(false);

  const MINT_FEE = 10; // 0.10 MON in cents

  const calculateTotalPrice = () => {
    const componentsPrice = Object.entries(selectedComponents).reduce((total, [category, componentId]) => {
      if (!componentId) return total;
      const component = componentsByCategory[category as ComponentCategory]?.find(c => c.id === componentId);
      return total + (component?.price || 0);
    }, 0);
    return (componentsPrice + MINT_FEE) / 100; // Convert cents to MON
  };

  const totalPrice = calculateTotalPrice();

  const getMintButtonText = () => {
    if (!isConnected) return '🚀 CONNECT TO MINT';
    if (isMinting) return '🔥 MINTING...';
    if (mintSuccess) return '✨ MINTED!';
    if (mintError) return '💀 FAILED';
    return `🐸 MINT NOW (${totalPrice.toFixed(2)} MON)`;
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
          const componentId = selectedComponents[category];
          if (!componentId) {
            // Use default component if available
            const defaultComponent = componentsByCategory[category]?.[0];
            if (defaultComponent && category === 'body') {
              return (
                <Image
                  key={category}
                  src={defaultComponent.imageUrl}
                  alt={category}
                  fill
                  className="object-contain absolute inset-0"
                  style={{ zIndex: getZIndex(category) }}
                  priority={category === 'body'}
                />
              );
            }
            return null;
          }

          const component = componentsByCategory[category]?.find(c => c.id === componentId);
          if (!component) return null;

          return (
            <Image
              key={category}
              src={component.imageUrl}
              alt={category}
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

  const handleMint = async () => {
    if (!mint) return;
    
    try {
      setIsMinting(true);
      setMintError(null);
      await mint();
      setMintSuccess(true);
    } catch (err) {
      console.error('Failed to mint:', err);
      setMintError(err instanceof Error ? err.message : 'Failed to mint avatar');
    } finally {
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
        disabled={!isConnected || isMinting || mintSuccess || !mint}
        className={`
          w-full max-w-[400px] py-3 px-4 rounded-xl font-black text-center uppercase transition-all
          border-4 
          ${!isConnected || !mint
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

      {mintError && (
        <p className="text-red-500 text-sm font-black uppercase">
          Error: {mintError}
        </p>
      )}
    </div>
  );
};

export default AvatarEditor; 