"use client";
import React from "react";

const shimmerStyle = {
  background: "linear-gradient(90deg, var(--bg-2) 25%, var(--bg-3) 50%, var(--bg-2) 75%)",
  backgroundSize: "200% 100%",
  animation: "zeroq-shimmer 1.4s infinite linear",
};

export function Skeleton({ width = "100%", height = 16, circle = false, radius = 8, style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: circle ? "999px" : radius,
        ...shimmerStyle,
        ...style,
      }}
    />
  );
}

export function SkeletonCard({ children, style = {} }) {
  return (
    <div className="card" style={{ padding: 18, ...style }}>
      {children}
    </div>
  );
}

export function SkeletonStat({ count = 4 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i}>
          <Skeleton width={80} height={12} style={{ marginBottom: 14 }} />
          <Skeleton width={90} height={28} radius={6} />
        </SkeletonCard>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: "0 6px" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} width="60%" height={12} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, alignItems: "center", padding: "12px 6px", borderBottom: "1px solid var(--line-soft)" }}>
          {Array.from({ length: cols }).map((__, c) => (
            <Skeleton key={c} width={c === 0 ? "85%" : "55%"} height={12} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPlan() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonCard style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Skeleton width={44} height={44} circle />
        <div style={{ flex: 1 }}>
          <Skeleton width={240} height={16} style={{ marginBottom: 10 }} />
          <Skeleton width="80%" height={13} />
        </div>
      </SkeletonCard>
      <SkeletonStat count={4} />
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i} style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingBottom: 14, borderBottom: "1px solid var(--line)", marginBottom: 14 }}>
            <Skeleton width={180} height={15} />
            <Skeleton width={80} height={20} radius={999} />
            <div style={{ flex: 1 }} />
            <Skeleton width={80} height={12} />
          </div>
          {Array.from({ length: 4 }).map((__, j) => (
            <div key={j} style={{ display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: j === 3 ? "none" : "1px solid var(--line-soft)" }}>
              <Skeleton width={100} height={12} />
              <Skeleton width="70%" height={12} />
              <div style={{ flex: 1 }} />
              <Skeleton width={80} height={22} radius={7} />
              <Skeleton width={40} height={12} />
            </div>
          ))}
        </SkeletonCard>
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonCard style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Skeleton width={40} height={40} circle />
        <div style={{ flex: 1 }}>
          <Skeleton width={220} height={15} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={12} />
        </div>
      </SkeletonCard>
      <div style={{ display: "grid", gridTemplateColumns: "300px 280px 1fr", gap: 16 }}>
        <SkeletonCard><Skeleton width="100%" height={180} /></SkeletonCard>
        <SkeletonCard><Skeleton width="100%" height={180} /></SkeletonCard>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i}><Skeleton width="100%" height="100%" /></SkeletonCard>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.55fr 1fr", gap: 16 }}>
        <SkeletonCard><Skeleton width="100%" height={140} /></SkeletonCard>
        <SkeletonCard><Skeleton width="100%" height={140} /></SkeletonCard>
      </div>
      <SkeletonCard><SkeletonTable rows={5} cols={6} /></SkeletonCard>
    </div>
  );
}

export function SkeletonInventory() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={320} height={36} radius={10} />
        <div style={{ flex: 1 }} />
        <Skeleton width={110} height={22} radius={999} />
        <Skeleton width={120} height={36} radius={10} />
        <Skeleton width={260} height={36} radius={10} />
      </div>
      <SkeletonCard><SkeletonTable rows={8} cols={8} /></SkeletonCard>
      <SkeletonCard style={{ display: "flex", gap: 12 }}>
        <Skeleton width={20} height={20} circle />
        <Skeleton width="80%" height={14} />
      </SkeletonCard>
    </div>
  );
}

