'use client';

import { FC, useState, useEffect, useRef } from 'react';
import AvatarEditor from './components/AvatarEditor';
import ComponentSelector from './components/ComponentSelector';
import { ComponentCategory, AvatarState, ComponentInfo } from './types';
import { ConnectBtn } from '../components/connectButton';
import { useComponentContract } from './hooks/useComponentContract';
import { useAvatarContract } from './hooks/useAvatarContract';
import './styles.css';
import NewTemplateModal from './components/NewTemplateModal';

// Remove body from visible categories since it's always selected
const categories: ComponentCategory[] = ['background', 'hairstyle', 'eyes', 'mouth', 'flower'];

const AvatarGenerator: FC = () => {
  const [selectedComponents, setSelectedComponents] = useState<AvatarState>({});
  const { hasNFT, avatar, isLoading, templates: avatarTemplates } = useAvatarContract(selectedComponents);
  const initializedRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get first component from each category
  const categoryContracts = categories.map(category => useComponentContract(category));
  const allTemplatesLoaded = categoryContracts.every(contract => contract.templates.length > 0);

  useEffect(() => {
    console.log("hasNFT", hasNFT);
    console.log("allTemplatesLoaded", allTemplatesLoaded);
    console.log("initializedRef.current", initializedRef.current);
    console.log("isLoading", isLoading);
      console.log("avatarTemplates", avatarTemplates);
    // Only set components if we have loaded templates and haven't initialized yet
    if ((!hasNFT && !allTemplatesLoaded) || initializedRef.current) return;

    // If still loading NFT status, wait
    if (isLoading) return;
      console.log("avatarTemplates2", avatarTemplates);

    const initialComponents: AvatarState = {
      body: {
        id: '0',
        image: '/body.png',
        name: 'Default Body',
        price: BigInt(0)
      }
    };

    // If user has NFT and we have the avatar data, use those components
    if (hasNFT && avatar) {
      // Wait for all template IDs to be loaded
      if (!avatarTemplates.background || !avatarTemplates.hairstyle || 
          !avatarTemplates.eyes || !avatarTemplates.mouth || 
          !avatarTemplates.flower) {
        return;
      }


      // Map the component IDs to their full info
      categories.forEach((category, index) => {
        const contract = categoryContracts[index];
        let templateId: bigint | undefined;

        switch (category) {
          case 'background':
            templateId = avatarTemplates.background;
            break;
          case 'hairstyle':
            templateId = avatarTemplates.hairstyle;
            break;
          case 'eyes':
            templateId = avatarTemplates.eyes;
            break;
          case 'mouth':
            templateId = avatarTemplates.mouth;
            break;
          case 'flower':
            templateId = avatarTemplates.flower;
            break;
        }
        
        if (templateId) {
          const template = contract.templates.find(t => t.id.toString() === templateId?.toString());
          if (template) {
            initialComponents[category] = {
              id: template.id.toString(),
              image: template.image,
              name: template.name,
              price: template.price
            };
          }
        }
      });
      initializedRef.current = true;
    } else if (!hasNFT && allTemplatesLoaded) {
      console.log("setting default components");
      // Set default components for users without NFT
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
      initializedRef.current = true;
    }

    setSelectedComponents(initialComponents);
  }, [allTemplatesLoaded, hasNFT, avatar, isLoading, avatarTemplates]);

  const handleSelect = (category: ComponentCategory, component: ComponentInfo) => {
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
            <div className="order-1 lg:order-2 bg-purple-50 rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] p-12 lg:sticky lg:top-28 lg:h-fit border-4 border-[#8B5CF6]">
              <div className="max-w-[500px] mx-auto">
                <AvatarEditor
                  selectedComponents={selectedComponents}
                  onSelect={handleSelect}
                />
              </div>
            </div>

            {/* Controls Section - Below preview on mobile */}
            <div className="order-2 lg:order-1 bg-purple-50 rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] p-6 border-4 border-[#8B5CF6] overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-purple-900">Components</h2>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="
                    px-4 py-2 
                    bg-[#8B5CF6] hover:bg-[#7C3AED]
                    text-white font-black rounded-xl
                    border-4 border-[#7C3AED]
                    shadow-[4px_4px_0px_0px_#5B21B6]
                    hover:translate-x-[2px] hover:translate-y-[2px]
                    hover:shadow-[2px_2px_0px_0px_#5B21B6]
                    transition-all
                    flex items-center gap-2
                    uppercase tracking-wider
                  "
                >
                  <span className="text-xl">✨</span>
                  NEW TEMPLATE
                </button>
              </div>
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

            <NewTemplateModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvatarGenerator; 