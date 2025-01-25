import { FC, useRef, MouseEvent, useState } from 'react';
import Image from 'next/image';
import { ComponentCategory, ComponentInfo } from '../types';
import { useComponentContract } from '../hooks/useComponentContract';
import { useNotification } from '../../contexts/NotificationContext';
import TemplateDetailModal from './TemplateDetailModal';

interface ComponentSelectorProps {
  category: ComponentCategory;
  selectedId?: string;
  onSelect: (component: ComponentInfo) => void;
}

const ComponentSelector: FC<ComponentSelectorProps> = ({
  category,
  selectedId,
  onSelect,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [clickStartX, setClickStartX] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const { templates, templateIds } = useComponentContract(category);
  const { showNotification } = useNotification();

  const formatPrice = (price: bigint) => {
    return (Number(price) / 1e18).toFixed(2);
  };

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current!.offsetLeft);
    setScrollLeft(scrollContainerRef.current!.scrollLeft);
    setClickStartX(e.pageX);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(false);
    // Only trigger click if it's a small movement (not a drag)
    const moveDistance = Math.abs(e.pageX - clickStartX);
    if (moveDistance < 5 && e.target instanceof HTMLElement) {
      const button = e.target.closest('button');
      if (button) {
        const templateId = button.getAttribute('data-template-id');
        const template = templates.find(t => t.id.toString() === templateId);
        if (template) {
          if (!template.isActive) {
            showNotification('This component is currently inactive 🚫', 'error');
            return;
          }
          if (template.currentSupply >= template.maxSupply) {
            showNotification('This component is sold out! Try another one 🔥', 'error');
            return;
          }
          const componentInfo: ComponentInfo = {
            id: template.id.toString(),
            image: template.image,
            name: template.name,
            price: template.price
          };
          onSelect(componentInfo);
        }
      }
    }
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-black uppercase text-purple-900 flex items-center gap-2">
        {category}
        <span className="text-sm bg-[#8B5CF6] px-2 py-0.5 rounded-lg text-white">
          {templateIds.length}
        </span>
      </h3>

      <div className="relative">
        {/* Scrollable container */}
        <div 
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="overflow-x-auto scrollbar-hide select-none cursor-grab active:cursor-grabbing"
          style={{ userSelect: 'none' }}
        >
          <div className="flex gap-3 p-2 min-w-min">
            {templates.map((template) => {
              return (
                <div key={template.id.toString()} className="flex flex-col">
                  <div className="group">
                    <button
                      data-template-id={template.id.toString()}
                      className={`
                        component-button relative
                        flex-shrink-0 w-20 h-20 rounded-xl transition-all bg-white
                        border-4 hover:scale-105
                        ${selectedId === template.id.toString()
                          ? 'border-[#8B5CF6] shadow-[4px_4px_0px_0px_#5B21B6] scale-110 bg-purple-50'
                          : 'border-purple-200 hover:border-[#8B5CF6] hover:shadow-[4px_4px_0px_0px_#5B21B6] hover:bg-purple-50'
                        }
                      `}
                    >
                      <Image
                        src={template.image}
                        alt={`${category} option ${template.id.toString()}`}
                        fill
                        className="object-contain p-1 pointer-events-none"
                      />
                    </button>
                  </div>
                  <div className="mt-1 space-y-1">
                    <div className="text-center bg-purple-100 text-[#8B5CF6] text-xs font-bold py-1 px-2 rounded-lg">
                      {formatPrice(template.price)} MON
                    </div>
                    <button
                      onClick={() => setSelectedTemplate(template)}
                      className="w-full text-center bg-purple-100 text-[#8B5CF6] text-xs font-bold py-1 px-2 rounded-lg hover:bg-purple-200 transition-colors"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
        />
      )}
    </div>
  );
};

export default ComponentSelector; 