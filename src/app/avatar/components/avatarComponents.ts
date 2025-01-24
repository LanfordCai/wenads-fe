import { AvatarComponent, ComponentCategory } from '../types';

// Background
const backgrounds: AvatarComponent[] = [
  {
    id: 'background-1',
    category: 'background',
    imageUrl: '/avatars/background/background-1.png',
    price: 20, // 0.20 MON
  },
];

// Body shapes
const bodies: AvatarComponent[] = [
  {
    id: 'body-1',
    category: 'body',
    imageUrl: '/avatars/body/body-1.png',
    price: 20, // 0.20 MON
  },
];

// Eyes
const eyes: AvatarComponent[] = Array.from({ length: 8 }, (_, i) => ({
  id: `eyes-${i + 1}`,
  category: 'eyes',
  imageUrl: `/avatars/eyes/eyes-${i + 1}.png`,
  price: 20 + (i * 5), // 20, 25, 30, 35, 40, 45, 50, 55 (0.20-0.55 MON)
}));

// Mouths
const mouths: AvatarComponent[] = Array.from({ length: 6 }, (_, i) => ({
  id: `mouth-${i + 1}`,
  category: 'mouth',
  imageUrl: `/avatars/mouth/mouth-${i + 1}.png`,
  price: 15 + (i * 5), // 15, 20, 25, 30, 35, 40 (0.15-0.40 MON)
}));

// Hairstyles
const hairstyles: AvatarComponent[] = Array.from({ length: 6 }, (_, i) => ({
  id: `hairstyle-${i + 1}`,
  category: 'hairstyle',
  imageUrl: `/avatars/hairstyle/hairstyle-${i + 1}.png`,
  price: 30 + (i * 10), // 30, 40, 50, 60, 70, 80 (0.30-0.80 MON)
}));

// Flowers
const flower: AvatarComponent[] = Array.from({ length: 6 }, (_, i) => ({
  id: `flowers-${i + 1}`,
  category: 'flower',
  imageUrl: `/avatars/flowers/flowers-${i + 1}.png`,
  price: 25 + (i * 8), // 25, 33, 41, 49, 57, 65 (0.25-0.65 MON)
}));

export const componentsByCategory: Record<ComponentCategory, AvatarComponent[]> = {
  background: backgrounds,
  body: bodies,
  eyes,
  mouth: mouths,
  hairstyle: hairstyles,
  flower,
}; 