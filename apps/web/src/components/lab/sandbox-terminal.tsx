"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Terminal, Square, Send } from "lucide-react";

interface SandboxTerminalProps {
  sessionId: string;
  sandboxId: string;
  onClose?: () => void;
}

interface OutputLine {
  type: "stdout" | "stderr" | "system" | "input";
  text: string;
}

export function SandboxTerminal({
  sessionId,
  sandboxId,
  onClose,
}: SandboxTerminalProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<OutputLine[]>([
    {
      type: "system",
      text: `🟢 Connected to sandbox ${sandboxId.slice(0, 8)}...`,
    },
    { type: "system", text: "Type a command and press Enter to execute." },
  ]);
  const [running, setRunning] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const runCommand = useCallback(
    async (cmd: string) => {
      if (!cmd.trim() || running) return;

      setOutput((prev) => [...prev, { type: "input", text: `$ ${cmd}` }]);
      setInput("");
      setRunning(true);

      try {
        const res = await fetch("/api/sandbox/exec", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, command: cmd }),
        });

        const data = await res.json();

        if (data.error) {
          setOutput((prev) => [
            ...prev,
            { type: "stderr", text: `Error: ${data.error}` },
          ]);
        } else {
          if (data.stdout) {
            setOutput((prev) => [
              ...prev,
              { type: "stdout", text: data.stdout },
            ]);
          }
          if (data.stderr) {
            setOutput((prev) => [
              ...prev,
              { type: "stderr", text: data.stderr },
            ]);
          }
          if (data.exitCode !== 0) {
            setOutput((prev) => [
              ...prev,
              {
                type: "system",
                text: `⚠ Exit code: ${data.exitCode}`,
              },
            ]);
          }
        }
      } catch {
        setOutput((prev) => [
          ...prev,
          { type: "stderr", text: "Failed to execute command" },
        ]);
      } finally {
        setRunning(false);
        inputRef.current?.focus();
      }
    },
    [sessionId, running]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runCommand(input);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border bg-[#0b1120]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-900 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
          <span className="ml-2 text-xs text-slate-400">
            <Terminal className="mr-1 inline h-3 w-3" />
            lab — {sandboxId.slice(0, 12)}
          </span>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 px-2 text-xs text-slate-400 hover:text-white"
          >
            <Square className="mr-1 h-3 w-3" />
            Stop Lab
          </Button>
        )}
      </div>

      {/* Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm leading-relaxed"
      >
        {output.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap ${
              line.type === "stderr"
                ? "text-red-400"
                : line.type === "system"
                  ? "text-cyan-400"
                  : line.type === "input"
                    ? "text-green-400"
                    : "text-slate-300"
            }`}
          >
            {line.text}
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 border-t border-slate-700 bg-slate-900 px-4 py-2">
        <span className="text-green-400 font-mono text-sm">$</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a command..."
          disabled={running}
          autoFocus
          className="flex-1 bg-transparent font-mono text-sm text-slate-200 outline-none placeholder:text-slate-600"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => runCommand(input)}
          disabled={running || !input.trim()}
          className="h-7 px-2 text-slate-400 hover:text-white"
        >
          <Send className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
