"use client";

import { useWallet, shortenAddress, getChainName, CHAINS } from "@/lib/web3";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import * as api from "@/lib/api";

export function WalletButton() {
  const {
    address,
    chainId,
    isConnecting,
    error,
    errorNeedsReload,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchChain,
  } = useWallet();

  const [showChains, setShowChains] = useState(false);

  // Auto-save wallet address to backend profile on connect/disconnect
  const handleConnect = async () => {
    await connectWallet();
    // After connection completes, read the fresh address directly from window.ethereum
    // (React state in the closure would still be stale at this point)
    setTimeout(async () => {
      try {
        const token = localStorage.getItem("securithm_token");
        if (token && window.ethereum) {
          api.setAuthToken(token);
          const accounts = (await window.ethereum.request({
            method: "eth_accounts",
          })) as string[];
          const currentAddress = accounts[0] || null;
          const me = await api.getMe();
          if (me.wallet_address !== currentAddress) {
            await api.updateMe({ wallet_address: currentAddress });
          }
        }
      } catch {
        // Silent — wallet connect worked even if save didn't
      }
    }, 500);
  };

  const handleDisconnect = async () => {
    // Clear wallet address from profile
    try {
      const token = localStorage.getItem("securithm_token");
      if (token) {
        api.setAuthToken(token);
        await api.updateMe({ wallet_address: null });
      }
    } catch {
      // Silent
    }
    disconnectWallet();
  };

  if (!isMetaMaskInstalled) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 border border-[var(--color-term-border)] text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] px-2 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 35 33" fill="none">
          <path d="M32.958 1L19.826 10.282L22.238 5.046L32.958 1Z" fill="#E17726" stroke="#E17726"/>
          <path d="M2.042 1L15.052 10.375L12.762 5.046L2.042 1Z" fill="#E27625" stroke="#E27625"/>
          <path d="M28.22 23.486L24.748 28.492L32.228 30.65L34.352 23.612L28.22 23.486Z" fill="#E27625" stroke="#E27625"/>
          <path d="M0.648 23.612L2.748 30.65L10.228 28.492L6.756 23.486L0.648 23.612Z" fill="#E27625" stroke="#E27625"/>
          <path d="M9.816 14.588L7.716 17.782L15.14 18.158L14.888 10.258L9.816 14.588Z" fill="#E27625" stroke="#E27625"/>
          <path d="M25.184 14.588L20.038 10.166L19.86 18.158L27.284 17.782L25.184 14.588Z" fill="#E27625" stroke="#E27625"/>
          <path d="M10.228 28.492L14.72 26.348L10.818 23.322L10.228 28.492Z" fill="#E27625" stroke="#E27625"/>
          <path d="M20.28 26.348L24.748 28.492L24.182 23.322L20.28 26.348Z" fill="#E27625" stroke="#E27625"/>
          <path d="M24.748 28.492L20.28 26.348L20.648 29.26L20.62 30.594L24.748 28.492Z" fill="#D7BFE0" stroke="#D7BFE0"/>
          <path d="M10.228 28.492L14.38 30.594L14.374 29.26L14.72 26.348L10.228 28.492Z" fill="#D7BFE0" stroke="#D7BFE0"/>
        </svg>
        [ INSTALL METAMASK ]
      </a>
    );
  }

  if (!address) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px] h-7"
            onClick={handleConnect}
            disabled={isConnecting}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 35 33" fill="none">
              <path d="M32.958 1L19.826 10.282L22.238 5.046L32.958 1Z" fill="#E17726" stroke="#E17726"/>
              <path d="M2.042 1L15.052 10.375L12.762 5.046L2.042 1Z" fill="#E27625" stroke="#E27625"/>
              <path d="M28.22 23.486L24.748 28.492L32.228 30.65L34.352 23.612L28.22 23.486Z" fill="#E27625" stroke="#E27625"/>
              <path d="M0.648 23.612L2.748 30.65L10.228 28.492L6.756 23.486L0.648 23.612Z" fill="#E27625" stroke="#E27625"/>
              <path d="M9.816 14.588L7.716 17.782L15.14 18.158L14.888 10.258L9.816 14.588Z" fill="#E27625" stroke="#E27625"/>
              <path d="M25.184 14.588L20.038 10.166L19.86 18.158L27.284 17.782L25.184 14.588Z" fill="#E27625" stroke="#E27625"/>
              <path d="M10.228 28.492L14.72 26.348L10.818 23.322L10.228 28.492Z" fill="#E27625" stroke="#E27625"/>
              <path d="M20.28 26.348L24.748 28.492L24.182 23.322L20.28 26.348Z" fill="#E27625" stroke="#E27625"/>
              <path d="M24.748 28.492L20.28 26.348L20.648 29.26L20.62 30.594L24.748 28.492Z" fill="#D7BFE0" stroke="#D7BFE0"/>
              <path d="M10.228 28.492L14.38 30.594L14.374 29.26L14.72 26.348L10.228 28.492Z" fill="#D7BFE0" stroke="#D7BFE0"/>
            </svg>
            {isConnecting ? "CONNECTING..." : "[ CONNECT WALLET ]"}
          </Button>
        </div>
        {error && (
          <div className="border border-[var(--color-term-error)] bg-[var(--color-term-dim)] p-2 max-w-[320px]">
            <div className="flex items-start gap-1.5">
              <span className="text-[var(--color-term-error)] text-[10px] font-mono shrink-0 mt-0.5">⚠</span>
              <div className="min-w-0">
                <p className="text-[10px] text-[var(--color-term-error)] font-mono leading-snug">
                  [META_ERR] {error}
                </p>
                {errorNeedsReload && (
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-1 text-[9px] font-mono text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] underline underline-offset-2 transition-colors"
                  >
                    ↻ RELOAD PAGE
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-1.5 border border-[var(--color-term-border)] px-2 py-1">
        {/* Chain indicator */}
        <button
          onClick={() => setShowChains(!showChains)}
          className="relative"
          title={getChainName(chainId)}
        >
          <span className="h-1.5 w-1.5 block bg-[var(--color-term-fg)]" />
        </button>
        <span className="text-[10px] font-mono text-[var(--color-term-fg)]">
          {shortenAddress(address)}
        </span>
        <span className="text-[8px] font-mono text-[var(--color-term-muted)]">
          [{getChainName(chainId)}]
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="text-[9px] h-7 text-[var(--color-term-muted)] hover:text-[var(--color-term-error)]"
        onClick={handleDisconnect}
      >
        [ X ]
      </Button>

      {/* Chain switcher dropdown */}
      {showChains && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowChains(false)} />
          <div className="absolute top-full right-0 mt-1 z-50 border border-[var(--color-term-border)] bg-[var(--color-term-bg)] shadow-xl">
            <div className="p-1 space-y-0.5 min-w-[140px]">
              {Object.entries(CHAINS).map(([name, hex]) => (
                <button
                  key={name}
                  className="w-full text-left px-2 py-1 text-[10px] font-mono text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)] uppercase tracking-wider"
                  onClick={() => {
                    switchChain(hex);
                    setShowChains(false);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {error && (
        <span className="text-[9px] text-[var(--color-term-error)] font-mono ml-1 max-w-[180px] leading-tight">
          [!] {error}
        </span>
      )}
    </div>
  );
}
