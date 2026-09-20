import { useEffect, useState } from "react";
import type { Operation } from "./index";
interface State {
  task: string;
  inputFormat: "text" | "json";
  ready: boolean;
  stale: boolean;
  revision: number;
  busy: string | null;
  error: string | null;
}
export function useWorkbench() {
  const [state, setState] = useState<State | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [report, setReport] = useState<Operation | null>(null);
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/state");
        if (!response.ok) {
          throw new Error("Workbench disconnected. Check the terminal.");
        }
        const next = await response.json();
        if (active) {
          setState(next);
        }
      } catch (cause) {
        if (active) {
          setError(String(cause));
        }
      }
    };
    void refresh();
    const timer = setInterval(refresh, 1000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);
  async function run(command: string, data = {}) {
    setPending(true);
    setError(null);
    setReport(null);
    try {
      const response = await fetch(`/api/${command}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const value = await response.json();
      if (!response.ok) {
        throw new Error(value.error);
      }
      setReport({ command, ...value });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setPending(false);
    }
  }
  return { state, error, pending: pending || !!state?.busy, report, run };
}
