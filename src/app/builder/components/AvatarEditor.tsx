import { FC, useState, useEffect } from 'react';
import Image from 'next/image';
import { AvatarState, ComponentCategory } from '../types';
import { useAccount } from 'wagmi';
import { useAvatarContract } from '../hooks/useAvatarContract';
import { useNotification } from '../../contexts/NotificationContext';
import { IS_DEVELOPMENT } from '@/contracts/config';

// Include body in rendering order but not in UI
const renderingCategories: ComponentCategory[] = ['background', 'body', 'hairstyle', 'eyes', 'mouth', 'flower'];

interface AvatarEditorProps {
  selectedComponents: AvatarState;
}

const AvatarEditor: FC<AvatarEditorProps> = ({
  selectedComponents,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { mint, changeComponents, burn, templates, nftStatus } = useAvatarContract(selectedComponents);
  const { showNotification } = useNotification();
  const { isConnected } = useAccount();
  const [mintSuccess, setMintSuccess] = useState(false);

  const hasNFT = nftStatus === 'has_nft';
  const isLoading = nftStatus === 'loading';

  // Reset mintSuccess after 2 seconds
  useEffect(() => {
    if (mintSuccess) {
      const timer = setTimeout(() => {
        setMintSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [mintSuccess]);

  const degenPhrases = [
    '🫡 WAGMI SER',
    '🦧 APE TOGETHER',
    '🌙 WEN MOON',
    '💎 DIAMOND HANDS',
    '🚀 NGMI PAPER HANDS',
    '🐸 PEPE APPROVES',
    '🦍 DEGEN SZN',
    '🔥 PROBABLY NOTHING',
    '🤝 GM FREN',
    '🫂 HODL ME'
  ];

  const hasChanges = Object.entries(selectedComponents).some(([category, component]) => {
    if (category === 'body') return false;
    const currentTemplateId = templates[category as keyof typeof templates];
    return currentTemplateId?.toString() !== component?.id;
  });

  const getMintButtonText = () => {
    if (!isConnected) return '🚀 CONNECT TO MINT';
    if (isProcessing) {
      if (hasNFT) return '🔥 CHANGING...';
      return '🔥 MINTING...';
    }
    if (mintSuccess) return '✨ MINTED!';
    if (isLoading) return '⌛ LOADING...';
    if (hasNFT) {
      return hasChanges ? '🔥 CHANGE ITEMS' : degenPhrases[Math.floor(Math.random() * degenPhrases.length)];
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
        await changeComponents(changedComponents, selectedComponents);
        showNotification('Components changed successfully!', 'success');
      } else {
        showNotification('Minting avatar...', 'info');
        await mint();
        showNotification('Avatar minted successfully!', 'success');
        setMintSuccess(true);
      }
    } catch (error: unknown) {
      showNotification(
        error instanceof Error && error.message.includes('rejected') 
          ? 'Transaction rejected by user' 
          : error instanceof Error ? error.message : 'An error occurred',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBurn = async () => {
    try {
      setIsProcessing(true);
      showNotification('Burning avatar...', 'info');
      await burn();
      showNotification('Avatar burned successfully!', 'success');
      setMintSuccess(false);
    } catch (error: unknown) {
      showNotification(
        error instanceof Error && error.message.includes('rejected')
          ? 'Transaction rejected by user'
          : error instanceof Error ? error.message : 'An error occurred',
        'error'
      );
    } finally {
      setIsProcessing(false);
    }
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
        disabled={!isConnected || isProcessing || isLoading || (hasNFT && !hasChanges) || getMintButtonText() === '✨ MINTED!'}
        className={`
          w-full max-w-[400px] py-3 px-4 rounded-xl font-black text-center uppercase transition-all
          border-4 
          ${getMintButtonText() === '✨ MINTED!'
            ? 'bg-green-400 text-white border-green-500 shadow-[4px_4px_0px_0px_#16A34A] cursor-not-allowed'
            : !isConnected || isLoading || (hasNFT && !hasChanges)
              ? 'bg-purple-200 text-purple-400 border-purple-300 cursor-not-allowed'
              : 'bg-[#8B5CF6] text-white border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6]'
          }
        `}
      >
        {getMintButtonText()}
      </button>

      {hasNFT && IS_DEVELOPMENT && (
        <button
          onClick={handleBurn}
          disabled={!isConnected || isProcessing || isLoading}
          className={`
            w-full max-w-[400px] py-3 px-4 rounded-xl font-black text-center uppercase transition-all
            border-4 
            ${isProcessing || isLoading
              ? 'bg-red-200 text-red-400 border-red-300 cursor-not-allowed'
              : 'bg-red-500 text-white border-red-600 shadow-[4px_4px_0px_0px_#DC2626] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#DC2626]'
            }
          `}
        >
          {isProcessing ? '🔥 BURNING...' : isLoading ? '⌛ LOADING...' : '🔥 BURN NFT'}
        </button>
      )}
    </div>
  );
};

export default AvatarEditor; 