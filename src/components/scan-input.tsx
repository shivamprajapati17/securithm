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
          ? "border border-[var(--color-term-border)] bg-[var(--color-term-bg)]"
          : ""
      }`}
    >
      {isHero && (
        <div className="flex items-center gap-1 px-4 py-1.5 border-b border-[var(--color-term-border)] bg-[var(--color-term-dim)]">
          <div className="flex gap-1.5">
            <span className="text-[9px] text-[var(--color-term-error)]">●</span>
            <span className="text-[9px] text-[var(--color-term-warning)]">●</span>
            <span className="text-[9px] text-[var(--color-term-fg)]">●</span>
          </div>
          <span className="ml-2 text-[10px] font-mono text-[var(--color-term-muted)] uppercase tracking-wider">
            scan input — SECURITHM ANALYSIS
          </span>
        </div>
      )}

      <div className={isHero ? "p-4 space-y-4" : "space-y-4"}>
        {/* Input mode tabs */}
        <div className="flex gap-0 border border-[var(--color-term-border)] w-fit">
          <button
            onClick={() => setInputMode("code")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors ${
              inputMode === "code"
                ? "bg-[var(--color-term-fg)] text-[var(--color-term-bg)]"
                : "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)]"
            }`}
          >
            <Terminal className="h-3 w-3" />
            CODE
          </button>
          <button
            onClick={() => setInputMode("address")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors border-l border-[var(--color-term-border)] ${
              inputMode === "address"
                ? "bg-[var(--color-term-fg)] text-[var(--color-term-bg)]"
                : "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)]"
            }`}
          >
            <Globe className="h-3 w-3" />
            ADDRESS
          </button>
          <button
            onClick={() => setInputMode("github")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider transition-colors border-l border-[var(--color-term-border)] ${
              inputMode === "github"
                ? "bg-[var(--color-term-fg)] text-[var(--color-term-bg)]"
                : "text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] hover:bg-[var(--color-term-dim)]"
            }`}
          >
            <Github className="h-3 w-3" />
            GITHUB
          </button>
        </div>

        {/* Input area */}
        {inputMode === "code" && (
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] text-[var(--color-term-muted)] font-mono">cat contract.sol</span>
              <span className="animate-blink text-[var(--color-term-fg)]">▌</span>
            </div>
            <Textarea
              placeholder="PASTE YOUR SOLIDITY OR RUST CONTRACT HERE..."
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="min-h-[200px] text-xs"
            />
            {!code && (
              <button
                onClick={() => setCode(SAMPLE_CONTRACT)}
                className="absolute bottom-2 right-2 text-[10px] text-[var(--color-term-muted)] hover:text-[var(--color-term-fg)] bg-[var(--color-term-bg)] px-2 py-1 border border-[var(--color-term-border)] font-mono uppercase tracking-wider"
              >
                load sample
              </button>
            )}
          </div>
        )}

        {inputMode === "address" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--color-term-muted)] font-mono">resolve</span>
              <span className="animate-blink text-[var(--color-term-fg)]">▌</span>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-2">
                <span className="text-[var(--color-term-muted)] text-xs mr-2">&gt;</span>
                <input
                  type="text"
                  placeholder="0x..."
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-sm py-2 placeholder:text-[var(--color-term-muted)]"
                />
              </div>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="CHAIN" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">ETHEREUM</SelectItem>
                  <SelectItem value="base">BASE</SelectItem>
                  <SelectItem value="arbitrum">ARBITRUM</SelectItem>
                  <SelectItem value="polygon">POLYGON</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                  <SelectItem value="solana">SOLANA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {inputMode === "github" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--color-term-muted)] font-mono">git clone</span>
              <span className="animate-blink text-[var(--color-term-fg)]">▌</span>
            </div>
            <div className="flex items-center border border-[var(--color-term-border)] bg-[var(--color-term-bg)] px-2">
              <span className="text-[var(--color-term-muted)] text-xs mr-2">$</span>
              <input
                type="text"
                placeholder="https://github.com/owner/repo/tree/main/contracts"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[var(--color-term-fg)] font-mono text-sm py-2 placeholder:text-[var(--color-term-muted)]"
              />
            </div>
          </div>
        )}

        {/* Chain selector and scan button */}
        <div className="flex items-center justify-between">
          {inputMode === "code" && (
            <Select value={chain} onValueChange={setChain}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="CHAIN" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ethereum">ETHEREUM</SelectItem>
                <SelectItem value="base">BASE</SelectItem>
                <SelectItem value="arbitrum">ARBITRUM</SelectItem>
                <SelectItem value="polygon">POLYGON</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
                <SelectItem value="solana">SOLANA</SelectItem>
              </SelectContent>
            </Select>
          )}
          {inputMode !== "address" && <div />}

          <Button
            onClick={handleScan}
            disabled={!code.trim() || loading}
            size="default"
            className="gap-2"
          >
            {loading ? (
              <>
                <span className="animate-blink">▶</span>
                SCANNING...
              </>
            ) : (
              <>
                <Shield className="h-3.5 w-3.5" />
                SCAN CONTRACT
              </>
            )}
          </Button>
        </div>

        {/* Upload option */}
        {inputMode === "code" && (
          <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-term-muted)]">
            <Upload className="h-3 w-3" />
            <span>
              DRAG DROP .SOL / .RS FILES —{" "}
              <button className="text-[var(--color-term-fg)] hover:underline font-medium">
                BROWSE
              </button>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
