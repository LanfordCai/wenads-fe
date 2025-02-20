'use client';

import { FC, useState, useEffect, useRef, useMemo } from 'react';
import AvatarEditor from './components/AvatarEditor';
import ComponentSelector from './components/ComponentSelector';
import { ComponentCategory, AvatarState, ComponentInfo } from './types';
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

  // Move hooks to top level
  const backgroundContract = useComponentContract('background');
  const hairstyleContract = useComponentContract('hairstyle');
  const eyesContract = useComponentContract('eyes');
  const mouthContract = useComponentContract('mouth');
  const flowerContract = useComponentContract('flower');

  // Move the categoryContracts array into useMemo
  const categoryContracts = useMemo(() => [
    backgroundContract,
    hairstyleContract,
    eyesContract,
    mouthContract,
    flowerContract
  ], [backgroundContract, hairstyleContract, eyesContract, mouthContract, flowerContract]);

  const allTemplatesLoaded = categoryContracts.every(contract => contract.templates.length > 0);

  useEffect(() => {
    // Add debug logging
    console.log("Component Loading State:", {
      hasNFT,
      allTemplatesLoaded,
      isInitialized: initializedRef.current,
      isLoading,
      avatarTemplates,
      categoryContracts: categoryContracts.map(c => c.templates.length)
    });

    // Reset initialization if templates are not loaded
    if (!allTemplatesLoaded) {
      initializedRef.current = false;
      return;
    }

    // Only proceed if we haven't initialized yet
    if (initializedRef.current) return;

    // If still loading NFT status, wait
    if (isLoading) return;

    const initialComponents: AvatarState = {
      body: {
        id: '0',
        image: '/body.png',
        name: 'Default Body',
        price: BigInt(0)
      }
    };

    // For users with NFT, wait for all template data
    if (hasNFT && avatar) {
      // Ensure all template IDs are loaded
      if (!avatarTemplates.background || !avatarTemplates.hairstyle || 
          !avatarTemplates.eyes || !avatarTemplates.mouth || 
          !avatarTemplates.flower) {
        console.log("Waiting for template IDs to load");
        return;
      }

      // Map the component IDs to their full info
      let allComponentsFound = true;
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
          } else {
            console.log(`Template not found for ${category} with ID ${templateId.toString()}`);
            allComponentsFound = false;
          }
        }
      });

      // Only proceed if all components were found
      if (!allComponentsFound) {
        console.log("Not all components were found, waiting...");
        return;
      }
    } else if (!hasNFT) {
      // Set default components for users without NFT
      let allDefaultsFound = true;
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
        } else {
          console.log(`No template found for ${category}`);
          allDefaultsFound = false;
        }
      });

      // Only proceed if all defaults were found
      if (!allDefaultsFound) {
        console.log("Not all default components were found, waiting...");
        return;
      }
    }

    // Only set state if we have all required components
    if (Object.keys(initialComponents).length === categories.length + 1) { // +1 for body
      console.log("Setting initial components:", initialComponents);
      setSelectedComponents(initialComponents);
      initializedRef.current = true;
    } else {
      console.log("Missing some components, waiting...");
    }
  }, [allTemplatesLoaded, hasNFT, avatar, isLoading, avatarTemplates, categoryContracts]);

  const handleSelect = (category: ComponentCategory, component: ComponentInfo) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [category]: component,
    }));
  };

  if (isLoading || !allTemplatesLoaded) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl font-black text-purple-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-100 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr,1.5fr] gap-8">
            {/* Preview Section - Always on top for mobile */}
            <div className="order-1 lg:order-2 bg-purple-50 rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] p-12 lg:sticky lg:top-28 lg:h-fit border-4 border-[#8B5CF6]">
              <div className="max-w-[500px] mx-auto">
                <AvatarEditor
                  selectedComponents={selectedComponents}
                />
              </div>
            </div>

            {/* Controls Section - Below preview on mobile */}
            <div className="order-2 lg:order-1 bg-purple-50 rounded-xl shadow-[8px_8px_0px_0px_#8B5CF6] p-6 border-4 border-[#8B5CF6] overflow-hidden">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-purple-800">Components</h2>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="
                    px-3 py-1.5 md:px-4 md:py-2 
                    bg-[#8B5CF6] hover:bg-[#7C3AED]
                    text-white text-sm md:text-base font-black rounded-xl
                    border-4 border-[#7C3AED]
                    shadow-[4px_4px_0px_0px_#5B21B6]
                    hover:translate-x-[2px] hover:translate-y-[2px]
                    hover:shadow-[2px_2px_0px_0px_#5B21B6]
                    transition-all
                    flex items-center gap-1 md:gap-2
                    uppercase tracking-wider
                  "
                >
                  <span className="text-base md:text-xl">✨</span>
                  <span className="hidden md:inline">NEW TEMPLATE</span>
                  <span className="md:hidden">NEW</span>
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