"use client";

import { useEffect, useRef, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { cn } from "@/lib/utils";
import "@xterm/xterm/css/xterm.css";

interface TerminalViewProps {
  websocketUrl: string;
  className?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function TerminalView({
  websocketUrl,
  className,
  onConnectionChange,
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const connect = useCallback(() => {
    if (!containerRef.current) return;

    // Create terminal
    const terminal = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      theme: {
        background: "#1a1b26",
        foreground: "#c0caf5",
        cursor: "#c0caf5",
        selectionBackground: "#33467C",
        black: "#15161E",
        red: "#f7768e",
        green: "#9ece6a",
        yellow: "#e0af68",
        blue: "#7aa2f7",
        magenta: "#bb9af7",
        cyan: "#7dcfff",
        white: "#a9b1d6",
        brightBlack: "#414868",
        brightRed: "#f7768e",
        brightGreen: "#9ece6a",
        brightYellow: "#e0af68",
        brightBlue: "#7aa2f7",
        brightMagenta: "#bb9af7",
        brightCyan: "#7dcfff",
        brightWhite: "#c0caf5",
      },
      scrollback: 5000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    terminal.writeln("\x1b[33mConnecting to lab environment...\x1b[0m");

    // Connect WebSocket
    const ws = new WebSocket(websocketUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      terminal.writeln("\x1b[32mConnected!\x1b[0m\r\n");
      onConnectionChange?.(true);

      // Send initial resize
      ws.send(
        JSON.stringify({
          type: "resize",
          cols: terminal.cols,
          rows: terminal.rows,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "output":
            terminal.write(message.data);
            break;
          case "exit":
            terminal.writeln(
              `\r\n\x1b[33mSession ended (exit code: ${message.code})\x1b[0m`
            );
            break;
          case "error":
            terminal.writeln(`\r\n\x1b[31mError: ${message.message}\x1b[0m`);
            break;
        }
      } catch {
        // Treat as raw output if not JSON
        terminal.write(event.data);
      }
    };

    ws.onclose = () => {
      terminal.writeln("\r\n\x1b[33mDisconnected from lab environment.\x1b[0m");
      onConnectionChange?.(false);
    };

    ws.onerror = () => {
      terminal.writeln(
        "\r\n\x1b[31mConnection error. Please try again.\x1b[0m"
      );
      onConnectionChange?.(false);
    };

    // Send user input to WebSocket
    terminal.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "input", data }));
      }
    });

    // Handle terminal resize
    terminal.onResize(({ cols, rows }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "resize", cols, rows }));
      }
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [websocketUrl, onConnectionChange]);

  useEffect(() => {
    const cleanup = connect();

    return () => {
      cleanup?.();
      wsRef.current?.close();
      terminalRef.current?.dispose();
    };
  }, [connect]);

  return (
    <div
      ref={containerRef}
      role="region"
      aria-label="Lab terminal"
      className={cn(
        "h-full min-h-[300px] w-full overflow-hidden rounded-md border border-border bg-[#1a1b26]",
        className
      )}
    />
  );
}
