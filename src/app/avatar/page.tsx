'use client';

import { FC, useState, useEffect } from 'react';
import AvatarEditor from './components/AvatarEditor';
import ComponentSelector from './components/ComponentSelector';
import { ComponentCategory, AvatarState, ComponentInfo, WeNadsAvatar } from './types';
import { ConnectBtn } from '../components/connectButton';
import { useComponentContract } from './hooks/useComponentContract';
import { useAvatarContract } from './hooks/useAvatarContract';
import './styles.css';

// Remove body from visible categories since it's always selected
const categories: ComponentCategory[] = ['background', 'hairstyle', 'eyes', 'mouth', 'flower'];

const AvatarGenerator: FC = () => {
  const [selectedComponents, setSelectedComponents] = useState<AvatarState>({});
  const { hasNFT, avatar, isLoading, templates: avatarTemplates } = useAvatarContract(selectedComponents);

  // Get first component from each category
  const categoryContracts = categories.map(category => useComponentContract(category));
  const allTemplatesLoaded = categoryContracts.every(contract => contract.templates.length > 0);

  useEffect(() => {
    // Only set components if we have loaded templates
    if (!allTemplatesLoaded || isLoading) return;

    const initialComponents: AvatarState = {
      body: {
        id: '0',
        image: '/body.png',
        name: 'Default Body',
        price: BigInt(0)
      }
    };

    console.log("avatarTemplates", avatarTemplates);
    console.log("avatar", avatar);

    // If user has NFT and we have the avatar data, use those components
    if (hasNFT && avatar && avatarTemplates.background && avatarTemplates.hairstyle && avatarTemplates.eyes && avatarTemplates.mouth && avatarTemplates.flower) {
      console.log("avatarTemplates", avatarTemplates);
      // Map the component IDs to their full info
      categories.forEach((category, index) => {
        const contract = categoryContracts[index];
        const template = contract.templates.find(t => {
          const templateId = t.id.toString();
          switch (category) {
            case 'background':
              return templateId === avatarTemplates.background.toString();
            case 'hairstyle':
              return templateId === avatarTemplates.hairstyle.toString();
            case 'eyes':
              return templateId === avatarTemplates.eyes.toString();
            case 'mouth':
              return templateId === avatarTemplates.mouth.toString();
            case 'flower':
              return templateId === avatarTemplates.flower.toString();
            default:
              return false;
          }
        });

        if (template) {
          initialComponents[category] = {
            id: template.id.toString(),
            image: template.image,
            name: template.name,
            price: template.price
          };
        }
      });
    } else if (!hasNFT) {
      // Only set default components if user doesn't have NFT
      categoryContracts.forEach((contract, index) => {
        const category = categories[index];
        const firstTemplate = contract.templates[0];
        if (firstTemplate) {
          initialComponents[category] = {
            id: firstTemplate.id.toString(),
            image: firstTemplate.image,
            name: firstTemplate.name,
            price: firstTemplate.price
          };
        }
      });
    }

    setSelectedComponents(initialComponents);
  }, [allTemplatesLoaded, hasNFT, avatar, isLoading]);

  const handleSelect = (category: ComponentCategory, component: ComponentInfo) => {
    // Don't allow changes if user has NFT
    if (hasNFT) return;

    setSelectedComponents((prev) => ({
      ...prev,
      [category]: component,
    }));
  };

  if (isLoading || !allTemplatesLoaded) {
    return (
      <div className="min-h-screen bg-purple-100 flex items-center justify-center">
        <div className="text-2xl font-black text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 flex flex-col">
      {/* Fixed Header */}
      <div className="sticky top-0 z-50 bg-[#8B5CF6] border-b-4 border-[#7C3AED] shadow-[0px_4px_0px_0px_#5B21B6]">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-black text-white tracking-tight">
              WeNads 
            </h1>
            <ConnectBtn />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr,1.5fr] gap-8">
            {/* Preview Section - Always on top for mobile */}
            <div className="order-1 lg:order-2 bg-purple-50 rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] p-6 lg:sticky lg:top-28 lg:h-fit border-4 border-[#8B5CF6]">
              <h2 className="text-2xl font-black mb-4 text-purple-900">Preview</h2>
              <div className="max-w-[500px] mx-auto">
                <AvatarEditor selectedComponents={selectedComponents} onSelect={handleSelect} />
              </div>
            </div>

            {/* Controls Section - Below preview on mobile */}
            <div className="order-2 lg:order-1 bg-purple-50 rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] p-6 border-4 border-[#8B5CF6] overflow-hidden">
              <h2 className="text-2xl font-black mb-6 text-purple-900">Customize</h2>
              <div className="space-y-8 max-h-[calc(100vh-12rem)] overflow-y-auto pr-2 scrollbar-hide">
                {categories.map((category) => (
                  <ComponentSelector
                    key={category}
                    category={category}
                    selectedId={selectedComponents[category]?.id}
                    onSelect={(component) => handleSelect(category, component)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarGenerator; 