export function SkeletonCerts() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={110} height={22} radius={999} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        <SkeletonCard><Skeleton width="100%" height={140} /></SkeletonCard>
        <SkeletonCard>
          <Skeleton width={140} height={34} style={{ marginBottom: 12 }} />
          <Skeleton width="90%" height={13} style={{ marginBottom: 14 }} />
          <div style={{ display: "flex", gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ flex: 1, padding: 12, background: "var(--bg-inset)", borderRadius: 10, border: "1px solid var(--line)" }}>
                <Skeleton width="70%" height={11} style={{ marginBottom: 8 }} />
                <Skeleton width={40} height={22} />
              </div>
            ))}
          </div>
        </SkeletonCard>
      </div>
      <SkeletonCard><SkeletonTable rows={6} cols={6} /></SkeletonCard>
    </div>
  );
}

export function SkeletonHndl() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width={110} height={22} radius={999} />
      </div>
      <SkeletonCard><Skeleton width="100%" height={170} /></SkeletonCard>
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 16 }}>
        <SkeletonCard><SkeletonTable rows={5} cols={3} /></SkeletonCard>
        <SkeletonCard>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ padding: 12, background: "var(--bg-inset)", borderRadius: 10, border: "1px solid var(--line)" }}>
                <Skeleton width="60%" height={11} style={{ marginBottom: 8 }} />
                <Skeleton width={50} height={20} />
              </div>
            ))}
          </div>
          <Skeleton width="100%" height={80} radius={10} />
        </SkeletonCard>
      </div>
    </div>
  );
}

export function SkeletonRepos() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonCard><Skeleton width="100%" height={80} /></SkeletonCard>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Skeleton width="60%" height={14} />
        <div style={{ flex: 1 }} />
        <Skeleton width={160} height={34} radius={8} />
      </div>
      <SkeletonStat count={5} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: 16 }}>
        <SkeletonCard><SkeletonTable rows={8} cols={1} /></SkeletonCard>
        <SkeletonCard><Skeleton width="100%" height={260} /></SkeletonCard>
      </div>
    </div>
  );
}

export function SkeletonRoadmap() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonCard style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Skeleton width={40} height={40} circle />
        <div style={{ flex: 1 }}>
          <Skeleton width={220} height={15} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={12} />
        </div>
      </SkeletonCard>
      <SkeletonCard><Skeleton width="100%" height={40} /></SkeletonCard>
      {Array.from({ length: 3 }).map((_, i) => (
        <SkeletonCard key={i}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <Skeleton width={24} height={24} circle />
            <Skeleton width={180} height={15} />
            <Skeleton width={80} height={20} radius={999} />
          </div>
          {Array.from({ length: 4 }).map((__, j) => (
            <div key={j} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderBottom: j === 3 ? "none" : "1px solid var(--line-soft)" }}>
              <Skeleton width={16} height={16} radius={4} />
              <Skeleton width="80%" height={12} />
            </div>
          ))}
        </SkeletonCard>
      ))}
    </div>
  );
}

export function SkeletonCompliance() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <SkeletonCard style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <Skeleton width={40} height={40} circle />
        <div style={{ flex: 1 }}>
          <Skeleton width={220} height={15} style={{ marginBottom: 8 }} />
          <Skeleton width="70%" height={12} />
        </div>
      </SkeletonCard>
      <SkeletonStat count={4} />
      <SkeletonCard><SkeletonTable rows={6} cols={4} /></SkeletonCard>
    </div>
  );
}

export function SkeletonSettings() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 800 }}>
      <SkeletonCard>
        <Skeleton width={140} height={16} style={{ marginBottom: 18 }} />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            <Skeleton width={120} height={12} />
            <Skeleton width="100%" height={40} radius={10} />
          </div>
        ))}
        <Skeleton width={140} height={38} radius={8} />
      </SkeletonCard>
      <SkeletonCard>
        <Skeleton width={160} height={16} style={{ marginBottom: 18 }} />
        <Skeleton width="100%" height={120} radius={10} />
      </SkeletonCard>
    </div>
  );
}

export function SkeletonAssistant() {
  return (
    <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16, height: "100%" }}>
      <SkeletonCard style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Skeleton width={30} height={30} circle />
          <Skeleton width="70%" height={60} radius={12} />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <Skeleton width="50%" height={44} radius={12} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Skeleton width={30} height={30} circle />
          <Skeleton width="60%" height={80} radius={12} />
        </div>
      </SkeletonCard>
    </div>
  );
}
