"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Upload, Github, Globe, Terminal } from "lucide-react";

const SAMPLE_CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VulnerableVault {
    mapping(address => uint256) public balances;
    address public owner;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 _amount) public {
        require(balances[msg.sender] >= _amount);
        (bool success, ) = msg.sender.call{value: _amount}("");
        require(success);
        balances[msg.sender] -= _amount;
    }

    function transfer(address _to, uint256 _amount) public {
        balances[msg.sender] -= _amount;
        balances[_to] += _amount;
    }
}`;

interface ScanInputProps {
  onScan?: (code: string, chain: string) => void;
  variant?: "hero" | "inline";
}

export function ScanInput({ onScan, variant = "hero" }: ScanInputProps) {
  const [code, setCode] = useState("");
  const [chain, setChain] = useState("ethereum");
  const [inputMode, setInputMode] = useState<"code" | "address" | "github">(
    "code"
  );
  const [loading, setLoading] = useState(false);

  const handleScan = () => {
    if (!code.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onScan?.(code, chain);
    }, 2000);
  };

  const isHero = variant === "hero";

  return (
    <div
      className={`w-full ${
        isHero
          ? "rounded-2xl border border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-900 shadow-xl"
          : ""
      }`}
    >
      {isHero && (
        <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-surface-200 dark:border-surface-700">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500" />
            <div className="h-3 w-3 rounded-full bg-yellow-500" />
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <span className="ml-3 text-xs font-mono text-surface-400">
            scan.input — AuditAI Analysis
          </span>
        </div>
      )}

      <div className={isHero ? "p-4 space-y-4" : "space-y-4"}>
        {/* Input mode tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-surface-100 dark:bg-surface-800 w-fit">
          <button
            onClick={() => setInputMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              inputMode === "code"
                ? "bg-white dark:bg-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Paste Code
          </button>
          <button
            onClick={() => setInputMode("address")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              inputMode === "address"
                ? "bg-white dark:bg-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Contract Address
          </button>
          <button
            onClick={() => setInputMode("github")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              inputMode === "github"
                ? "bg-white dark:bg-surface-900 shadow-sm"
                : "text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
            }`}
          >
            <Github className="h-3.5 w-3.5" />
            GitHub URL
          </button>
        </div>

        {/* Input area */}
        {inputMode === "code" && (
          <div className="relative">
            <Textarea
              placeholder="Paste your Solidity or Rust contract here..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[220px] font-mono text-sm bg-surface-50 dark:bg-surface-950/50 border-surface-200 dark:border-surface-700"
            />
            {!code && (
              <button
                onClick={() => setCode(SAMPLE_CONTRACT)}
                className="absolute bottom-3 right-3 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium bg-white dark:bg-surface-800 px-2.5 py-1 rounded-md border border-surface-200 dark:border-surface-700 shadow-sm transition-colors"
              >
                Try sample contract
              </button>
            )}
          </div>
        )}

        {inputMode === "address" && (
          <div className="relative">
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
                  <input
                    type="text"
                    placeholder="0x..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-950/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {inputMode === "github" && (
          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-400" />
            <input
              type="text"
              placeholder="https://github.com/owner/repo/tree/main/contracts"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-11 pl-10 pr-3 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-950/50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        {/* Chain selector and scan button */}
        <div className="flex items-center justify-between">
          {inputMode === "code" && (
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="arbitrum">Arbitrum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
              </SelectContent>
            </Select>
          )}
          {inputMode !== "address" && <div />}

          <Button
            onClick={handleScan}
            disabled={!code.trim() || loading}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Scanning...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Scan Contract
              </>
            )}
          </Button>
        </div>

        {/* Upload option */}
        {inputMode === "code" && (
          <div className="flex items-center gap-2 text-xs text-surface-400">
            <Upload className="h-3.5 w-3.5" />
            <span>
              Or drag & drop .sol / .rs files here —{" "}
              <button className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium">
                browse files
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
