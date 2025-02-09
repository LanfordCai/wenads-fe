"use client";

import { useEffect, useRef } from "react";
import {
  useConnectModal,
  useAccountModal,
} from "@rainbow-me/rainbowkit";
import { useAccount, useDisconnect } from "wagmi";

export const ConnectBtn = () => {
  const { isConnecting, address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openAccountModal } = useAccountModal();
  const { disconnect } = useDisconnect();

  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
  }, []);

  if (!isConnected) {
    return (
      <button
        className="px-4 py-1.5 md:px-6 md:py-2 bg-[#8B5CF6] text-white text-sm md:text-base font-bold rounded-xl border-4 border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6] transition-all"
        onClick={async () => {
          if (isConnected) {
            disconnect();
          }
          openConnectModal?.();
        }}
        disabled={isConnecting}
      >
        {isConnecting ? '🚀 LFG...' : '🚀 WAGMI'}
      </button>
    );
  }

  return (
    <button
      onClick={openAccountModal}
      className="px-4 py-1.5 md:px-6 md:py-2 bg-[#8B5CF6] text-white text-sm md:text-base font-bold rounded-xl border-4 border-[#7C3AED] shadow-[4px_4px_0px_0px_#5B21B6] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#5B21B6] transition-all"
    >
      <span className="font-mono">
        {address?.slice(0, 4)}...{address?.slice(-4)} 🐸
      </span>
    </button>
  );
};