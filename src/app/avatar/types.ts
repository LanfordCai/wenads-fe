export type ComponentCategory = 'background' | 'body' | 'eyes' | 'mouth' | 'hairstyle' | 'flower';

export interface AvatarComponent {
  id: string;
  category: ComponentCategory;
  imageUrl: string;
  price: number;
}

export interface AvatarState {
  background?: string;
  body?: string;
  eyes?: string;
  mouth?: string;
  hairstyle?: string;
  flower?: string;
}

export interface AvatarSelection {
  category: ComponentCategory;
  componentId: string;
} 