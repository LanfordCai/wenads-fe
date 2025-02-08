'use client';

import { FC, useEffect } from 'react';
import Image from 'next/image';
import { formatEther } from 'viem';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/contracts/config';
import WeNadsComponentABI from '@/contracts/abis/WeNadsComponent.json';

interface TemplateDetailModalProps {
  template: {
    id: bigint;
    name: string;
    creator: string;
    maxSupply: bigint;
    currentSupply: bigint;
    price: bigint;
    image: string;
    isActive: boolean;
  };
  onClose: () => void;
}

const TemplateDetailModal: FC<TemplateDetailModalProps> = ({ template, onClose }) => {
  const { address } = useAccount();

  const { data: userTokenId } = useReadContract({
    address: CONTRACT_ADDRESSES.COMPONENT,
    abi: WeNadsComponentABI,
    functionName: 'getUserTemplateToken',
    args: [address, template.id],
    query: {
      enabled: !!address,
    }
  }) as { data: bigint | undefined };

  const hasTemplate = userTokenId && userTokenId > BigInt(0);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      {/* Overlay div only blocks scroll, not interactions */}
      <div 
        className="fixed inset-0 z-40 bg-transparent" 
        style={{ touchAction: 'none' }}
      />
      
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        style={{ touchAction: 'none' }}
      >
        <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 relative border-4 border-[#8B5CF6] shadow-[8px_8px_0px_0px_#5B21B6]">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-purple-400 hover:text-purple-600 text-xl font-bold z-10"
          >
            ×
          </button>
          
          <div className="space-y-6">
            {/* Image */}
            <div className="relative w-full max-w-[200px] mx-auto aspect-square bg-purple-50 rounded-lg overflow-hidden border-2 border-purple-200">
              <Image
                src={template.image}
                alt={template.name}
                fill
                className="object-contain p-4"
              />
            </div>

            {/* Info */}
            <div className="space-y-3">
              <h3 className="text-xl font-black text-purple-900">{template.name}</h3>
              
              <div className="space-y-2 text-sm">
                <div className="bg-purple-50 p-2 rounded-lg">
                  <div className="text-purple-600 font-bold">Creator</div>
                  <div className="text-purple-900 font-mono break-all">{template.creator}</div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <div className="text-purple-600 font-bold">Price</div>
                    <div className="text-purple-900">{formatEther(template.price)} MON</div>
                  </div>
                  
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <div className="text-purple-600 font-bold">Supply</div>
                    <div className="text-purple-900">
                      {template.currentSupply.toString()}/{template.maxSupply.toString()}
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 p-2 rounded-lg">
                    <div className="text-purple-600 font-bold">Status</div>
                    <div className={template.isActive ? "text-green-600" : "text-red-600"}>
                      {template.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>

                {/* Component Status */}
                <div className="bg-purple-50 p-2 rounded-lg">
                  <div className="text-purple-600 font-bold">Component Status</div>
                  <div className={hasTemplate ? "text-green-600" : "text-purple-900"}>
                    {hasTemplate ? "You have this component" : "You don't have this component"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TemplateDetailModal; 