'use client';

import { http, createStorage, cookieStorage } from 'wagmi';
import { Chain, getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = "921cf368c71f05173975042277cba39f";

export const monadDevnet = {
  id: 20143,
  name: 'Monad Devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Devnet Monad',
    symbol: 'DMON',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a'],
    },
    public: {
      http: ['https://rpc-devnet.monadinfra.com/rpc/3fe540e310bbb6ef0b9f16cd23073b0a'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://explorer.monad-devnet.devnet101.com/',
      apiUrl: 'https://explorer.monad-devnet.devnet101.com/api',
    },
  },
} as const satisfies Chain;

const supportedChains: Chain[] = [monadDevnet];

export const config = getDefaultConfig({
  appName: "WalletConnection",
  projectId,
  chains: supportedChains as any,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: supportedChains.reduce((obj, chain) => ({ ...obj, [chain.id]: http() }), {})
});