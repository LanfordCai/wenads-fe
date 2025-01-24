import { FC, useRef, MouseEvent, useState } from 'react';
import Image from 'next/image';
import { ComponentCategory } from '../types';
import { useComponentContract } from '../hooks/useComponentContract';

interface ComponentSelectorProps {
  category: ComponentCategory;
  selectedId?: string;
  onSelect: (componentId: string) => void;
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
  
  const { templates, templateIds } = useComponentContract(category);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current!.offsetLeft);
    setScrollLeft(scrollContainerRef.current!.scrollLeft);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current!.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current!.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
            {templates.map((template) => (
              <div key={template.id.toString()} className="flex flex-col">
                <button
                  onClick={() => onSelect(template.id.toString() || '')}
                  className={`
                    flex-shrink-0 w-20 h-20 rounded-xl transition-all bg-white relative
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
                <div className="mt-1 text-center bg-purple-100 text-[#8B5CF6] text-xs font-bold py-1 px-2 rounded-lg">
                  {(Number(template.price) / 1e18).toFixed(2)} MON
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComponentSelector; 