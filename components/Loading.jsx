"use client";
import React from "react";
import { Icon, Spinner } from "./primitives";

export default function Loading({ message = "Loading ZeroQ…" }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100vh", width: "100vw", background: "#0a0b14", gap: 18,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14, background: "rgba(99,102,241,0.15)",
        border: "1px solid rgba(99,102,241,0.25)", display: "flex", alignItems: "center",
        justifyContent: "center", color: "#818cf8", boxShadow: "0 0 24px -6px rgba(99,102,241,0.4)",
      }}>
        <Icon name="ai" size={28} fill="currentColor" stroke={0} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#9ca3af", fontSize: 14, fontWeight: 500 }}>
        <Spinner size={18} />
        <span>{message}</span>
      </div>
    </div>
  );
}
