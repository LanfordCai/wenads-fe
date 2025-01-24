export type ComponentCategory = 'background' | 'body' | 'eyes' | 'mouth' | 'hairstyle' | 'flower';

export interface ComponentInfo {
  id: string;
  image: string;
  name: string;
  price: bigint;
}

export interface WeNadsAvatar {
  backgroundId: bigint;
  headId: bigint;
  eyesId: bigint;
  mouthId: bigint;
  accessoryId: bigint;
  name: string;
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