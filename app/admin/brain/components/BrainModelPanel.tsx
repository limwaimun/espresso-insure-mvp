"use client";

import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/useMediaQuery";

type SupportedModel = { id: string; label: string; note?: string };
type Current = { model: string; updated_at: string; updated_by: string | null };

export default function BrainModelPanel() {
  const [current, setCurrent] = useState<Current | null>(null);
  const [supported, setSupported] = useState<SupportedModel[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const isMobile = useIsMobile(768);

  // Initial load
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/brain/settings");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (cancelled) return;
        setCurrent(json.current);
        setSupported(json.supported || []);
        setSelected(json.current?.model || "");
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const isDirty = current && selected && selected !== current.model;

  async function save() {
    if (!isDirty) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/brain/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: selected }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setCurrent(json.current);
      setSelected(json.current?.model || "");
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 3000);
    } catch (e: any) {
      setError(e?.message || "Save failed");
    } finally {
      setSaving(false);
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
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 14 }}>
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 11,
            color: "#9B9088",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Brain Model
        </div>
        {current && (
          <div
            style={{
              fontFamily: "DM Mono, monospace",
              fontSize: 11,
              color: "#6B6460",
            }}
          >
            current: {current.model}
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "#6B6460" }}>
          Loading…
        </div>
      ) : error ? (
        <div
          style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13,
            color: "#A32D2D",
            background: "#FCEBEB",
            border: "1px solid #F7C1C1",
            padding: "10px 12px",
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: isMobile ? "stretch" : "center", gap: 10, flexWrap: "wrap", flexDirection: isMobile ? "column" : "row" }}>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={saving}
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 14,
              padding: "8px 12px",
              border: "1px solid #E8E2DA",
              borderRadius: 6,
              background: "#FFFFFF",
              color: "#1A1410",
              minWidth: isMobile ? 0 : 280,
              width: isMobile ? "100%" : "auto",
              maxWidth: "100%",
            }}
          >
            {supported.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
                {m.note ? ` — ${m.note}` : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={save}
            disabled={!isDirty || saving}
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: 13,
              padding: isMobile ? "12px 18px" : "8px 18px",
              borderRadius: 6,
              border: "none",
              cursor: !isDirty || saving ? "not-allowed" : "pointer",
              background: !isDirty || saving ? "#E8E2DA" : "#BA7517",
              color: !isDirty || saving ? "#9B9088" : "#FFFFFF",
              fontWeight: 500,
              transition: "background 0.15s",
              width: isMobile ? "100%" : "auto",
              minHeight: 44,
            }}
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {savedAt && (
            <div
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: 12,
                color: "#3A8A4F",
              }}
            >
              ✓ Saved
            </div>
          )}

          {current?.updated_at && !savedAt && (
            <div
              style={{
                fontFamily: "DM Mono, monospace",
                fontSize: 11,
                color: "#9B9088",
                marginLeft: isMobile ? 0 : "auto",
              }}
              title={current.updated_by ? `by ${current.updated_by}` : undefined}
            >
              updated {new Date(current.updated_at).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
