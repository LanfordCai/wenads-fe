import { FC, useEffect, useState } from 'react';

interface NameEditModalProps {
  onClose: () => void;
  onSave: (name: string) => void;
  currentName: string;
}

const NameEditModal: FC<NameEditModalProps> = ({ onClose, onSave, currentName }) => {
  const [name, setName] = useState(currentName);

  // Block body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.pointerEvents = 'none';
    
    // Only allow pointer events on modal
    const modal = document.getElementById('name-edit-modal');
    if (modal) {
      modal.style.pointerEvents = 'auto';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.pointerEvents = 'auto';
    };
  }, []);

  return (
    <>
      {/* Transparent overlay to block events */}
      <div 
        className="fixed inset-0 z-[998] bg-transparent" 
        style={{ 
          pointerEvents: 'all',
          touchAction: 'none',
          userSelect: 'none',
        }} 
      />
      
      {/* Modal backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]" 
        onClick={onClose}
      >
        {/* Modal content */}
        <div 
          id="name-edit-modal"
          className="w-full max-w-md bg-white rounded-xl p-6 relative border-4 border-[#8B5CF6] shadow-[8px_8px_0px_0px_#5B21B6] m-4"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-purple-400 hover:text-purple-600 text-xl font-bold"
          >
            ×
          </button>
          
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-800">Edit Avatar Name</h2>
            
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter new name"
              className="w-full px-4 py-2 rounded-lg border-2 border-purple-200 focus:border-purple-400 outline-none"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => onSave(name)}
                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NameEditModal; 