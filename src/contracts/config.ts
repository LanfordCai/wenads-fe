export const CONTRACT_ADDRESSES = {
  AVATAR: process.env.NEXT_PUBLIC_AVATAR_CONTRACT as `0x${string}`,
  COMPONENT: process.env.NEXT_PUBLIC_COMPONENT_CONTRACT as `0x${string}`
};

export const IS_DEVELOPMENT = process.env.NEXT_PUBLIC_ENV === 'development'; 