"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";

type ReconcileResult = {
  reconciled: { id: string; title: string; sha: string; committedAt: string }[];
  swept: { id: string; title: string; minutesStale: number }[];
  untouched: { id: string; title: string }[];
  summary: {
    reconciled_count: number;
    swept_count: number;
    untouched_count: number;
    total_running_at_start: number;
  };
};

export default function ReconcilePanel() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReconcileResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile(768);

  async function trigger() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/brain/reconcile", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setResult(json);
    } catch (e: any) {
      setError(e?.message || "Reconcile failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section
      style={{
        background: "#FFFFFF",
        border: "1px solid #E8E2DA",
        borderRadius: 10,
        padding: "18px 22px",
        marginBottom: 20,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 11,
            color: "#9B9088",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Order Reconciler
        </div>
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "#6B6460" }}>
          match running orders against [brain] commits, sweep stale &gt; 60min
        </div>
      </div>

      {error && (
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            color: "#A32D2D",
            background: "#FCEBEB",
            border: "1px solid #F7C1C1",
            padding: "10px 12px",
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={trigger}
          disabled={running}
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            padding: isMobile ? "12px 18px" : "8px 18px",
            borderRadius: 6,
            border: "none",
            cursor: running ? "not-allowed" : "pointer",
            background: running ? "#E8E2DA" : "#BA7517",
            color: running ? "#9B9088" : "#FFFFFF",
            fontWeight: 500,
            transition: "background 0.15s",
            width: isMobile ? "100%" : "auto",
            minHeight: 44,
          }}
        >
          {running ? "Running…" : "Reconcile orders"}
        </button>

        {result && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 12,
              padding: "8px 14px",
              borderRadius: 6,
              border: "1px solid #E8E2DA",
              background: "#FFFFFF",
              color: "#6B6460",
              cursor: "pointer",
            }}
          >
            Reload list
          </button>
        )}
      </div>

      {result && (
        <div style={{ marginTop: 16, fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "#1A1410" }}>
          <div style={{ marginBottom: 12, color: "#6B6460" }}>
            {result.summary.total_running_at_start} running at start ·{" "}
            <strong style={{ color: "#3A8A4F" }}>{result.summary.reconciled_count} reconciled</strong>
            {" · "}
            <strong style={{ color: "#A32D2D" }}>{result.summary.swept_count} swept</strong>
            {" · "}
            <span style={{ color: "#6B6460" }}>{result.summary.untouched_count} untouched</span>
          </div>

          {result.reconciled.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9088", marginBottom: 6 }}>
                Reconciled → done
              </div>
              {result.reconciled.map((r) => (
                <div key={r.id} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#1A1410", padding: "5px 0", borderBottom: "1px solid #F1EFE8" }}>
                  <span style={{ color: "#BA7517" }}>{r.sha}</span> · {r.title}
                </div>
              ))}
            </div>
          )}

          {result.swept.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9088", marginBottom: 6 }}>
                Swept → failed
              </div>
              {result.swept.map((s) => (
                <div key={s.id} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#6B6460", padding: "5px 0", borderBottom: "1px solid #F1EFE8" }}>
                  {s.minutesStale}m · {s.title}
                </div>
              ))}
            </div>
          )}

          {result.untouched.length > 0 && (
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#9B9088", marginBottom: 6 }}>
                Untouched (still recent or no match)
              </div>
              {result.untouched.map((u) => (
                <div key={u.id} style={{ fontFamily: "DM Mono, monospace", fontSize: 12, color: "#9B9088", padding: "5px 0" }}>
                  {u.title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
