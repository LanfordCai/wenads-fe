import { FC, useState, useRef } from 'react';
import { ComponentCategory } from '../types';
import { useComponentContract } from '../hooks/useComponentContract';
import { parseEther } from 'viem';
import { usePublicClient } from 'wagmi';
import { useNotification } from '../../contexts/NotificationContext';

// Remove body from visible categories since it's always selected
const categories: ComponentCategory[] = ['background', 'hairstyle', 'eyes', 'mouth', 'flower'];

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NewTemplateModal: FC<NewTemplateModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [name, setName] = useState('');
  const [maxSupply, setMaxSupply] = useState('');
  const [price, setPrice] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<ComponentCategory>('background');
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const publicClient = usePublicClient();
  const { showNotification } = useNotification();

  const { createTemplate } = useComponentContract(category);

  const checkAlphaChannel = (imgData: ImageData, requireAlpha: boolean) => {
    const data = imgData.data;
    let hasAlpha = false;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] !== 255) {
        hasAlpha = true;
        break;
      }
    }
    return requireAlpha ? hasAlpha : true;
  };

  const validateImage = (imgData: ImageData | null, selectedCategory: ComponentCategory) => {
    if (!imgData) return false;
    
    const requiresAlpha = selectedCategory !== 'background';
    const alphaValid = checkAlphaChannel(imgData, requiresAlpha);
    
    if (!alphaValid) {
      setError(requiresAlpha ? 'Image must have transparency (alpha channel)' : null);
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value as ComponentCategory;
    setCategory(newCategory);
    
    // Revalidate image if one is selected
    if (imageData) {
      validateImage(imageData, newCategory);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024) { // 10KB
      setError('Image size must be less than 10KB');
      return;
    }

    if (file.type !== 'image/png') {
      setError('Image must be in PNG format');
      return;
    }

    // Create a temporary URL for the image
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      // Create a canvas to check for alpha
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('Failed to process image');
        URL.revokeObjectURL(url);
        return;
      }

      // Draw the image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Get image data
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setImageData(imgData);

      URL.revokeObjectURL(url);
      
      if (validateImage(imgData, category)) {
        setSelectedImage(file);
      } else {
        setSelectedImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError('Failed to load image');
    };

    img.src = url;
  };

  const resetForm = () => {
    setName('');
    setMaxSupply('');
    setPrice('');
    setSelectedImage(null);
    setError(null);
    setCategory('background');
    setImageData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-purple-500');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-500');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-purple-500');
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = fileInputRef.current;
      if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        handleImageSelect({ target: { files: input.files } } as any);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedImage || !name || !maxSupply || !price) return;

    try {
      setIsCreating(true);
      setIsPending(false);
      setIsConfirmed(false);
      setError(null);

      // Convert image to base64
      const reader = new FileReader();
      reader.readAsDataURL(selectedImage);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        // Remove data:image/png;base64, prefix
        const imageData = base64Image.split(',')[1];

        try {
          const hash = await createTemplate({
            _name: name,
            _maxSupply: BigInt(maxSupply),
            _price: parseEther(price),
            _image: imageData,
            value: parseEther('0.02') // Creation fee
          });

          if (!publicClient) {
            throw new Error('Failed to get public client');
          }

          setIsPending(true);
          showNotification('Creating template...', 'info');

          // Wait for transaction confirmation
          await publicClient.waitForTransactionReceipt({ hash });
          
          setIsPending(false);
          setIsConfirmed(true);
          showNotification('Template created successfully!', 'success');

          // Close modal and refresh page after 2 seconds
          setTimeout(() => {
            handleClose();
            window.location.reload();
          }, 2000);
        } catch (err: any) {
          const errorMessage = err.message || 'Failed to create template';
          setError(errorMessage);
          showNotification(
            errorMessage.includes('rejected') ? 'Transaction rejected by user' : errorMessage,
            'error'
          );
          setIsCreating(false);
          setIsPending(false);
        }
      };

      reader.onerror = () => {
        const errorMessage = 'Failed to read image file';
        setError(errorMessage);
        showNotification(errorMessage, 'error');
        setIsCreating(false);
        setIsPending(false);
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create template';
      setError(errorMessage);
      showNotification(errorMessage, 'error');
      setIsCreating(false);
      setIsPending(false);
    }
  };

  const handleClose = () => {
    resetForm();
    setIsCreating(false);
    setIsPending(false);
    setIsConfirmed(false);
    onClose();
  };

  if (!isOpen) return null;

  const categoryToType: Record<ComponentCategory, number> = {
    background: 0,
    body: 0, // Not used
    hairstyle: 1,
    eyes: 2,
    mouth: 3,
    flower: 4
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-purple-600">New Template</h2>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="mb-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h3 className="font-medium text-purple-900 mb-2">Template Creation Rules:</h3>
          <ul className="space-y-1 text-sm text-purple-700">
            <li>• Creation fee: 0.02 MON</li>
            <li>• When others use your template:</li>
            <li className="pl-4">- 80% of the payment goes to you (creator)</li>
            <li className="pl-4">- 20% goes to the WeNads team</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Max Supply</label>
            <input
              type="number"
              value={maxSupply}
              onChange={(e) => setMaxSupply(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-purple-500"
              required
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Price (MON)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-purple-500"
              required
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Component Type</label>
            <select
              value={category}
              onChange={handleCategoryChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'hairstyle' ? 'Hair' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Image {category === 'background' ? '(max 10KB, PNG)' : '(max 10KB, PNG with transparency)'}
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageSelect}
              accept="image/png"
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-purple-500 transition-colors"
            >
              <div className="space-y-1 text-center">
                {selectedImage ? (
                  <p className="text-sm text-gray-600">
                    Selected: {selectedImage.name}
                  </p>
                ) : (
                  <>
                    <div className="text-purple-600">
                      <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-600">Click or drag image here</p>
                  </>
                )}
              </div>
            </div>
            {error && (
              <p className="mt-1 text-sm text-red-500">{error}</p>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating || isPending || isConfirmed || !selectedImage || !name || !maxSupply || !price || !!error}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed"
            >
              {isConfirmed ? 'Created!' : isPending ? 'Creating...' : 'Create Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTemplateModal; 