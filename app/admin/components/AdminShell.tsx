"use client";

import Link from "next/link";
import { useIsMobile } from "@/hooks/useMediaQuery";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "📊" },
  { href: "/admin/maya", label: "Maya Playground", icon: "🤖" },
  { href: "/admin/library", label: "Library & Atlas", icon: "📚" },
  { href: "/admin/agents", label: "Agents", icon: "⚡" },
  { href: "/admin/brain", label: "Brain Loop", icon: "🧠" },
  { href: "/admin/accounts", label: "FA Accounts", icon: "👥" },
  { href: "/dashboard", label: "← FA Dashboard", icon: "↩" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile(768);

  if (isMobile) {
    return (
      <div style={{ minHeight: "100vh", background: "#F7F4F0", display: "flex", flexDirection: "column" }}>
        {/* Mobile top bar */}
        <header
          style={{
            background: "#FFFFFF",
            borderBottom: "1px solid #E8E2DA",
            padding: "12px 16px 0 16px",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <Link href="/admin" style={{ textDecoration: "none", display: "block", marginBottom: 10 }}>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#1A1410" }}>
              espresso<span style={{ color: "#BA7517" }}>.</span>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, color: "#BA7517", letterSpacing: "0.1em", textTransform: "uppercase", marginLeft: 8 }}>
                Admin
              </span>
            </div>
          </Link>
          <nav
            style={{
              display: "flex",
              gap: 6,
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
              paddingBottom: 12,
              scrollbarWidth: "none",
            }}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 14px",
                  borderRadius: 18,
                  background: "#FBFAF7",
                  border: "1px solid #E8E2DA",
                  textDecoration: "none",
                  color: "#1A1410",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 13 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </header>
        <main style={{ flex: 1, overflowX: "hidden" }}>{children}</main>
      </div>
    );
  }

  // Desktop: original sidebar layout
  return (
    <div style={{ display: "flex", height: "100vh", background: "#F7F4F0" }}>
      <div
        style={{
          width: 220,
          flexShrink: 0,
          background: "#FFFFFF",
          borderRight: "1px solid #E8E2DA",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8E2DA" }}>
          <Link href="/admin" style={{ textDecoration: "none" }}>
            <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#1A1410" }}>
              espresso<span style={{ color: "#BA7517" }}>.</span>
            </div>
            <div
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: 10,
                color: "#BA7517",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Admin
            </div>
          </Link>
        </div>
        <nav style={{ flex: 1, padding: "16px 0" }}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 24px",
                textDecoration: "none",
                color: "#1A1410",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <main style={{ flex: 1, overflowY: "auto" }}>{children}</main>
    </div>
  );
}
