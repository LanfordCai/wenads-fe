export type ComponentCategory = 'background' | 'body' | 'eyes' | 'mouth' | 'hairstyle' | 'flower';

export interface ComponentInfo {
  id: string;
  image: string;
  name: string;
  price: bigint;
}

export interface AvatarComponent {
  id: string;
  category: ComponentCategory;
  imageUrl: string;
  price: number;
}

export interface AvatarState {
  background?: ComponentInfo;
  body?: ComponentInfo;
  eyes?: ComponentInfo;
  mouth?: ComponentInfo;
  hairstyle?: ComponentInfo;
  flower?: ComponentInfo;
}

export interface AvatarSelection {
  category: ComponentCategory;
  componentId: string;
} 