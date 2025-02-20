'use client';

import { http, createStorage, cookieStorage } from 'wagmi';
import { Chain, getDefaultConfig } from '@rainbow-me/rainbowkit';

const projectId = "921cf368c71f05173975042277cba39f";

export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'Testnet Monad',
    symbol: 'TMON',
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_TESTNET_RPC_URL as string],
    },
    public: {
      http: [process.env.NEXT_PUBLIC_TESTNET_RPC_URL as string],
    },
  },
  blockExplorers: {
    default: {
      name: 'Monad Explorer',
      url: 'https://monad-testnet.socialscan.io/'
    },
  },
} as const satisfies Chain;

export const hardhatLocal = {
  id: 31337,
  name: 'Hardhat Local',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8545'],
    },
    public: {
      http: ['http://127.0.0.1:8545'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Hardhat Local Explorer',
      url: 'http://localhost:8545',
    },
  },
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: "WalletConnection",
  projectId,
  chains: [monadTestnet],
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
  transports: {
    [monadTestnet.id]: http(process.env.NEXT_PUBLIC_TESTNET_RPC_URL)
  }
});