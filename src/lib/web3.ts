"use client";

import { useState, useEffect, useCallback } from "react";

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnecting: boolean;
  error: string | null;
  errorNeedsReload: boolean;
}

export type WalletEventCallback = (address: string | null) => void;

const walletListeners = new Set<WalletEventCallback>();

export function notifyWalletListeners(address: string | null) {
  walletListeners.forEach((cb) => cb(address));
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
    errorNeedsReload: false,
  });

  const isMetaMaskInstalled = typeof window !== "undefined" && !!window.ethereum?.isMetaMask;

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      setWallet((prev) => ({
        ...prev,
        error: "MetaMask is not installed. Install it from https://metamask.io",
      }));
      return;
    }

    setWallet((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Race the MetaMask request against a 30-second timeout.
      // MetaMask can hang indefinitely if the popup is blocked, the extension is
      // in a bad state, or there's a pending request that was abandoned.
      let timeoutId: ReturnType<typeof setTimeout>;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("CONNECTION_TIMEOUT")),
          30000,
        );
      });

      try {
        const accounts = (await Promise.race([
          window.ethereum.request({
            method: "eth_requestAccounts",
          }) as Promise<string[]>,
          timeoutPromise,
        ])) as string[];

      // Handle case where MetaMask returns empty array (e.g., locked, no accounts)
      if (accounts.length === 0) {
        setWallet((prev) => ({
          ...prev,
          isConnecting: false,
          error: "No accounts found. Make sure MetaMask is unlocked.",
        }));
        return;
      }

      const chainId = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

        clearTimeout(timeoutId!);

        setWallet({
          address: accounts[0],
          chainId,
          isConnecting: false,
          error: null,
          errorNeedsReload: false,
        });
        notifyWalletListeners(accounts[0]);
      } finally {
        clearTimeout(timeoutId!);
      }
    } catch (e: unknown) {
      let message = "Failed to connect to MetaMask";
      let needsReload = false;

      // Handle both Error objects and MetaMask's non-standard error objects
      if (e instanceof Error) {
        const msg = e.message.toLowerCase();

        if (msg === "connection_timeout") {
          message =
            "MetaMask did not respond within 30s. Open the extension and check for a pending request, then reload and try again.";
          needsReload = true;
        } else if (msg.includes("already processing") || msg.includes("already pending")) {
          message =
            "A previous MetaMask request is still pending. Open the MetaMask extension, cancel any pending request, then reload the page.";
          needsReload = true;
        } else if (msg.includes("user rejected") || msg.includes("denied") || msg.includes("rejected")) {
          message = "Connection rejected. Click CONNECT WALLET to try again.";
        } else if (msg.includes("locked")) {
          message = "MetaMask is locked. Open the extension and unlock it first, then reload and try again.";
          needsReload = true;
        } else if (msg.includes("not found") || msg.includes("not available")) {
          message = "MetaMask extension error. Try reloading the page.";
          needsReload = true;
        } else if (msg.includes("parse")) {
          message = "MetaMask connection error. Try reloading the page.";
          needsReload = true;
        } else if (msg.includes("timeout")) {
          message =
            "MetaMask did not respond within 30s. Open the extension and check for a pending request, then reload and try again.";
          needsReload = true;
        } else {
          message = e.message;
        }
      } else if (typeof e === "object" && e !== null) {
        // MetaMask sometimes throws plain objects with a message property
        const obj = e as Record<string, unknown>;
        if (typeof obj.message === "string") {
          const msg = obj.message.toLowerCase();
          if (msg.includes("user rejected") || msg.includes("denied") || msg.includes("rejected")) {
            message = "Connection rejected. Click CONNECT WALLET to try again.";
          } else if (msg.includes("locked")) {
            message = "MetaMask is locked. Open the extension and unlock it first, then reload and try again.";
            needsReload = true;
          } else if (typeof obj.code === "number") {
            // EIP-1193 error codes
            if (obj.code === 4001) {
              message = "Connection rejected. Click CONNECT WALLET to try again.";
            } else if (obj.code === -32002) {
              message =
                "A previous MetaMask request is still pending. Open the extension, cancel it, then reload the page.";
              needsReload = true;
            } else if (obj.code === -32603) {
              // MetaMask sometimes wraps "already processing" inside -32603 with data.message
              const data = obj.data as Record<string, unknown> | undefined;
              const dataMsg =
                typeof data?.message === "string"
                  ? data.message.toLowerCase()
                  : "";
              if (
                dataMsg.includes("already processing") ||
                dataMsg.includes("already pending")
              ) {
                message =
                  "A previous MetaMask request is still pending. Open the extension, cancel it, then reload the page.";
                needsReload = true;
              } else {
                message = "MetaMask internal error. Try reloading the page.";
                needsReload = true;
              }
            } else {
              message = String(obj.message || "") || `MetaMask error (code: ${obj.code}). Try reloading the page.`;
              needsReload = true;
            }
          }
        } else if (typeof obj.code === "number") {
          message = `MetaMask error (code: ${obj.code}). Open the extension and reload the page.`;
          needsReload = true;
        }
      } else {
        // MetaMask threw a non-object (string, undefined, etc.)
        message = "MetaMask connection failed unexpectedly. Try reloading the page.";
        needsReload = true;
      }

      setWallet((prev) => ({
        ...prev,
        isConnecting: false,
        error: message,
        errorNeedsReload: needsReload,
      }));
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWallet({
      address: null,
      chainId: null,
      isConnecting: false,
      error: null,
      errorNeedsReload: false,
    });
    notifyWalletListeners(null);
  }, []);

  const switchChain = useCallback(async (chainIdHex: string) => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: chainIdHex }],
      });
    } catch {
      // Chain not added, try to add it
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{ chainId: chainIdHex }],
        });
      } catch {
        // User rejected
      }
    }
  }, []);

  // Listen for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length === 0) {
        disconnectWallet();
      } else {
        setWallet((prev) => ({ ...prev, address: accs[0] }));
        notifyWalletListeners(accs[0]);
      }
    };

    const handleChainChanged = (chainId: unknown) => {
      setWallet((prev) => ({ ...prev, chainId: chainId as string }));
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    window.ethereum.on("disconnect", handleDisconnect);

    // Check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        const accs = accounts as string[];
        if (accs.length > 0) {
          setWallet((prev) => ({ ...prev, address: accs[0] }));
        }
      })
      .catch(() => {});

    // Check chain
    window.ethereum
      .request({ method: "eth_chainId" })
      .then((chainId) => {
        setWallet((prev) => ({ ...prev, chainId: chainId as string }));
      })
      .catch(() => {});

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
      window.ethereum?.removeListener("disconnect", handleDisconnect);
    };
  }, [disconnectWallet]);

  return {
    ...wallet,
    isMetaMaskInstalled,
    connectWallet,
    disconnectWallet,
    switchChain,
  };
}

// ─── Chain name helper ──────────────────────────────────

const CHAIN_NAMES: Record<string, string> = {
  "0x1": "Ethereum Mainnet",
  "0x5": "Goerli Testnet",
  "0xaa36a7": "Sepolia Testnet",
  "0x89": "Polygon Mainnet",
  "0x13881": "Mumbai Testnet",
  "0xa4b1": "Arbitrum One",
  "0x2105": "Base Mainnet",
  "0x38": "BSC Mainnet",
  "0x61": "BSC Testnet",
};

export function getChainName(chainId: string | null): string {
  if (!chainId) return "Unknown";
  return CHAIN_NAMES[chainId.toLowerCase()] || `Chain ${parseInt(chainId, 16)}`;
}

export function shortenAddress(address: string | null): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// ─── Chain hex values for common chains ─────────────────

export const CHAINS = {
  ethereum: "0x1",
  sepolia: "0xaa36a7",
  polygon: "0x89",
  arbitrum: "0xa4b1",
  base: "0x2105",
  bsc: "0x38",
} as const;
