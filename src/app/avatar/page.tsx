'use client';

import { FC, useState } from 'react';
import AvatarEditor from './components/AvatarEditor';
import ComponentSelector from './components/ComponentSelector';
import { ComponentCategory, AvatarState } from './types';
import { ConnectBtn } from '../components/connectButton';
import './styles.css';

// Remove body from visible categories since it's always selected
const categories: ComponentCategory[] = ['background', 'hairstyle', 'eyes', 'mouth', 'flower'];

const AvatarGenerator: FC = () => {
  // Initialize with default selections for all components
  const [selectedComponents, setSelectedComponents] = useState<AvatarState>({
    background: 'background-1',
    body: 'body-1', // Always selected but hidden from UI
    hairstyle: 'hairstyle-1',
    eyes: 'eyes-1',
    mouth: 'mouth-1',
    flower: 'flowers-1',
  });

  const handleSelect = (category: ComponentCategory, componentId: string) => {
    setSelectedComponents((prev) => ({
      ...prev,
      [category]: componentId,
    }));
  };

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
                    selectedId={selectedComponents[category]}
                    onSelect={(componentId) => handleSelect(category, componentId)}
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